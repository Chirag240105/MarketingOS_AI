import { z } from "zod";

export const socialPlatformSchema = z.enum([
  "INSTAGRAM",
  "FACEBOOK",
  "X",
  "LINKEDIN",
  "TIKTOK",
  "YOUTUBE",
  "PINTEREST",
]);

export const campaignGoalSchema = z.enum([
  "BRAND_AWARENESS",
  "LEAD_GENERATION",
  "SALES_CONVERSION",
  "ENGAGEMENT",
  "TRAFFIC",
  "APP_INSTALLS",
  "VIDEO_VIEWS",
  "RETARGETING",
]);

export const campaignSchema = z.object({
  workspaceId: z.string().cuid(),
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).optional(),
  goal: campaignGoalSchema,
  budget: z.coerce.number().positive().max(10_000_000).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  platforms: z.array(socialPlatformSchema).min(1).max(7),
  targetAudience: z.record(z.string(), z.unknown()).optional(),
});

export const campaignGenerationSchema = z.object({
  campaignId: z.string().cuid(),
  includeVisuals: z.boolean().default(true),
  includeVideo: z.boolean().default(true),
});

export type CampaignInput = z.infer<typeof campaignSchema>;
