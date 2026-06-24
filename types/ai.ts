import type { AIAgentType, CampaignGoal, ContentType, SocialPlatform } from "@/lib/generated/prisma/client";

export type BrandContext = {
  companyName: string;
  description?: string | null;
  industry?: string | null;
  toneOfVoice?: string | null;
  targetAudience?: unknown;
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
