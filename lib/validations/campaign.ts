import { z } from "zod";
import { SELECTABLE_PLATFORMS } from "@/config/platforms";

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
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED"]).default("DRAFT"),
  budget: z.coerce.number().positive().max(10_000_000).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  platforms: z.array(socialPlatformSchema).min(1).max(7).refine(
    (platforms) => platforms.every((platform) => SELECTABLE_PLATFORMS.some((item) => item.id === platform)),
    "One or more selected platforms are not available for publishing yet.",
  ),
  targetAudience: z.record(z.string(), z.unknown()).optional(),
  offer: z.string().trim().max(1000).optional(),
  notes: z.string().trim().max(2000).optional(),
  generateVideo: z.coerce.boolean().default(false),
});

export const campaignGenerationSchema = z.object({
  campaignId: z.string().cuid(),
  includeVisuals: z.boolean().default(true),
  includeVideo: z.boolean().default(true),
});

export type CampaignInput = z.infer<typeof campaignSchema>;
