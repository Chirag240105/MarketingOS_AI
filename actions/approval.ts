"use server";

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { approvalSchema } from "@/lib/validations/post";
import { requireWorkspaceMembership } from "@/lib/utils/workspace";

export async function reviewPost(input: unknown) {
  const data = approvalSchema.parse(input);
  const post = await prisma.generatedPost.findUnique({ where: { id: data.postId }, include: { campaign: true } });
  if (!post) throw new Error("Post not found.");
  const { user, workspace } = await requireWorkspaceMembership(post.campaign.workspaceId, "EDITOR");
  const approval = await prisma.approval.upsert({
    where: { postId_reviewerId: { postId: post.id, reviewerId: user.id } },
    update: { status: data.status, feedback: data.feedback, reviewedAt: new Date() },
    create: { postId: post.id, reviewerId: user.id, status: data.status, feedback: data.feedback, reviewedAt: new Date() },
  });
  await prisma.generatedPost.update({ where: { id: post.id }, data: { status: data.status === "APPROVED" ? "APPROVED" : "PENDING_APPROVAL" } });
  await writeAuditLog({ action: data.status === "APPROVED" ? "APPROVE" : "REJECT", entityType: "generated_post", entityId: post.id, userId: user.id, workspaceId: workspace.id, details: { feedback: data.feedback } });
  revalidatePath("/" + workspace.slug + "/approvals");
  return approval;
}
