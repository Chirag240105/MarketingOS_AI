import { z } from "zod";

const optionalUrl = z.union([z.string().url(), z.literal("")]).optional();

export const brandProfileSchema = z.object({
  workspaceId: z.string().cuid(),
  companyName: z.string().trim().min(2).max(120),
  website: optionalUrl,
  description: z.string().trim().max(2000).optional(),
  mission: z.string().trim().max(1000).optional(),
  vision: z.string().trim().max(1000).optional(),
  values: z.array(z.string().trim().min(1).max(80)).max(8).default([]),
  toneOfVoice: z.string().trim().max(300).optional(),
  industry: z.string().trim().max(100).optional(),
  competitors: z.array(z.string().trim().min(1).max(120)).max(10).default([]),
  hashtags: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  targetAudience: z.record(z.string(), z.unknown()).optional(),
  brandColors: z.record(z.string(), z.string()).optional(),
});

export type BrandProfileInput = z.infer<typeof brandProfileSchema>;
