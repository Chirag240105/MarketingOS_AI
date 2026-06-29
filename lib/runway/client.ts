import RunwayML from "@runwayml/sdk";

export function getRunwayApiKey() {
  return process.env.RUNWAY_API_KEY || process.env.RUNWAY_API || process.env.RUNWAYML_API_SECRET;
}

export function getRunwayClient() {
  const apiKey = getRunwayApiKey();
  if (!apiKey) throw new Error("Runway is not configured. Set RUNWAY_API_KEY.");

  return new RunwayML({
    apiKey,
    baseURL: process.env.RUNWAY_API_BASE_URL,
    runwayVersion: process.env.RUNWAY_API_VERSION || "2024-11-06",
    maxRetries: Number(process.env.RUNWAY_MAX_RETRIES || 2),
    timeout: Number(process.env.RUNWAY_REQUEST_TIMEOUT_MS || 60_000),
    logLevel: process.env.RUNWAY_LOG_LEVEL === "debug" ? "debug" : "warn",
  });
}
