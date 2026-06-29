import { createKlingVideoTask, getKlingVideoTask } from "@/lib/ai/kling-video-service";
import { prisma } from "@/lib/db";

type GenerateVideoInput = {
  prompt: string;
  imageUrl?: string;
  duration?: number;
  aspectRatio?: string;
  campaignId: string;
};

export async function generateVideoWithKling({
  prompt,
  imageUrl,
  duration = 5,
  aspectRatio = "9:16",
  campaignId,
}: GenerateVideoInput) {
  const asset = await prisma.generatedAsset.create({
    data: {
      campaignId,
      type: "VIDEO",
      status: "PROCESSING",
      provider: "kling",
      prompt,
      metadata: { imageUrl, duration, aspectRatio },
    },
  });

  try {
    let result = await createKlingVideoTask({ prompt: imageUrl ? `${prompt}\nReference image: ${imageUrl}` : prompt, duration, aspectRatio });
    const pollAttempts = Number(process.env.KLING_POLL_ATTEMPTS || 0);

    for (let attempt = 0; result.taskId && result.status === "PROCESSING" && attempt < pollAttempts; attempt++) {
      await sleep(Number(process.env.KLING_POLL_INTERVAL_MS || 5000));
      result = await getKlingVideoTask(result.taskId);
    }

    return prisma.generatedAsset.update({
      where: { id: asset.id },
      data: {
        status: result.status === "COMPLETED" ? "COMPLETED" : result.status === "FAILED" ? "FAILED" : "PROCESSING",
        url: result.videoUrl,
        externalJobId: result.taskId,
        model: result.model,
        providerResponse: result.providerResponse as never,
        errorMessage: result.status === "FAILED" ? result.providerStatus || "Kling generation failed." : undefined,
      },
    });
  } catch (error) {
    return prisma.generatedAsset.update({
      where: { id: asset.id },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Kling video generation failed.",
        providerResponse: {
          recoverable: true,
          note: "Video generation failed; pipeline continued with the generated video prompt.",
        },
      },
    });
  }
}

export async function pollKlingGeneratedAsset(assetId: string) {
  const asset = await prisma.generatedAsset.findUnique({ where: { id: assetId } });
  if (!asset?.externalJobId) throw new Error("Generated asset does not have a Kling job ID.");
  const result = await getKlingVideoTask(asset.externalJobId);
  return prisma.generatedAsset.update({
    where: { id: assetId },
    data: {
      status: result.status === "COMPLETED" ? "COMPLETED" : result.status === "FAILED" ? "FAILED" : "PROCESSING",
      url: result.videoUrl,
      providerResponse: result.providerResponse as never,
      errorMessage: result.status === "FAILED" ? result.providerStatus || "Kling generation failed." : undefined,
    },
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
