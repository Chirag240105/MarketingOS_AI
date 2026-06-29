import { z } from "zod";
import { fallbackCreativePrompts } from "@/lib/ai/fallbacks";
import { runStructuredAI } from "@/lib/ai/service";
import { aiString, aiStringArray } from "@/lib/ai/schema-utils";
import type { CampaignBrief, CampaignCopyOutput, CampaignPlannerOutput, CampaignTextPostOutput, CreativePromptOutput } from "@/types/ai";

const schema = z.object({
  posterPrompt: aiString,
  imagePrompts: aiStringArray(1),
  videoPromptIdeas: aiStringArray(1),
});

const creativePrompt = `You are the Creative Prompt Agent for MarketingOS AI.
Create practical generation prompts and video ideas from the campaign plan and copy.
Return JSON with:
- posterPrompt: one polished poster/image prompt with headline, composition, style, brand cues, and CTA area
- imagePrompts: additional image or carousel prompt ideas
- videoPromptIdeas: short-form video prompt ideas
Prompts should be specific enough for an image/video model and safe for brand marketing.`;

export function createCreativePrompts(brief: CampaignBrief, planner: CampaignPlannerOutput, copy: CampaignCopyOutput | CampaignTextPostOutput) {
  return runStructuredAI<CreativePromptOutput>({
    agentName: "Creative Prompt Agent",
    modelProfile: "jsonGeneration",
    system: creativePrompt,
    input: { brief, planner, copy },
    schema,
    fallback: fallbackCreativePrompts(),
  });
}
