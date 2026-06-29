import {
  generateHuggingFaceVideo,
  isHuggingFaceVideoConfigured,
  type HuggingFaceVideoResult,
} from "@/lib/ai/hf-video-service";
import {
  createKlingVideoTask,
  getKlingVideoTask,
  type KlingVideoResult,
} from "@/lib/ai/kling-video-service";

export type VideoGenerationStatus = "PROCESSING" | "COMPLETED" | "FAILED";

export type GenerateVideoInput = {
  prompt: string;
  aspectRatio?: string;
  duration?: number;
};

export type VideoGenerationResult = {
  taskId?: string;
  status: VideoGenerationStatus;
  videoUrl?: string;
  videoBytes?: Uint8Array;
  contentType?: string;
  model: string;
  provider: "huggingface" | "kling";
  providerResponse: unknown;
  providerStatus?: string;
  progress?: number;
  errorMessage?: string;
};

export type VideoProvider = {
  name: "huggingface-kling";
  create(input: GenerateVideoInput): Promise<VideoGenerationResult>;
  poll(taskId: string): Promise<VideoGenerationResult>;
};

function fromHuggingFace(result: HuggingFaceVideoResult): VideoGenerationResult {
  return {
    status: result.status,
    videoBytes: result.videoBytes,
    contentType: result.contentType,
    model: result.model,
    provider: "huggingface",
    providerResponse: result.providerResponse,
    providerStatus: result.providerStatus,
  };
}

function fromKling(result: KlingVideoResult): VideoGenerationResult {
  return {
    taskId: result.taskId,
    status: result.status,
    videoUrl: result.videoUrl,
    model: result.model,
    provider: "kling",
    providerResponse: result.providerResponse,
    providerStatus: result.providerStatus,
  };
}

async function createVideoWithFallback(input: GenerateVideoInput): Promise<VideoGenerationResult> {
  if (isHuggingFaceVideoConfigured()) {
    try {
      return fromHuggingFace(await generateHuggingFaceVideo(input));
    } catch (error) {
      console.warn("[video] Hugging Face generation failed; falling back to Kling.", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return fromKling(await createKlingVideoTask(input));
}

async function pollKlingVideoTask(taskId: string): Promise<VideoGenerationResult> {
  return fromKling(await getKlingVideoTask(taskId));
}

export function getVideoProvider(): VideoProvider {
  return {
    name: "huggingface-kling",
    create: createVideoWithFallback,
    poll: pollKlingVideoTask,
  };
}
