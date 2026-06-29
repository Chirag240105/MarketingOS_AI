import { z } from "zod";

export const brandAnalysisSchema = z.object({
  summary: z.string(),
  brandProfile: z.object({
    businessModel: z.string(),
    audienceSegments: z.array(z.string()),
    positioning: z.string(),
    toneOfVoice: z.string(),
    corePromise: z.string(),
    proofPoints: z.array(z.string()),
    risks: z.array(z.string()),
  }),
  messagingPillars: z.array(z.object({
    pillar: z.string(),
    rationale: z.string(),
  })),
});

export const competitorAnalysisSchema = z.object({
  summary: z.string(),
  competitors: z.array(z.object({
    name: z.string(),
    rank: z.number(),
    positioning: z.string(),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
  })),
  opportunities: z.array(z.string()),
  differentiationAngles: z.array(z.string()),
});

export const campaignStrategySchema = z.object({
  summary: z.string(),
  campaignIdea: z.string(),
  funnel: z.array(z.object({
    stage: z.string(),
    message: z.string(),
    primaryMetric: z.string(),
  })),
  platformStrategy: z.array(z.object({
    platform: z.string(),
    role: z.string(),
    contentTypes: z.array(z.string()),
  })),
  contentCalendar: z.array(z.object({
    day: z.string(),
    platform: z.string(),
    theme: z.string(),
    assetType: z.string(),
  })),
  budgetAllocation: z.array(z.object({
    channel: z.string(),
    percentage: z.number(),
    rationale: z.string(),
  })),
});

export const campaignCopySchema = z.object({
  hooks: z.array(z.string()),
  captions: z.array(z.object({
    platform: z.string(),
    caption: z.string(),
    hashtags: z.array(z.string()),
  })),
  adCopy: z.array(z.object({
    platform: z.string(),
    primaryText: z.string(),
    headline: z.string(),
    description: z.string(),
    cta: z.string(),
  })),
  landingPageCopy: z.object({
    headline: z.string(),
    subheadline: z.string(),
    bullets: z.array(z.string()),
    cta: z.string(),
  }),
});

export const creativeBriefSchema = z.object({
  concept: z.string(),
  visualDirection: z.string(),
  imagePrompt: z.string(),
  imageNegativePrompt: z.string(),
  videoPrompt: z.string(),
  aspectRatio: z.string(),
  duration: z.number(),
  shotList: z.array(z.string()),
});

export const publishingPlanSchema = z.object({
  summary: z.string(),
  posts: z.array(z.object({
    platform: z.string(),
    format: z.string(),
    scheduledFor: z.string(),
    captionRef: z.string(),
    assetType: z.string(),
    status: z.string(),
  })),
  approvalChecklist: z.array(z.string()),
  tracking: z.object({
    utmSource: z.string(),
    utmCampaign: z.string(),
    primaryKpi: z.string(),
  }),
});

export const analyticsAgentSchema = z.object({
  summary: z.string(),
  metricReadout: z.array(z.object({
    metric: z.string(),
    value: z.string(),
    interpretation: z.string(),
  })),
  insights: z.array(z.string()),
  recommendations: z.array(z.string()),
});

export const learningInsightSchema = z.object({
  summary: z.string(),
  wins: z.array(z.string()),
  losses: z.array(z.string()),
  recommendations: z.array(z.string()),
  futureExperiments: z.array(z.string()),
});

export type BrandAnalysisOutput = z.infer<typeof brandAnalysisSchema>;
export type CompetitorAnalysisOutput = z.infer<typeof competitorAnalysisSchema>;
export type CampaignStrategyOutput = z.infer<typeof campaignStrategySchema>;
export type CampaignCopyOutput = z.infer<typeof campaignCopySchema>;
export type CreativeBriefOutput = z.infer<typeof creativeBriefSchema>;
export type PublishingPlanOutput = z.infer<typeof publishingPlanSchema>;
export type AnalyticsAgentOutput = z.infer<typeof analyticsAgentSchema>;
export type LearningInsightOutput = z.infer<typeof learningInsightSchema>;
