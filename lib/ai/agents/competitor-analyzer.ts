import { z } from "zod";
import { runStructuredAI } from "@/lib/ai/service";
import { aiString, aiStringArray } from "@/lib/ai/schema-utils";
import type { BrandContext, CampaignBrief, CompetitorAnalyzerOutput } from "@/types/ai";

const competitorSchema = z.object({
  name: aiString,
  positioning: aiString,
  strengths: aiStringArray(),
  weaknesses: aiStringArray(),
});

const schema = z.object({
  sourceNote: aiString,
  competitors: z.array(competitorSchema),
  positioningGaps: aiStringArray(),
  differentiationAngle: aiString,
  recommendedContentGaps: aiStringArray(),
});

const competitorPrompt = `You are the Competitor Analysis Agent for MarketingOS AI.
Analyze the supplied brand profile, known competitor names, and campaign brief.
Return JSON with competitors, positioningGaps, differentiationAngle, and recommendedContentGaps.
If no live web research tool is available, explicitly state in sourceNote that this is based on user-provided competitors and campaign context, not live market research.`;

export function analyzeCompetitors(brand: BrandContext, brief: CampaignBrief) {
  return runStructuredAI<CompetitorAnalyzerOutput>({
    agentName: "Competitor Analysis Agent",
    modelProfile: "competitorAnalysis",
    system: competitorPrompt,
    input: { brand, campaign: brief, knownCompetitors: brand.competitors },
    schema,
    fallback: fallbackCompetitorAnalysis(brand),
  });
}

function fallbackCompetitorAnalysis(brand: BrandContext): CompetitorAnalyzerOutput {
  const names = brand.competitors.length ? brand.competitors : ["Category alternatives"];
  return {
    sourceNote: "Fallback analysis based on user-provided competitors and campaign context, not live market research.",
    competitors: names.map((name) => ({
      name,
      positioning: "Likely competes on category familiarity, price, convenience, or incumbent trust.",
      strengths: ["Existing awareness", "Clear category fit"],
      weaknesses: ["May not communicate the specific offer or brand proof points as directly"],
    })),
    positioningGaps: ["Lead with a sharper promise and clearer proof than generic category messaging."],
    differentiationAngle: `${brand.companyName} should position around a specific customer pain, credible proof, and a simple next step.`,
    recommendedContentGaps: ["Comparison posts", "Proof-led customer examples", "Offer explainers", "Short objection-handling content"],
  };
}
