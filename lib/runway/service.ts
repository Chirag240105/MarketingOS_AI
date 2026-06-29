import type RunwayML from "@runwayml/sdk";
import { getRunwayClient } from "@/lib/runway/client";

export type VideoGenerationStatus = "PROCESSING" | "COMPLETED" | "FAILED";

export type VideoGenerationResult = {
  taskId?: string;
  status: VideoGenerationStatus;
  videoUrl?: string;
  model: string;
  provider: "runway";
  providerResponse: unknown;
  providerStatus?: string;
  progress?: number;
  errorMessage?: string;
};

export type GenerateVideoInput = {
  prompt: string;
  aspectRatio?: string;
  duration?: number;
};

type RunwayTask = Awaited<ReturnType<RunwayML["tasks"]["retrieve"]>>;

const runwayVideoProvider = "runway" as const;

function getVideoModel() {
  return process.env.RUNWAY_VIDEO_MODEL || "gen4.5";
}

function toRunwayRatio(aspectRatio?: string): "1280:720" | "720:1280" {
  if (aspectRatio === "16:9" || aspectRatio === "1280:720" || aspectRatio === "1920:1080") return "1280:720";
  return "720:1280";
}

function clampDuration(duration?: number) {
  const value = Number.isFinite(duration) ? Number(duration) : Number(process.env.RUNWAY_VIDEO_DURATION || 5);
  return Math.min(10, Math.max(2, Math.round(value || 5)));
}

function normalizePrompt(prompt: string) {
  const normalized = prompt.replace(/\s+/g, " ").trim();
  const limit = Number(process.env.RUNWAY_VIDEO_PROMPT_MAX_CHARS || 1000);
  return normalized.length <= limit ? normalized : normalized.slice(0, limit - 1).trim();
}

function isRetryable(error: unknown) {
  const status = typeof error === "object" && error && "status" in error ? Number((error as { status?: number }).status) : undefined;
  return !status || status === 408 || status === 409 || status === 429 || status >= 500;
}

async function withRetry<T>(label: string, work: () => Promise<T>): Promise<T> {
  const attempts = Math.max(1, Number(process.env.RUNWAY_OPERATION_RETRIES || 3));
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await work();
    } catch (error) {
      lastError = error;
      if (attempt >= attempts || !isRetryable(error)) break;
      const waitMs = Math.min(5000, 500 * 2 ** (attempt - 1));
      console.warn(`[runway:${label}] retrying failed operation`, {
        attempt,
        waitMs,
        error: error instanceof Error ? error.message : String(error),
      });
      await sleep(waitMs);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Runway ${label} failed.`);
}

function toResult(task: RunwayTask, model = getVideoModel()): VideoGenerationResult {
  if (task.status === "SUCCEEDED") {
    return {
      taskId: task.id,
      status: "COMPLETED",
      videoUrl: task.output[0],
      model,
      provider: runwayVideoProvider,
      providerResponse: task,
      providerStatus: task.status,
    };
  }

  if (task.status === "FAILED" || task.status === "CANCELLED") {
    const errorMessage = task.status === "FAILED" ? task.failure : "Runway task was cancelled.";
    return {
      taskId: task.id,
      status: "FAILED",
      model,
      provider: runwayVideoProvider,
      providerResponse: task,
      providerStatus: task.status,
      errorMessage,
    };
  }

  return {
    taskId: task.id,
    status: "PROCESSING",
    model,
    provider: runwayVideoProvider,
    providerResponse: task,
    providerStatus: task.status,
    progress: "progress" in task ? task.progress : undefined,
  };
}

export async function generateRunwayVideoFromText(input: GenerateVideoInput): Promise<VideoGenerationResult> {
  const client = getRunwayClient();
  const model = getVideoModel();
  const request = {
    model: model as "gen4.5",
    promptText: normalizePrompt(input.prompt),
    ratio: toRunwayRatio(input.aspectRatio),
    duration: clampDuration(input.duration),
  };

  console.info("[runway:video] creating text-to-video task", {
    model: request.model,
    ratio: request.ratio,
    duration: request.duration,
  });

  const created = await withRetry("create-video", () => client.textToVideo.create(request));
  return {
    taskId: created.id,
    status: "PROCESSING",
    model,
    provider: runwayVideoProvider,
    providerResponse: created,
    providerStatus: "PENDING",
  };
}

export async function pollRunwayVideoTask(taskId: string): Promise<VideoGenerationResult> {
  const client = getRunwayClient();
  const task = await withRetry("poll-video", () => client.tasks.retrieve(taskId));
  return toResult(task);
}

export async function waitForRunwayVideo(input: GenerateVideoInput): Promise<VideoGenerationResult> {
  const initial = await generateRunwayVideoFromText(input);
  if (!initial.taskId) throw new Error("Runway did not return a task ID.");

  const startedAt = Date.now();
  const timeoutMs = Number(process.env.RUNWAY_VIDEO_TIMEOUT_MS || 10 * 60 * 1000);
  const intervalMs = Number(process.env.RUNWAY_VIDEO_POLL_INTERVAL_MS || 5000);
  let current = initial;

  while (current.status === "PROCESSING") {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error(`Runway video generation timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
    }
    await sleep(intervalMs);
    current = await pollRunwayVideoTask(initial.taskId);
  }

  if (current.status === "FAILED") throw new Error("Runway video generation failed.");
  if (!current.videoUrl) throw new Error("Runway completed without returning a video URL.");
  return current;
}

export function buildAutoProductReelPrompt(input: {
  productName?: string;
  description?: string | null;
  offer?: string | null;
  brandColors?: string[];
  toneOfVoice?: string | null;
}) {
  const productName = input.productName?.trim() || "the product";
  return [
    `Create a polished 9:16 product reel for ${productName}.`,
    input.description || input.offer || "",
    input.offer ? `Offer: ${input.offer}.` : "",
    input.brandColors?.length ? `Use brand colors: ${input.brandColors.join(", ")}.` : "",
    input.toneOfVoice ? `Tone: ${input.toneOfVoice}.` : "",
    "Cinematic lighting, premium advertising composition, clear product-first reveal, smooth camera motion, social-ready pacing.",
    "Avoid watermarks, garbled text, cluttered backgrounds, and brand-inaccurate logos.",
  ].filter(Boolean).join(" ");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
