import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getSafeAbsoluteUrl } from "@/lib/app-url";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateRunwayProductCampaignImage } from "@/lib/ai/runway-recipe-service";
import { uploadGeneratedImage } from "@/lib/storage/s3";
import { toReadableErrorMessage } from "@/lib/utils/error-message";
import { requireWorkspaceMembership } from "@/lib/utils/workspace";

export const runtime = "nodejs";

type CampaignForImage = NonNullable<Awaited<ReturnType<typeof loadCampaignForImage>>>;

function imageProvider() {
  if (process.env.IMAGE_PROVIDER) return process.env.IMAGE_PROVIDER;
  if (process.env.RUNWAY_API_KEY || process.env.RUNWAY_API) return "runway";
  if (process.env.GEMINI_API_KEY || process.env.GEMINI_API) return "gemini";
  if (process.env.IMAGE_API || process.env.OPENAI_API_KEY) return "openai";
  if (process.env.OPENROUTER_API_KEY) return "openrouter";
  return "openai";
}

async function downloadImage(url: string, headers?: HeadersInit) {
  const imageResponse = await fetch(url, headers ? { headers } : undefined);
  if (!imageResponse.ok) throw new Error("Generated image URL could not be downloaded.");
  return {
    bytes: Buffer.from(await imageResponse.arrayBuffer()),
    contentType: imageResponse.headers.get("content-type") || "image/png",
  };
}

async function generateImage(prompt: string, productImageUri?: string) {
  const provider = imageProvider();
  if (provider === "runway") {
    const imageUri = productImageUri || process.env.RUNWAY_PRODUCT_IMAGE_URI;
    if (!imageUri) throw new Error("Runway product campaign images require RUNWAY_PRODUCT_IMAGE_URI or imageUrl in the request.");
    const result = await generateRunwayProductCampaignImage({ imageUri, prompt });
    const image = await downloadImage(result.imageUrl);
    return { ...image, model: result.model, providerResponse: result.providerResponse };
  }
  if (provider === "gemini") {
    const apiKey = process.env.GEMINI_API || process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image-preview";
    if (!apiKey) throw new Error("Gemini image generation requires GEMINI_API_KEY or GEMINI_API.");
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseModalities: ["IMAGE"] } }),
    });
    const body = await response.json().catch(() => ({})) as { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> } }>; error?: { message?: string } };
    if (!response.ok) throw new Error(body.error?.message || "Gemini image generation failed.");
    const image = body.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData;
    if (!image?.data) throw new Error("Gemini did not return image data.");
    return { bytes: Buffer.from(image.data, "base64"), contentType: image.mimeType || "image/png", model, providerResponse: body };
  }
  if (provider === "openrouter") {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_IMAGE_MODEL;
    if (!apiKey || !model) throw new Error("OpenRouter image generation requires OPENROUTER_API_KEY and OPENROUTER_IMAGE_MODEL.");
    const baseUrl = (process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1").replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/images`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": getSafeAbsoluteUrl(process.env.OPENROUTER_HTTP_REFERER),
        "X-OpenRouter-Title": process.env.OPENROUTER_APP_TITLE || "MarketingOS AI",
      },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        output_format: process.env.OPENROUTER_IMAGE_FORMAT || "png",
        size: process.env.OPENROUTER_IMAGE_SIZE || "1024x1024",
      }),
    });
    const body = await response.json().catch(() => ({})) as { data?: Array<{ b64_json?: string; url?: string }>; error?: unknown };
    if (!response.ok) throw new Error(toReadableErrorMessage(body.error || body) || "OpenRouter image generation failed.");
    const image = body.data?.[0];
    if (image?.b64_json) return { bytes: Buffer.from(image.b64_json, "base64"), contentType: `image/${process.env.OPENROUTER_IMAGE_FORMAT || "png"}`, model, providerResponse: body };
    if (image?.url) {
      return { ...await downloadImage(image.url), model, providerResponse: body };
    }
    throw new Error("OpenRouter did not return image data.");
  }
  if (provider !== "openai") throw new Error(`Unsupported IMAGE_PROVIDER: ${provider}`);
  const apiKey = process.env.IMAGE_API || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI image generation is not configured. Set IMAGE_API or OPENAI_API_KEY.");
  const client = new OpenAI({ apiKey });
  const result = await client.images.generate({ model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1", prompt, size: "1024x1024", quality: "high" });
  const imageBase64 = result.data?.[0]?.b64_json;
  if (!imageBase64) throw new Error("The image provider did not return image data.");
  return { bytes: Buffer.from(imageBase64, "base64"), contentType: "image/png", model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1", providerResponse: { revisedPrompt: result.data?.[0]?.revised_prompt ?? null } };
}

async function loadCampaignForImage(campaignId: string) {
  return prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { workspace: { include: { brandProfile: true } } },
  });
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : [];
}

