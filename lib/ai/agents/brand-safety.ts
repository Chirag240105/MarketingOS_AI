import { z } from "zod";
import { runStructuredAgent } from "@/lib/ai/agent-utils";
import { brandSafetyPrompt } from "@/lib/ai/prompts/brand-safety";
import { aiBoolean, aiStringArray } from "@/lib/ai/schema-utils";
import type { BrandContext, GeneratedContent } from "@/types/ai";

const schema = z.object({
  approved: aiBoolean,
  issues: aiStringArray(),
  suggestedEdits: aiStringArray(),
});

export async function reviewBrandSafety(brand: BrandContext, posts: GeneratedContent[]) {
  const result = await runStructuredAgent({
    agentName: "Brand Safety Agent",
    modelProfile: "jsonGeneration",
    system: brandSafetyPrompt,
    input: { brand, posts },
    schema,
    fallback: {
      approved: false,
      issues: ["Brand safety could not be fully verified because the AI provider was unavailable."],
      suggestedEdits: ["Review claims, offer terms, and platform compliance manually before publishing."],
    },
  });
  return result;
}
