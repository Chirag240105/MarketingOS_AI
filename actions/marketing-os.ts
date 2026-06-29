"use server";

import { revalidatePath } from "next/cache";
import { runCampaignAnalyticsAgent, runCampaignLearningAgent, runCampaignPipeline } from "@/lib/ai/marketing-os/pipeline";
import { prisma } from "@/lib/db";
import { requireWorkspaceMembership } from "@/lib/utils/workspace";

export async function runMarketingOsPipeline(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId }, select: { workspaceId: true } });
  if (!campaign) throw new Error("Campaign not found.");
  const { workspace } = await requireWorkspaceMembership(campaign.workspaceId, "EDITOR");
  const result = await runCampaignPipeline(campaignId);
  revalidatePath("/" + workspace.slug + "/campaigns");
  revalidatePath("/" + workspace.slug + "/campaigns/" + campaignId);
  revalidatePath("/" + workspace.slug + "/campaigns/" + campaignId + "/run");
  return result;
}

export async function runMarketingOsAnalytics(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId }, select: { workspaceId: true } });
  if (!campaign) throw new Error("Campaign not found.");
  const { workspace } = await requireWorkspaceMembership(campaign.workspaceId, "EDITOR");
  const result = await runCampaignAnalyticsAgent(campaignId);
  revalidatePath("/" + workspace.slug + "/campaigns/" + campaignId);
  return result;
}

export async function runMarketingOsLearning(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId }, select: { workspaceId: true } });
  if (!campaign) throw new Error("Campaign not found.");
  const { workspace } = await requireWorkspaceMembership(campaign.workspaceId, "EDITOR");
  const result = await runCampaignLearningAgent(campaignId);
  revalidatePath("/" + workspace.slug + "/campaigns/" + campaignId);
  return result;
}
