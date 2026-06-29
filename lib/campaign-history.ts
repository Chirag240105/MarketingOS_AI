import { prisma } from "@/lib/db";

export async function recordCampaignHistory(input: {
  campaignId: string;
  userId?: string;
  action: string;
  details?: Record<string, unknown>;
}) {
  await prisma.campaignHistory.create({
    data: {
      campaignId: input.campaignId,
      userId: input.userId,
      action: input.action,
      details: input.details as never,
    },
  });
}
