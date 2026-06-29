type KlingCreateVideoInput = {
  prompt: string;
  aspectRatio?: string;
  duration?: number;
  negativePrompt?: string;
};

export type KlingVideoResult = {
  taskId?: string;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  videoUrl?: string;
  model: string;
  providerResponse: unknown;
  providerStatus?: string;
};

type JsonObject = Record<string, unknown>;

function getKlingConfig() {
  const apiKey = process.env.KLING_API || process.env.KLINGAPI || process.env.KLING_API_KEY;
  if (!apiKey) throw new Error("Kling video generation is not configured. Set KLING_API, KLINGAPI, or KLING_API_KEY.");
  return {
    apiKey,
    baseUrl: (process.env.KLING_API_BASE_URL || "https://api-singapore.klingai.com").replace(/\/$/, ""),
    createPath: process.env.KLING_TEXT_TO_VIDEO_PATH || "/v1/videos/text2video",
    statusPath: process.env.KLING_TASK_STATUS_PATH || "/v1/videos/text2video/{taskId}",
    model: process.env.KLING_VIDEO_MODEL || process.env.KLING_MODEL || "kling-3.0-turbo",
  };
}

function klingUrl(baseUrl: string, path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function getHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "X-API-Key": apiKey,
  };
}

function asObject(value: unknown): JsonObject | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : undefined;
}

function getPath(value: unknown, path: Array<string | number>): unknown {
  let current: unknown = value;
  for (const segment of path) {
    if (typeof segment === "number") {
      if (!Array.isArray(current)) return undefined;
      current = current[segment];
      continue;
    }
    const object = asObject(current);
    if (!object) return undefined;
    current = object[segment];
  }
  return current;
}

function firstString(value: unknown, paths: Array<Array<string | number>>) {
  for (const path of paths) {
    const candidate = getPath(value, path);
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return undefined;
}

function extractTaskId(body: unknown) {
  return firstString(body, [
    ["data", "task_id"],
    ["data", "taskId"],
    ["data", "id"],
    ["task_id"],
    ["taskId"],
    ["id"],
  ]);
}

function extractVideoUrl(body: unknown) {
  return firstString(body, [
    ["data", "task_result", "videos", 0, "url"],
    ["data", "taskResult", "videos", 0, "url"],
    ["data", "videos", 0, "url"],
    ["data", "video", "url"],
    ["data", "video_url"],
    ["data", "videoUrl"],
    ["data", "url"],
    ["output", 0],
    ["output", 0, "url"],
    ["video_url"],
    ["videoUrl"],
    ["url"],
  ]);
}

function extractProviderStatus(body: unknown) {
  return firstString(body, [
    ["data", "task_status"],
    ["data", "taskStatus"],
    ["data", "status"],
    ["task_status"],
    ["taskStatus"],
    ["status"],
  ]);
}

function normalizeStatus(body: unknown): KlingVideoResult["status"] {
  if (extractVideoUrl(body)) return "COMPLETED";
  const status = extractProviderStatus(body)?.toLowerCase();
  if (!status) return "PROCESSING";
  if (["succeed", "succeeded", "success", "completed", "complete", "done"].includes(status)) return "COMPLETED";
  if (["failed", "fail", "error", "cancelled", "canceled"].includes(status)) return "FAILED";
  return "PROCESSING";
}

async function readProviderJson(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

function toResult(body: unknown, model: string): KlingVideoResult {
  return {
    taskId: extractTaskId(body),
    status: normalizeStatus(body),
    videoUrl: extractVideoUrl(body),
    model,
    providerResponse: body,
    providerStatus: extractProviderStatus(body),
  };
}

export async function createKlingVideoTask(input: KlingCreateVideoInput): Promise<KlingVideoResult> {
  const config = getKlingConfig();
  const response = await fetch(klingUrl(config.baseUrl, config.createPath), {
    method: "POST",
    headers: getHeaders(config.apiKey),
    body: JSON.stringify({
      model_name: config.model,
      model: config.model,
      prompt: input.prompt,
      negative_prompt: input.negativePrompt || "watermark, distorted product, unreadable text, low quality",
      aspect_ratio: input.aspectRatio || "9:16",
      duration: String(input.duration || 5),
      mode: process.env.KLING_GENERATION_MODE || "std",
    }),
  });
  const body = await readProviderJson(response);
  if (!response.ok) {
    const message = firstString(body, [["message"], ["error"], ["error", "message"]]) || response.statusText;
    throw new Error(`Kling video generation failed: ${message}`);
  }
  const result = toResult(body, config.model);
  if (!result.videoUrl && !result.taskId) throw new Error("Kling did not return a video URL or task ID.");
  return result;
}

export async function getKlingVideoTask(taskId: string): Promise<KlingVideoResult> {
  const config = getKlingConfig();
  const path = config.statusPath.replace("{taskId}", encodeURIComponent(taskId));
  const response = await fetch(klingUrl(config.baseUrl, path), {
    method: "GET",
    headers: getHeaders(config.apiKey),
  });
  const body = await readProviderJson(response);
  if (!response.ok) {
    const message = firstString(body, [["message"], ["error"], ["error", "message"]]) || response.statusText;
    throw new Error(`Kling video status check failed: ${message}`);
  }
  return toResult(body, config.model);
}

export function buildProductReelPrompt(input: {
  prompt: string;
  productName?: string;
  aspectRatio?: string;
  duration?: number;
}) {
  const parts = [
    `Create a polished product reel for ${input.productName?.trim() || "the product"}.`,
    input.prompt.trim(),
    `Format: ${input.aspectRatio || "9:16"} vertical social reel, ${input.duration || 5} seconds.`,
    "Use cinematic product lighting, crisp detail, natural camera movement, premium advertising composition, and a clear product-first reveal.",
    "Avoid watermarks, garbled text, brand-inaccurate logos, and cluttered backgrounds.",
  ];
  return parts.join(" ");
}
