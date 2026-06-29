import { z } from "zod";
import { fallbackPlanner } from "@/lib/ai/fallbacks";
import { runStructuredAI } from "@/lib/ai/service";
import { aiOptionalString, aiString, aiStringArray } from "@/lib/ai/schema-utils";
import type { CampaignBrief, CampaignPlannerOutput } from "@/types/ai";

const campaignStrategySchema = z.object({
  positioning: aiString,
  audienceInsight: aiString,
  keyMessages: aiStringArray(2),
  campaignPillars: aiStringArray(2),
  cadence: aiString,
  budgetRecommendation: aiOptionalString(),
});

const schema = z.object({
  brandAnalysis: aiString,
  targetAudience: aiString,
  competitorPositioning: aiString,
  strategy: campaignStrategySchema,
});

const plannerPrompt = `You are the Campaign Planner Agent for MarketingOS AI.
Create the strategic foundation for one campaign brief.
Return JSON with:
- brandAnalysis: practical analysis of the brand and offer
- targetAudience: clear buyer/user segment
- competitorPositioning: how to position against alternatives
- strategy: positioning, audienceInsight, keyMessages, campaignPillars, cadence, budgetRecommendation
Keep the strategy specific, useful, and ready for copywriters.`;

export function planCampaign(brief: CampaignBrief) {
  return runStructuredAI<CampaignPlannerOutput>({
    agentName: "Campaign Planner Agent",
    modelProfile: "campaignPlanner",
    system: plannerPrompt,
    input: brief,
    schema,
    fallback: fallbackPlanner(brief),
  });
}
