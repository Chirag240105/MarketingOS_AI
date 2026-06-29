import { z } from "zod";
import { fallbackTextPost } from "@/lib/ai/fallbacks";
import { runStructuredAI } from "@/lib/ai/service";
import { aiString, aiStringArray } from "@/lib/ai/schema-utils";
import type { CampaignBrief, CampaignTextPostOutput } from "@/types/ai";

const allowedContentTypes = [
  "FEED_POST",
  "STORY",
  "REEL",
  "CAROUSEL",
  "VIDEO",
  "AD_BANNER",
  "AD_COPY",
  "CAPTION_ONLY",
  "THREAD",
  "ARTICLE",
] as const;

const contentTypeSchema = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}, z.enum(allowedContentTypes)).pipe(z.literal("CAPTION_ONLY"));

const schema = z.object({
  campaignName: aiString,
  primaryText: aiString,
  headline: aiString,
  description: aiString,
  callToAction: aiString,
  instagramCaption: aiString,
  facebookCaption: aiString,
  hashtags: aiStringArray(1),
  pinterestTitle: aiString,
  pinterestDescription: aiString,
  altText: aiString,
  creativeDirection: aiString,
  contentType: contentTypeSchema,
}).transform((value) => ({
  ...value,
  caption: value.instagramCaption,
  cta: value.callToAction,
  contentAngle: value.creativeDirection,
}));

const campaignCopyPrompt = `You are the Copywriting Agent for MarketingOS AI.
Create paid social and organic campaign copy from the supplied business, strategy, competitor context, and campaign brief.

Return exactly this JSON shape:
{
  "campaignName": "string",
  "primaryText": "string",
  "headline": "string",
  "description": "string",
  "callToAction": "string",
  "instagramCaption": "string",
  "facebookCaption": "string",
  "hashtags": ["string"],
  "pinterestTitle": "string",
  "pinterestDescription": "string",
  "altText": "string",
  "creativeDirection": "string",
  "contentType": "CAPTION_ONLY"
}

Rules:
- Return valid JSON only.
- Do not include markdown, comments, image prompts, video scripts, or extra keys; creative agents handle media prompts after copy is approved.
- contentType must be "CAPTION_ONLY".
- Keep creativeDirection concise and useful for the visual creative agent.
- Hashtags should include # and be relevant to the business.
- Make the primaryText, headline, description, and CTA suitable for Meta ads.`;

export function writeCampaignTextPost(brief: CampaignBrief) {
  return runStructuredAI<CampaignTextPostOutput>({
    agentName: "Copywriting Agent",
    modelProfile: "copywriting",
    system: campaignCopyPrompt,
    input: brief,
    schema,
    fallback: fallbackTextPost(brief),
  });
}
