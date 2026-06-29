import type { AIAgentType, CampaignGoal, ContentType, SocialPlatform } from "@/lib/generated/prisma/client";

export type BrandContext = {
  companyName: string;
  description?: string | null;
  industry?: string | null;
  toneOfVoice?: string | null;
  targetAudience?: unknown;
  primaryGoal?: string | null;
  budget?: unknown;
  location?: string | null;
  productsServices?: string[];
  values: string[];
  competitors: string[];
};

export type CampaignBrief = {
  campaignId: string;
  name: string;
  description?: string | null;
  goal: CampaignGoal;
  platforms: SocialPlatform[];
  targetAudience?: unknown;
  offer?: string | null;
  notes?: string | null;
  brand: BrandContext;
};

export type AgentActivity = {
  agent: AIAgentType;
  label: string;
  status: "pending" | "running" | "completed" | "failed";
  detail?: string;
  timestamp: string;
};

export type GeneratedContent = {
  platform: SocialPlatform;
  contentType: ContentType;
  title?: string;
  body: string;
  caption?: string;
  hashtags: string[];
  mentions: string[];
  callToAction?: string;
  mediaType?: "IMAGE" | "VIDEO" | "CAROUSEL" | "TEXT";
  aiConfidence: number;
  aiReasoning?: string;
};

export type CampaignStrategy = {
  positioning: string;
  audienceInsight: string;
  keyMessages: string[];
  campaignPillars: string[];
  cadence: string;
  budgetRecommendation?: string;
};

export type CampaignPlannerOutput = {
  brandAnalysis: string;
  targetAudience: string;
  competitorPositioning: string;
  strategy: CampaignStrategy;
};

export type CompetitorAnalyzerOutput = {
  sourceNote: string;
  competitors: Array<{
    name: string;
    positioning: string;
    strengths: string[];
    weaknesses: string[];
  }>;
  positioningGaps: string[];
  differentiationAngle: string;
  recommendedContentGaps: string[];
};

export type CampaignCopyOutput = {
  captions: string[];
  adCopy: string[];
  hashtags: string[];
  posts: GeneratedContent[];
};

export type CampaignTextPostOutput = {
  campaignName: string;
  primaryText: string;
  headline: string;
  description: string;
  callToAction: string;
  instagramCaption: string;
  facebookCaption: string;
  caption: string;
  pinterestTitle: string;
  pinterestDescription: string;
  hashtags: string[];
  cta: string;
  altText: string;
  creativeDirection: string;
  contentAngle?: string;
  contentType: "CAPTION_ONLY";
};

export type CreativePromptOutput = {
  posterPrompt: string;
  imagePrompts: string[];
  videoPromptIdeas: string[];
};

export type CampaignGenerationStatus = "generated" | "fallback";