function platformLayout(platforms: string[]) {
  const primary = platforms[0]?.toLowerCase() || "";
  if (primary.includes("story") || primary.includes("reel") || primary.includes("tiktok") || primary.includes("youtube")) return "9:16 vertical story/reel layout";
  if (primary.includes("facebook")) return "4:5 feed layout";
  if (primary.includes("linkedin")) return "1.91:1 wide professional feed layout";
  if (primary === "x" || primary.includes("twitter")) return "16:9 wide social layout";
  return "1:1 Instagram feed layout";
}

function buildCampaignImagePrompt(userPrompt: string, campaign: CampaignForImage) {
  const brand = campaign.workspace.brandProfile;
  const productName = campaign.name;
  const companyName = brand?.companyName || campaign.workspace.name;
  const colors = stringArray(brand?.brandColors).join(", ");
  const products = stringArray(brand?.productsServices).join(", ");
  const brandColors = colors || "the brand's existing colors";
  const tone = brand?.toneOfVoice || "professional and persuasive";
  const offer = campaign.offer ? `Offer: ${campaign.offer}.` : "";
  const description = campaign.description ? `Campaign description: ${campaign.description}.` : "";
  const audience = campaign.targetAudience ? `Target audience: ${JSON.stringify(campaign.targetAudience)}.` : "";
  const platforms = stringArray(campaign.platforms);
  const layout = platformLayout(platforms);
  const website = brand?.website ? `Include a small website/footer destination: ${brand.website}.` : "";

  return [
    `Create a finished premium advertising image for ${productName} by ${companyName}, not a simple product photo.`,
    `Use a ${layout}; optimize hierarchy and spacing for ${platforms.join(", ") || "social feed"}.`,
    `Make ${productName} the hero object and occupy about 70% of the canvas with no cropping or duplicate products.`,
    `Place the brand name "${companyName}" prominently in the top area with a clean logo area only if a real logo is available.`,
    `Generate a short premium headline from the campaign context and render it with sharp modern typography; never use lorem ipsum or random text.`,
    "Add a persuasive subheadline, an offer badge when an offer exists, and a clear CTA button with action-oriented copy.",
    "Use award-winning commercial art direction: premium typography, professional spacing, cinematic studio lighting, soft shadows, realistic reflections, luxury gradients, premium textures, high contrast, modern minimalism, and clean composition.",
    `Use a color palette inspired by: ${brandColors}. Tone: ${tone}.`,
    website,
    products ? `Product/service context: ${products}.` : "",
    description,
    audience,
    offer,
    "Quality constraints: ultra realistic, 8K, commercial photography, luxury advertising, photorealistic, magazine quality, perfect alignment, no blurry text, no misspellings, no distorted logo, no distorted products, no watermark, no random AI artifacts, no malformed hands or faces.",
    `Additional creative direction from the user: ${userPrompt}`,
  ].filter(Boolean).join(" ");
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const body = await request.json() as { prompt?: string; campaignId?: string; name?: string; type?: "IMAGE" | "CAROUSEL_SLIDE" | "AD_BANNER"; imageUrl?: string };
  if (!body.prompt || body.prompt.length > 4000) return NextResponse.json({ ok: false, error: "A valid prompt is required." }, { status: 400 });
  if (!body.campaignId) return NextResponse.json({ ok: false, error: "campaignId is required." }, { status: 400 });
  const campaign = await loadCampaignForImage(body.campaignId);
  if (!campaign) return NextResponse.json({ ok: false, error: "Campaign not found." }, { status: 404 });
  await requireWorkspaceMembership(campaign.workspaceId, "EDITOR");
  try {
    const enrichedPrompt = buildCampaignImagePrompt(body.prompt, campaign);
    const generated = await generateImage(enrichedPrompt, body.imageUrl);
    const stored = await uploadGeneratedImage({ bytes: generated.bytes, campaignId: campaign.id, contentType: generated.contentType });
    const asset = await prisma.campaignAsset.create({
      data: {
        campaignId: campaign.id,
        name: body.name || "Generated campaign creative",
        type: body.type === "CAROUSEL_SLIDE" ? "CAROUSEL_SLIDE" : "IMAGE",
        url: stored.url,
        prompt: enrichedPrompt,
        generationModel: generated.model,
        providerResponse: { key: stored.key, response: generated.providerResponse } as never,
      },
    });
    return NextResponse.json({ ok: true, data: asset }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: toReadableErrorMessage(error) || "Image generation failed" }, { status: 502 });
  }
}
