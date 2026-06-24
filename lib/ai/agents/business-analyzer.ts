import { z } from "zod";
import { runStructuredAgent } from "@/lib/ai/agent-utils";
import { businessAnalysisPrompt } from "@/lib/ai/prompts/business-analysis";
import type { BrandContext } from "@/types/ai";

const schema = z.object({
  positioning: z.string(),
  audienceInsight: z.string(),
  differentiators: z.array(z.string()).min(1),
  opportunities: z.array(z.string()).min(1),
  risks: z.array(z.string()),
});

export type BusinessAnalysis = z.infer<typeof schema>;

export function analyzeBusiness(brand: BrandContext) {
  return runStructuredAgent({
    system: businessAnalysisPrompt,
    input: brand,
    schema,
    fallback: () => ({
      positioning: brand.companyName + " helps modern teams move from scattered marketing to confident, repeatable growth.",
      audienceInsight: "Busy operators need clear proof of value and content they can approve quickly.",
      differentiators: ["AI-assisted execution", "Campaign-level visibility", "Fast approval workflows"],
      opportunities: ["Show time saved", "Turn customer questions into content", "Lead with measurable outcomes"],
      risks: ["Avoid overpromising automation", "Keep claims specific and supportable"],
    }),
  });
}
