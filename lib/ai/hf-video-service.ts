import { InferenceClient } from "@huggingface/inference";

type HuggingFaceCreateVideoInput = {
  prompt: string;
  aspectRatio?: string;
  duration?: number;
  negativePrompt?: string;
};

export type HuggingFaceVideoResult = {
  status: "COMPLETED";
  videoBytes: Uint8Array;
  contentType: string;
  model: string;
  providerResponse: unknown;
  providerStatus: string;
};

function getHuggingFaceToken() {
  return process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;
}

export function isHuggingFaceVideoConfigured() {
  return Boolean(getHuggingFaceToken());
}

function getHuggingFaceVideoModel() {
  return process.env.HF_VIDEO_MODEL || process.env.HUGGINGFACE_VIDEO_MODEL || "damo-vilab/text-to-video-ms-1.7b";
}

function getFrameCount(duration?: number) {
  const fps = Number(process.env.HF_VIDEO_FPS || 8);
  const seconds = Number.isFinite(duration) ? Number(duration) : 5;
  const frames = Number(process.env.HF_VIDEO_NUM_FRAMES || Math.round(seconds * fps));
  return Math.min(64, Math.max(16, frames || 40));
}

function normalizePrompt(prompt: string) {
  const normalized = prompt.replace(/\s+/g, " ").trim();
  const limit = Number(process.env.HF_VIDEO_PROMPT_MAX_CHARS || 1000);
  return normalized.length <= limit ? normalized : normalized.slice(0, limit - 1).trim();
}

export async function generateHuggingFaceVideo(input: HuggingFaceCreateVideoInput): Promise<HuggingFaceVideoResult> {
  const token = getHuggingFaceToken();
  if (!token) throw new Error("Hugging Face video generation is not configured. Set HF_TOKEN.");

  const model = getHuggingFaceVideoModel();
  const client = new InferenceClient(token);
  const prompt = [
    normalizePrompt(input.prompt),
    `Aspect ratio: ${input.aspectRatio || "9:16"}.`,
    `Duration target: ${input.duration || 5} seconds.`,
  ].join(" ");

  const video = await client.textToVideo({
    model,
    inputs: prompt,
    parameters: {
      num_frames: getFrameCount(input.duration),
      num_inference_steps: Number(process.env.HF_VIDEO_INFERENCE_STEPS || 25),
      guidance_scale: Number(process.env.HF_VIDEO_GUIDANCE_SCALE || 7.5),
      negative_prompt: [
        input.negativePrompt || "watermark, distorted product, unreadable text, low quality, cluttered background",
      ],
    },
  });

  return {
    status: "COMPLETED",
    videoBytes: new Uint8Array(await video.arrayBuffer()),
    contentType: video.type || "video/mp4",
    model,
    providerResponse: {
      model,
      contentType: video.type || "video/mp4",
      size: video.size,
      aspectRatio: input.aspectRatio || "9:16",
      duration: input.duration || 5,
    },
    providerStatus: "COMPLETED",
  };
}
