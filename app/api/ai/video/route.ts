import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getVideoProvider, type VideoGenerationResult } from "@/lib/ai/video-provider";
import { buildAutoProductReelPrompt } from "@/lib/runway/service";
import { prisma } from "@/lib/db";
import { uploadGeneratedVideo } from "@/lib/storage/s3";
import { toReadableErrorMessage } from "@/lib/utils/error-message";
import { requireWorkspaceMembership } from "@/lib/utils/workspace";

export const runtime = "nodejs";

type VideoBody = {
  campaignId?: string;
  prompt?: string;
  productName?: string;
  name?: string;
  aspectRatio?: string;
  duration?: number;
};

const allowedDurations = new Set([3, 4, 5, 6, 7, 8]);

async function requireCampaignAccess(campaignId?: string) {
  if (!campaignId) throw new Error("campaignId is required.");
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { workspace: { include: { brandProfile: true } } },
  });
  if (!campaign) throw new Error("Campaign not found.");
  await requireWorkspaceMembership(campaign.workspaceId, "EDITOR");
  return campaign;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : [];
}

function buildPrompt(campaign: Awaited<ReturnType<typeof requireCampaignAccess>>, body: VideoBody) {
  const brand = campaign.workspace.brandProfile;
  const productName = body.productName || brand?.productsServices?.[0] || campaign.name;
  const basePrompt = buildAutoProductReelPrompt({
    productName,
    description: campaign.description || campaign.goal,
    offer: campaign.offer,
    brandColors: stringArray(brand?.brandColors),
    toneOfVoice: brand?.toneOfVoice,
  });
  return body.prompt?.trim() ? `${basePrompt} Extra direction: ${body.prompt.trim()}` : basePrompt;
}

async function storeVideoAsset(input: {
  campaignId: string;
  name?: string;
  prompt?: string;
  result: VideoGenerationResult;
}) {
  if (!input.result.videoUrl && !input.result.videoBytes) return null;
  let url = input.result.videoUrl || "";
  let storageKey: string | undefined;

  try {
    const videoBytes = input.result.videoBytes
      ? { bytes: input.result.videoBytes, contentType: input.result.contentType || "video/mp4" }
      : await downloadVideoBytes(input.result.videoUrl);
    const stored = await uploadGeneratedVideo({
      bytes: videoBytes.bytes,
      campaignId: input.campaignId,
      contentType: videoBytes.contentType,
    });
    url = stored.url;
    storageKey = stored.key;
  } catch (error) {
    if (!input.result.videoUrl) throw error;
    console.warn("[video] Could not persist generated video; saving provider URL instead.", {
      campaignId: input.campaignId,
      provider: input.result.provider,
      taskId: input.result.taskId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return prisma.campaignAsset.create({
    data: {
      campaignId: input.campaignId,
      name: input.name || "Product reel",
      type: "VIDEO",
      url,
      prompt: input.prompt,
      generationModel: input.result.model,
      providerResponse: {
        key: storageKey,
        provider: input.result.provider,
        taskId: input.result.taskId,
        status: input.result.providerStatus,
        errorMessage: input.result.errorMessage,
        response: input.result.providerResponse,
        sourceUrl: input.result.videoUrl,
      } as never,
    },
  });
}

async function downloadVideoBytes(videoUrl?: string) {
  if (!videoUrl) throw new Error("Generated video did not include downloadable video data.");
  const videoResponse = await fetch(videoUrl);
  if (!videoResponse.ok) throw new Error("Generated video could not be downloaded.");
  return {
    bytes: new Uint8Array(await videoResponse.arrayBuffer()),
    contentType: videoResponse.headers.get("content-type") || "video/mp4",
  };
}

function successResponse(result: VideoGenerationResult, asset: Awaited<ReturnType<typeof storeVideoAsset>>) {
  return NextResponse.json({
    ok: true,
    data: {
      status: result.status,
      taskId: result.taskId,
      providerStatus: result.providerStatus,
      progress: result.progress,
      asset,
    },
  }, { status: asset ? 201 : 202 });
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const body = await request.json() as VideoBody;
    if (body.prompt && body.prompt.length > 3000) return NextResponse.json({ ok: false, error: "Extra direction must be 3000 characters or fewer." }, { status: 400 });
    if (body.duration !== undefined && !allowedDurations.has(body.duration)) return NextResponse.json({ ok: false, error: "Duration must be one of 3, 4, 5, 6, 7, or 8 seconds." }, { status: 400 });
    const campaign = await requireCampaignAccess(body.campaignId);
    const prompt = buildPrompt(campaign, body);
    const provider = getVideoProvider();
    const result = await provider.create({
      prompt,
      aspectRatio: body.aspectRatio || "9:16",
      duration: body.duration,
    });
    if (result.status === "FAILED") throw new Error(result.errorMessage || "Video generation failed.");
    const asset = result.status === "COMPLETED" ? await storeVideoAsset({
      campaignId: campaign.id,
      name: body.name || "Product reel",
      prompt,
      result,
    }) : null;
    return successResponse(result, asset);
  } catch (error) {
    return NextResponse.json({ ok: false, error: toReadableErrorMessage(error) || "Video generation failed" }, { status: 502 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const url = new URL(request.url);
    const campaignId = url.searchParams.get("campaignId") || undefined;
    const taskId = url.searchParams.get("taskId");
    if (!taskId) return NextResponse.json({ ok: false, error: "taskId is required." }, { status: 400 });
    const campaign = await requireCampaignAccess(campaignId);
    const provider = getVideoProvider();
    const result = await provider.poll(taskId);
    if (result.status === "FAILED") throw new Error(result.errorMessage || "Video generation failed.");
    const asset = result.status === "COMPLETED" ? await storeVideoAsset({
      campaignId: campaign.id,
      name: url.searchParams.get("name") || "Product reel",
      prompt: url.searchParams.get("prompt") || undefined,
      result,
    }) : null;
    return successResponse(result, asset);
  } catch (error) {
    return NextResponse.json({ ok: false, error: toReadableErrorMessage(error) || "Video status check failed" }, { status: 502 });
  }
}
