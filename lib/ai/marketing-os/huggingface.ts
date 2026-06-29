import { prisma } from "@/lib/db";
import { uploadGeneratedImage } from "@/lib/storage/s3";

type GenerateImageInput = {
  prompt: string;
  negativePrompt?: string;
  campaignId: string;
  aspectRatio?: string;
};

export async function generateImageWithHuggingFace({
  prompt,
  negativePrompt,
  campaignId,
  aspectRatio,
}: GenerateImageInput) {
  const apiKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
  const model = process.env.HUGGINGFACE_IMAGE_MODEL || "black-forest-labs/FLUX.1-schnell";
  const size = imageSizeForAspectRatio(aspectRatio);

  const asset = await prisma.generatedAsset.create({
    data: {
      campaignId,
      type: "IMAGE",
      status: "PROCESSING",
      provider: "huggingface",
      model,
      prompt,
      negativePrompt,
    },
  });

  try {
    if (!apiKey) throw new Error("HUGGINGFACE_API_KEY or HF_TOKEN is not configured.");

    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          negative_prompt: negativePrompt || "watermark, blurry text, misspelled words, distorted logo, distorted product, duplicate product, cropped product, low quality, random artifacts, messy layout, clutter, malformed hands, malformed faces",
          width: Number(process.env.HUGGINGFACE_IMAGE_WIDTH || size.width),
          height: Number(process.env.HUGGINGFACE_IMAGE_HEIGHT || size.height),
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => response.statusText);
      throw new Error(body || response.statusText);
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const bytes = new Uint8Array(await response.arrayBuffer());
    let url: string | undefined;
    let base64Ref: string | undefined;

    try {
      const uploaded = await uploadGeneratedImage({ bytes, campaignId, contentType });
      url = uploaded.url;
    } catch {
      base64Ref = `data:${contentType};base64,${Buffer.from(bytes).toString("base64")}`;
    }

    return prisma.generatedAsset.update({
      where: { id: asset.id },
      data: {
        status: "COMPLETED",
        url,
        base64Ref,
        providerResponse: { contentType, persistedTo: url ? "s3" : "database" },
      },
    });
  } catch (error) {
    return prisma.generatedAsset.update({
      where: { id: asset.id },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Hugging Face image generation failed.",
        providerResponse: {
          recoverable: true,
          note: "Image generation failed; pipeline continued with the generated creative prompt.",
        },
      },
    });
  }
}

function imageSizeForAspectRatio(aspectRatio?: string) {
  switch ((aspectRatio || "").trim()) {
    case "9:16":
      return { width: 768, height: 1344 };
    case "4:5":
      return { width: 896, height: 1120 };
    case "1.91:1":
      return { width: 1344, height: 704 };
    case "16:9":
      return { width: 1344, height: 768 };
    case "1:1":
    default:
      return { width: 1024, height: 1024 };
  }
}
