"use server";

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { campaignSchema } from "@/lib/validations/campaign";
import { requireWorkspaceMembership } from "@/lib/utils/workspace";

export async function createCampaign(input: unknown) {
  const data = campaignSchema.parse(input);
  const { user, workspace } = await requireWorkspaceMembership(data.workspaceId, "EDITOR");
  if (data.endDate && data.startDate && data.endDate < data.startDate) throw new Error("Campaign end date must be after its start date.");
  const campaign = await prisma.campaign.create({
    data: {
      workspaceId: workspace.id,
      name: data.name,
      description: data.description,
      goal: data.goal,
      budget: data.budget,
      startDate: data.startDate,
      endDate: data.endDate,
      platforms: data.platforms,
      targetAudience: data.targetAudience as never,
      createdBy: user.id,
    },
  });
  await writeAuditLog({ action: "CREATE", entityType: "campaign", entityId: campaign.id, userId: user.id, workspaceId: workspace.id });
  revalidatePath("/" + workspace.slug + "/campaigns");
  return campaign;
}

export async function updateCampaignStatus(campaignId: string, status: "DRAFT" | "PAUSED" | "ACTIVE" | "ARCHIVED") {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new Error("Campaign not found.");
  const { user, workspace } = await requireWorkspaceMembership(campaign.workspaceId, "EDITOR");
  const updated = await prisma.campaign.update({ where: { id: campaignId }, data: { status } });
  await writeAuditLog({ action: "UPDATE", entityType: "campaign", entityId: campaignId, userId: user.id, workspaceId: workspace.id, details: { status } });
  revalidatePath("/" + workspace.slug + "/campaigns/" + campaignId);
  return updated;
}
