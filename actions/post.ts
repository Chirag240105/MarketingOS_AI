"use server";

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { updatePostSchema } from "@/lib/validations/post";
import { requireWorkspaceMembership } from "@/lib/utils/workspace";

export async function updateGeneratedPost(input: unknown) {
  const data = updatePostSchema.parse(input);
  const post = await prisma.generatedPost.findUnique({ where: { id: data.postId }, include: { campaign: true } });
  if (!post) throw new Error("Post not found.");
  const { user, workspace } = await requireWorkspaceMembership(post.campaign.workspaceId, "EDITOR");
  const updated = await prisma.generatedPost.update({
    where: { id: post.id },
    data: { ...data, id: undefined, status: "EDITING" },
  });
  await writeAuditLog({ action: "UPDATE", entityType: "generated_post", entityId: post.id, userId: user.id, workspaceId: workspace.id });
  revalidatePath("/" + workspace.slug + "/campaigns/" + post.campaignId + "/posts");
  return updated;
}
