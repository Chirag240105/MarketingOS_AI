"use server";

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit";
import { recordCampaignHistory } from "@/lib/campaign-history";
import { prisma } from "@/lib/db";
import { createMetaAd, createMetaAdSet, createMetaCampaign, setMetaCampaignStatus } from "@/lib/meta-marketing/service";
import { toReadableErrorMessage } from "@/lib/utils/error-message";
import { requireWorkspaceMembership } from "@/lib/utils/workspace";

async function requireCampaignEditor(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new Error("Campaign not found.");
  const { user, workspace } = await requireWorkspaceMembership(campaign.workspaceId, "EDITOR");
  return { campaign, user, workspace };
}

export async function createMetaCampaignBundle(campaignId: string) {
  try {
    const { campaign, user, workspace } = await requireCampaignEditor(campaignId);
    const metaCampaign = await createMetaCampaign(campaign.id);
    const adSet = await createMetaAdSet(campaign.id);
    const ad = await createMetaAd(campaign.id);
    await writeAuditLog({ action: "PUBLISH", entityType: "meta_campaign", entityId: metaCampaign.id, userId: user.id, workspaceId: workspace.id, details: { status: "PAUSED" } });
    await recordCampaignHistory({ campaignId: campaign.id, userId: user.id, action: "META_CAMPAIGN_CREATED", details: { metaCampaignId: metaCampaign.externalId, adSetId: adSet.externalId, adId: ad.externalId } });
    revalidatePath("/" + workspace.slug + "/campaigns/" + campaign.id);
    return { metaCampaign, adSet, ad };
  } catch (error) {
    throw new Error(toReadableErrorMessage(error));
  }
}

export async function launchMetaCampaign(campaignId: string) {
  return updateMetaCampaignState(campaignId, "ACTIVE", "META_CAMPAIGN_LAUNCHED");
}

export async function pauseMetaCampaign(campaignId: string) {
  return updateMetaCampaignState(campaignId, "PAUSED", "META_CAMPAIGN_PAUSED");
}

export async function resumeMetaCampaign(campaignId: string) {
  return updateMetaCampaignState(campaignId, "ACTIVE", "META_CAMPAIGN_RESUMED");
}

export async function deleteMetaCampaign(campaignId: string) {
  return updateMetaCampaignState(campaignId, "DELETED", "META_CAMPAIGN_DELETED");
}

async function updateMetaCampaignState(campaignId: string, status: "ACTIVE" | "PAUSED" | "DELETED", action: string) {
  try {
    const { campaign, user, workspace } = await requireCampaignEditor(campaignId);
    const metaCampaign = await setMetaCampaignStatus(campaign.id, status);
    await writeAuditLog({ action: status === "DELETED" ? "DELETE" : "UPDATE", entityType: "meta_campaign", entityId: metaCampaign.id, userId: user.id, workspaceId: workspace.id, details: { status } });
    await recordCampaignHistory({ campaignId: campaign.id, userId: user.id, action, details: { status, externalId: metaCampaign.externalId } });
    revalidatePath("/" + workspace.slug + "/campaigns/" + campaign.id);
    return metaCampaign;
  } catch (error) {
    throw new Error(toReadableErrorMessage(error));
  }
}
