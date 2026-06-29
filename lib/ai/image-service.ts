import { uploadGeneratedImage } from "@/lib/storage/s3";
import { generateRunwayProductCampaignImage } from "@/lib/ai/runway-recipe-service";

export type MarketingImageType = "poster" | "reel_thumbnail" | "story" | "banner" | "square";

type GenerateMarketingImageParams = {
  prompt: string;
  type: MarketingImageType;
  brandColors?: string[];
  brandName?: string;
  campaignId?: string;
};

const dimensions: Record<MarketingImageType, { width: number; height: number }> = {
  poster: { width: 1080, height: 1350 },
  reel_thumbnail: { width: 1080, height: 1920 },
  story: { width: 1080, height: 1920 },
  banner: { width: 1200, height: 628 },
  square: { width: 1080, height: 1080 },
};

const styleByType: Record<MarketingImageType, string> = {
  poster: "impressive advertising poster, bold legible product typography, premium composition, high quality, photorealistic",
  reel_thumbnail: "vertical short-form video thumbnail, dramatic product framing, clean composition, high quality, photorealistic",
  story: "vertical social story creative, immersive composition, clean negative space, high quality, photorealistic",
  banner: "wide social media advertisement banner, clear focal point, clean composition, high quality, photorealistic",
  square: "square social media advertisement creative, centered composition, clean layout, high quality, photorealistic",
};

/**
 * Builds a provider-ready marketing image prompt from campaign copy and brand context.
 *
 * @param params Prompt, image type, and optional brand context.
 * @returns Enriched prompt string for image generation providers.
 */
export function buildMarketingPrompt(params: GenerateMarketingImageParams) {
  const parts = [params.prompt.trim(), styleByType[params.type]];
  if (params.brandColors?.length) parts.push(`color palette: ${params.brandColors.join(", ")}`);
  if (params.brandName) parts.push(`brand: ${params.brandName}`);
  parts.push("render the brand or product name clearly as part of the poster design, no watermarks, no spelling errors");
  return parts.filter(Boolean).join(", ");
}

/**
 * Generates a marketing image URL using Hugging Face when configured, then falls back
 * to a public Pollinations.AI URL if Hugging Face or S3 upload fails.
 *
 * @param params Prompt, target creative type, optional brand context, and optional campaign ID for S3 storage.
 * @returns Public image URL.
 */
export async function generateMarketingImage(params: GenerateMarketingImageParams) {
  const prompt = buildMarketingPrompt(params);
  const size = dimensions[params.type];
  const runwayProductImage = process.env.RUNWAY_PRODUCT_IMAGE_URI;

  if ((process.env.RUNWAY_API_KEY || process.env.RUNWAY_API) && runwayProductImage) {
    try {
      const result = await generateRunwayProductCampaignImage({
        imageUri: runwayProductImage,
        prompt,
      });
      return result.imageUrl;
    } catch (error) {
      console.error("Runway product campaign image generation failed; falling back to other image providers.", {
        error: error instanceof Error ? error.message : String(error),
        type: params.type,
      });
    }
  }

  const hfToken = process.env.HF_TOKEN;

  if (hfToken) {
    try {
      const response = await fetch("https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            width: size.width,
            height: size.height,
          },
        }),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => response.statusText);
        throw new Error(`Hugging Face image generation failed: ${body || response.statusText}`);
      }

      const bytes = new Uint8Array(await response.arrayBuffer());
      const uploaded = await uploadGeneratedImage({
        bytes,
        campaignId: params.campaignId || "generated",
        contentType: response.headers.get("content-type") || "image/png",
      });
      return uploaded.url;
    } catch (error) {
      console.error("Hugging Face image generation failed; falling back to Pollinations.", {
        error: error instanceof Error ? error.message : String(error),
        type: params.type,
      });
    }
  }

  const seed = Math.floor(Math.random() * 1_000_000_000);
  const query = new URLSearchParams({
    width: String(size.width),
    height: String(size.height),
    nologo: "true",
    seed: String(seed),
  });
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${query.toString()}`;
}

/**
 * Maps a social platform to the best marketing image format for ad creative.
 *
 * @param platform Social platform slug or enum-like value.
 * @returns Marketing image type for that platform.
 */
export function getImageTypeForPlatform(platform: string): MarketingImageType {
  switch (platform.toLowerCase()) {
    case "instagram":
      return "poster";
    case "facebook":
    case "linkedin":
      return "banner";
    case "x":
    case "twitter":
      return "square";
    case "tiktok":
      return "reel_thumbnail";
    default:
      return "square";
  }
}

/**
 * Returns the pixel dimensions for a marketing image type.
 *
 * @param type Marketing image type.
 * @returns Width and height in pixels.
 */
export function getMarketingImageDimensions(type: MarketingImageType) {
  return dimensions[type];
}
