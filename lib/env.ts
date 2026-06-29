import { z } from "zod";

const PLACEHOLDER_CRON_SECRET = "replace-with-a-long-random-secret";

export const aiEnvSchema = z.object({
  GROQ_API: z.string().min(1, "GROQ_API is required"),
  GEMINI_API: z.string().min(1, "GEMINI_API is required"),
  MISTRAL_KEY: z.string().min(1, "MISTRAL_KEY is required"),
});

export function validateAIEnv(env: NodeJS.ProcessEnv = process.env) {
  return aiEnvSchema.parse(env);
}

export function requireCronSecret() {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || secret === PLACEHOLDER_CRON_SECRET) {
    throw new Error("CRON_SECRET must be set to a real random secret before cron routes can run.");
  }
  return secret;
}

export function isConfigured(value: string | undefined) {
  return Boolean(value?.trim());
}

export function isDemoMode(env: NodeJS.ProcessEnv = process.env) {
  return env.NEXT_PUBLIC_DEMO_MODE === "true" || env.DEMO_MODE === "true";
}
