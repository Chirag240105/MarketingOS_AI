import { z } from "zod";
import { runStructuredAgent } from "@/lib/ai/agent-utils";
import { campaignStrategyPrompt } from "@/lib/ai/prompts/campaign-strategy";
import { aiOptionalString, aiString, aiStringArray } from "@/lib/ai/schema-utils";
import type { CampaignBrief, CampaignStrategy } from "@/types/ai";

const schema = z.object({
  positioning: aiString,
  audienceInsight: aiString,
  keyMessages: aiStringArray(2),
  campaignPillars: aiStringArray(2),
  cadence: aiString,
  budgetRecommendation: aiOptionalString(),
});

export function createCampaignStrategy(brief: CampaignBrief) {
  return runStructuredAgent<CampaignStrategy>({
    agentName: "Campaign Strategist Agent",
    modelProfile: "campaignPlanner",
    system: campaignStrategyPrompt,
    input: brief,
    schema,
    fallback: {
      positioning: `${brief.brand.companyName} should focus on the clearest customer problem and a simple conversion path.`,
      audienceInsight: "Prioritize the audience segment with the strongest need and easiest next step.",
      keyMessages: ["Clear offer", "Credible proof", "Low-friction action"],
      campaignPillars: ["Awareness", "Trust", "Conversion"],
      cadence: "Publish 3-4 posts per week and promote the strongest message.",
      budgetRecommendation: "Start with a small test budget, then scale the best-performing platform.",
    },
  });
}
