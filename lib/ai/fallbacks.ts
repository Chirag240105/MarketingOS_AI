import type { CampaignCopyOutput, CampaignPlannerOutput, CampaignTextPostOutput, CreativePromptOutput, CampaignBrief } from "@/types/ai";

export const staticCampaignFallback = {
  strategy: "Launch a simple awareness campaign focused on the main business offer.",
  audience: "Small business owners and local customers.",
  captions: [
    "Grow smarter with AI-powered marketing.",
    "Turn your business idea into a complete campaign.",
  ],
  hashtags: ["#Marketing", "#SmallBusiness", "#AIGrowth"],
  posterPrompt: "Modern clean marketing poster with bold headline, product image, and CTA button.",
  status: "fallback" as const,
};

export function fallbackPlanner(brief: CampaignBrief): CampaignPlannerOutput {
  const audience = stringFromUnknown(brief.targetAudience || brief.brand.targetAudience) || staticCampaignFallback.audience;
  return {
    brandAnalysis: `${brief.brand.companyName} should lead with a clear, useful offer and proof that it can help customers act faster.`,
    targetAudience: audience,
    competitorPositioning: "Position the brand as practical, approachable, and easier to start with than generic alternatives.",
    strategy: {
      positioning: staticCampaignFallback.strategy,
      audienceInsight: audience,
      keyMessages: ["Simple marketing workflows", "Useful AI drafts", "Faster campaign launch"],
      campaignPillars: ["Awareness", "Trust", "Conversion"],
      cadence: "Publish 3-4 concise posts per week, then promote the strongest message as a lightweight ad.",
      budgetRecommendation: "Start with a small test budget, measure engagement and clicks, then scale the best platform.",
    },
  };
}

export function fallbackCopy(brief: CampaignBrief): CampaignCopyOutput {
  const platform = brief.platforms[0] || "INSTAGRAM";
  return {
    captions: staticCampaignFallback.captions,
    adCopy: [
      "Launch smarter campaigns with AI-ready strategy, copy, and creative prompts.",
      "Move from idea to polished marketing draft in minutes.",
    ],
    hashtags: staticCampaignFallback.hashtags,
    posts: [
      {
        platform,
        contentType: "FEED_POST",
        title: `${brief.name} awareness post`,
        body: staticCampaignFallback.captions[0],
        caption: staticCampaignFallback.captions[0],
        hashtags: staticCampaignFallback.hashtags,
        mentions: [],
        callToAction: "Start your campaign draft today.",
        mediaType: "IMAGE",
        aiConfidence: 0.6,
        aiReasoning: "Static fallback content generated because all configured AI text models were unavailable.",
      },
      {
        platform,
        contentType: "AD_COPY",
        title: `${brief.name} ad copy`,
        body: "Turn your business idea into a complete campaign with strategy, captions, hashtags, and creative prompts.",
        caption: staticCampaignFallback.captions[1],
        hashtags: staticCampaignFallback.hashtags,
        mentions: [],
        callToAction: "Create your first AI campaign.",
        mediaType: "TEXT",
        aiConfidence: 0.6,
        aiReasoning: "Static fallback content generated because all configured AI text models were unavailable.",
      },
    ],
  };
}

export function fallbackTextPost(brief: CampaignBrief): CampaignTextPostOutput {
  const company = brief.brand.companyName;
  return {
    campaignName: brief.name,
    primaryText: `${company} helps customers move from interest to action with a clear offer and a simple next step.`,
    headline: `${company}: marketing that moves`,
    description: `A practical campaign for ${company}, focused on the main offer and the audience most likely to respond.`,
    callToAction: "Learn More",
    instagramCaption: `${company} helps you turn a clear idea into marketing your customers can understand and act on.`,
    facebookCaption: `${company} is launching a focused campaign built around a clear offer, useful proof, and a simple next step.`,
    caption: `${company} helps you turn a clear idea into marketing your customers can understand and act on.`,
    pinterestTitle: `${brief.name}: simple marketing ideas for growing teams`,
    pinterestDescription: `A practical campaign draft for ${company}, focused on a clear offer, helpful messaging, and a simple next step for the right audience.`,
    hashtags: staticCampaignFallback.hashtags,
    cta: "Start your campaign draft today.",
    altText: `Text-only campaign draft for ${company} with a clear marketing message and call to action.`,
    creativeDirection: "Use clean, high-contrast brand visuals later, with the offer and CTA clearly visible.",
    contentAngle: "Practical awareness post focused on the main business offer and the next action customers should take.",
    contentType: "CAPTION_ONLY",
  };
}

export function fallbackCreativePrompts(): CreativePromptOutput {
  return {
    posterPrompt: staticCampaignFallback.posterPrompt,
    imagePrompts: [
      staticCampaignFallback.posterPrompt,
      "Clean social media carousel cover with campaign headline, three benefit callouts, and bright CTA area.",
    ],
    videoPromptIdeas: [
      "Short 15-second product walkthrough showing the problem, AI-generated draft, and final campaign ready for approval.",
      "Founder-style talking head video explaining how smarter campaign planning helps small teams move faster.",
    ],
  };
}

function stringFromUnknown(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(stringFromUnknown).filter(Boolean).join(", ");
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).map(stringFromUnknown).filter(Boolean).join(", ");
  return String(value);
}
