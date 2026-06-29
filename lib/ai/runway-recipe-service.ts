export type RunwayRecipeResult = {
  taskId?: string;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  imageUrls: string[];
  model: string;
  providerResponse: unknown;
  providerStatus?: string;
};

type CreateProductCampaignImageInput = {
  imageUri: string;
  prompt: string;
};

type JsonObject = Record<string, unknown>;

const productCampaignImageModel = "runwayml/v1/recipes/product_campaign_image";

function getRunwayConfig() {
  const apiKey = process.env.RUNWAY_API_KEY || process.env.RUNWAY_API || process.env.RUNWAYML_API_SECRET;
  if (!apiKey) throw new Error("Runway image generation is not configured. Set RUNWAY_API_KEY.");
  return {
    apiKey,
    baseUrl: (process.env.RUNWAY_API_BASE_URL || "https://api.dev.runwayml.com").replace(/\/$/, ""),
    apiVersion: process.env.RUNWAY_API_VERSION || "2024-11-06",
    recipeVersion: process.env.RUNWAY_RECIPE_VERSION || "2026-06",
    model: process.env.RUNWAY_RECIPE_MODEL || productCampaignImageModel,
    createPath: process.env.RUNWAY_PRODUCT_CAMPAIGN_IMAGE_PATH || "/v1/recipes/product_campaign_image",
  };
}

function runwayUrl(baseUrl: string, path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function getHeaders(config: ReturnType<typeof getRunwayConfig>) {
  return {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
    "X-Runway-Version": config.apiVersion,
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

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  const object = asObject(value);
  if (!object) return [];
  return Object.values(object).flatMap(collectStrings);
}

function isImageUrl(value: string) {
  return /^(https?:\/\/|runway:\/\/|data:image\/)/i.test(value);
}

function extractTaskId(body: unknown) {
  return firstString(body, [["id"], ["taskId"], ["task_id"], ["data", "id"], ["data", "taskId"], ["data", "task_id"]]);
}

function extractProviderStatus(body: unknown) {
  return firstString(body, [["status"], ["state"], ["data", "status"], ["data", "state"], ["task", "status"]]);
}

function extractImageUrls(body: unknown) {
  const direct = [
    getPath(body, ["output"]),
    getPath(body, ["outputs"]),
    getPath(body, ["result"]),
    getPath(body, ["results"]),
    getPath(body, ["artifacts"]),
    getPath(body, ["data", "output"]),
    getPath(body, ["data", "outputs"]),
    getPath(body, ["data", "result"]),
  ].flatMap(collectStrings);
  return Array.from(new Set(direct.filter(isImageUrl)));
}

function normalizeStatus(body: unknown): RunwayRecipeResult["status"] {
  const status = extractProviderStatus(body)?.toUpperCase();
  if (extractImageUrls(body).length) return "COMPLETED";
  if (!status) return "PROCESSING";
  if (["SUCCEEDED", "SUCCESS", "COMPLETED", "COMPLETE", "DONE"].includes(status)) return "COMPLETED";
  if (["FAILED", "FAILURE", "CANCELED", "CANCELLED", "ERROR"].includes(status)) return "FAILED";
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

function toResult(body: unknown, model: string): RunwayRecipeResult {
  return {
    taskId: extractTaskId(body),
    status: normalizeStatus(body),
    imageUrls: extractImageUrls(body),
    model,
    providerResponse: body,
    providerStatus: extractProviderStatus(body),
  };
}

export async function createRunwayProductCampaignImageTask(input: CreateProductCampaignImageInput): Promise<RunwayRecipeResult> {
  const config = getRunwayConfig();
  const response = await fetch(runwayUrl(config.baseUrl, config.createPath), {
    method: "POST",
    headers: getHeaders(config),
    body: JSON.stringify({
      version: config.recipeVersion,
      image: { uri: input.imageUri },
      prompt: input.prompt,
    }),
  });
  const body = await readProviderJson(response);
  if (!response.ok) {
    const message = firstString(body, [["message"], ["error"], ["error", "message"], ["raw"]]) || response.statusText;
    throw new Error(`Runway product campaign image generation failed: ${message}`);
  }
  const result = toResult(body, config.model);
  if (!result.taskId && !result.imageUrls.length) throw new Error("Runway did not return a task ID or image URL.");
  return result;
}

export async function getRunwayTask(taskId: string): Promise<RunwayRecipeResult> {
  const config = getRunwayConfig();
  const response = await fetch(runwayUrl(config.baseUrl, `/v1/tasks/${encodeURIComponent(taskId)}`), {
    method: "GET",
    headers: getHeaders(config),
  });
  const body = await readProviderJson(response);
  if (!response.ok) {
    const message = firstString(body, [["message"], ["error"], ["error", "message"], ["raw"]]) || response.statusText;
    throw new Error(`Runway task status check failed: ${message}`);
  }
  return toResult({ ...(asObject(body) || {}), id: taskId }, config.model);
}

export async function generateRunwayProductCampaignImage(input: CreateProductCampaignImageInput) {
  let result = await createRunwayProductCampaignImageTask(input);
  const attempts = Number(process.env.RUNWAY_POLL_ATTEMPTS || 12);
  const intervalMs = Number(process.env.RUNWAY_POLL_INTERVAL_MS || 5000);

  for (let attempt = 0; result.taskId && result.status === "PROCESSING" && attempt < attempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    result = await getRunwayTask(result.taskId);
  }

  const imageUrl = result.imageUrls[0];
  if (!imageUrl) throw new Error(`Runway task ${result.taskId || ""} is still processing.`.trim());
  return { ...result, imageUrl };
}
