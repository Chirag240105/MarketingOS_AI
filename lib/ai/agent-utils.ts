import type { z } from "zod";
import { runStructuredAI, type AIModelProfile, type AIUsage } from "@/lib/ai/service";

type StructuredAgentOptions<T> = {
  system: string;
  input: unknown;
  schema: z.ZodType<T>;
  rootArrayKey?: string;
  fallback?: T;
  agentName?: string;
  modelProfile?: AIModelProfile;
};

export type { AIUsage };

export async function runStructuredAgent<T>({
  system,
  input,
  schema,
  rootArrayKey,
  fallback,
  agentName = "agent",
  modelProfile = "jsonGeneration",
}: StructuredAgentOptions<T>): Promise<{ output: T; usage: AIUsage; status: "generated" | "fallback"; errors: string[] }> {
  return runStructuredAI({
    agentName,
    modelProfile,
    system,
    input,
    schema,
    rootArrayKey,
    fallback,
  });
}
