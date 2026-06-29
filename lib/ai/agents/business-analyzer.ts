import { z } from "zod";
import { runStructuredAgent } from "@/lib/ai/agent-utils";
import { businessAnalysisPrompt } from "@/lib/ai/prompts/business-analysis";
import { aiString, aiStringArray } from "@/lib/ai/schema-utils";
import type { BrandContext } from "@/types/ai";

const schema = z.object({
  positioning: aiString,
  audienceInsight: aiString,
  differentiators: aiStringArray(1),
  opportunities: aiStringArray(1),
  risks: aiStringArray(),
});

export type BusinessAnalysis = z.infer<typeof schema>;

export function analyzeBusiness(brand: BrandContext) {
  return runStructuredAgent({
    agentName: "Business Analyzer Agent",
    modelProfile: "campaignPlanner",
    system: businessAnalysisPrompt,
    input: brand,
    schema,
    fallback: {
      positioning: `${brand.companyName} should lead with a clear promise, proof, and a simple next step.`,
      audienceInsight: typeof brand.targetAudience === "string" ? brand.targetAudience : "Focus on the audience most likely to need the offer now.",
      differentiators: brand.values.length ? brand.values : ["Clear offer", "Practical customer value"],
      opportunities: ["Clarify the strongest use case", "Show proof before asking for conversion"],
      risks: ["Generic messaging", "Unsupported claims"],
    },
  });
}
