import { z } from "zod";
import { socialPlatformSchema } from "./campaign";

export const approvalSchema = z.object({
  postId: z.string().cuid(),
  status: z.enum(["APPROVED", "REJECTED", "CHANGES_REQUESTED"]),
  feedback: z.string().trim().max(1000).optional(),
});

export const schedulePostSchema = z.object({
  postId: z.string().cuid(),
  scheduledAt: z.coerce.date().refine((date) => date > new Date(), "Choose a future time."),
  timezone: z.string().trim().min(2).max(80).default("UTC"),
});

export const updatePostSchema = z.object({
  postId: z.string().cuid(),
  title: z.string().trim().max(180).nullable().optional(),
  body: z.string().trim().min(1).max(5000),
  caption: z.string().trim().max(2200).nullable().optional(),
  hashtags: z.array(z.string().trim().min(1).max(100)).max(30),
  mentions: z.array(z.string().trim().min(1).max(100)).max(20),
  callToAction: z.string().trim().max(300).nullable().optional(),
  platform: socialPlatformSchema.optional(),
});
