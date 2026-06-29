"use server";

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit";
import { recordCampaignHistory } from "@/lib/campaign-history";
import { prisma } from "@/lib/db";
import { updatePostSchema } from "@/lib/validations/post";
import { requireWorkspaceMembership } from "@/lib/utils/workspace";

export async function updateGeneratedPost(input: unknown) {
  const data = updatePostSchema.parse(input);
  const post = await prisma.generatedPost.findUnique({ where: { id: data.postId }, include: { campaign: true } });
  if (!post) throw new Error("Post not found.");
  const { user, workspace } = await requireWorkspaceMembership(post.campaign.workspaceId, "EDITOR");
  const { postId: _postId, ...updates } = data;
  const updated = await prisma.generatedPost.update({
    where: { id: post.id },
    data: { ...updates, status: "EDITING" },
  });
  await writeAuditLog({ action: "UPDATE", entityType: "generated_post", entityId: post.id, userId: user.id, workspaceId: workspace.id });
  await recordCampaignHistory({ campaignId: post.campaignId, userId: user.id, action: "DRAFT_EDITED", details: { postId: post.id, platform: post.platform } });
  revalidatePath("/" + workspace.slug + "/campaigns/" + post.campaignId + "/posts");
  return updated;
}
