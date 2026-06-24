import { z } from "zod";
import { runStructuredAgent } from "@/lib/ai/agent-utils";
import { campaignStrategyPrompt } from "@/lib/ai/prompts/campaign-strategy";
import type { CampaignBrief, CampaignStrategy } from "@/types/ai";

const schema = z.object({
  positioning: z.string(),
  audienceInsight: z.string(),
  keyMessages: z.array(z.string()).min(2),
  campaignPillars: z.array(z.string()).min(2),
  cadence: z.string(),
  budgetRecommendation: z.string().optional(),
});

export function createCampaignStrategy(brief: CampaignBrief) {
  return runStructuredAgent<CampaignStrategy>({
    system: campaignStrategyPrompt,
    input: brief,
    schema,
    fallback: () => ({
      positioning: brief.name + " makes the next best action feel obvious.",
      audienceInsight: "Prioritize people who need momentum, clarity, and proof before they buy.",
      keyMessages: ["Move faster with confidence", "Create once, adapt everywhere", "Measure what changes"],
      campaignPillars: ["The before-and-after", "Practical proof", "Customer momentum"],
      cadence: "Three platform-native posts per week, with one deeper story-led asset.",
      budgetRecommendation: "Start with a focused test budget, then move spend toward the highest-intent creative.",
    }),
  });
}
