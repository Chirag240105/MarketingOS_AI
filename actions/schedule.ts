"use server";

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { schedulePostSchema } from "@/lib/validations/post";
import { requireWorkspaceMembership } from "@/lib/utils/workspace";

export async function schedulePost(input: unknown) {
  const data = schedulePostSchema.parse(input);
  const post = await prisma.generatedPost.findUnique({ where: { id: data.postId }, include: { campaign: true } });
  if (!post) throw new Error("Post not found.");
  if (post.status !== "APPROVED") throw new Error("Only approved posts can be scheduled.");
  const { user, workspace } = await requireWorkspaceMembership(post.campaign.workspaceId, "EDITOR");
  const schedule = await prisma.scheduledPost.upsert({
    where: { postId: post.id },
    update: { scheduledAt: data.scheduledAt, timezone: data.timezone, status: "SCHEDULED" },
    create: { postId: post.id, campaignId: post.campaignId, platform: post.platform, scheduledAt: data.scheduledAt, timezone: data.timezone },
  });
  await prisma.generatedPost.update({ where: { id: post.id }, data: { status: "SCHEDULED" } });
  await writeAuditLog({ action: "SCHEDULE", entityType: "scheduled_post", entityId: schedule.id, userId: user.id, workspaceId: workspace.id });
  revalidatePath("/" + workspace.slug + "/calendar");
  return schedule;
}
