"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { requireWorkspaceMembership } from "@/lib/utils/workspace";

const connectSchema = z.object({
  workspaceId: z.string().cuid(),
  platform: z.enum(["INSTAGRAM", "FACEBOOK", "X", "LINKEDIN", "TIKTOK", "YOUTUBE", "PINTEREST"]),
  accountName: z.string().min(2).max(100),
  handle: z.string().max(100).optional(),
});

export async function connectMockSocialAccount(input: unknown) {
  const data = connectSchema.parse(input);
  const { user, workspace } = await requireWorkspaceMembership(data.workspaceId, "ADMIN");
  const existing = await prisma.socialAccount.findFirst({ where: { workspaceId: workspace.id, platform: data.platform } });
  const account = existing
    ? await prisma.socialAccount.update({ where: { id: existing.id }, data: { accountName: data.accountName, handle: data.handle, isConnected: true, metadata: { provider: "mock" } } })
    : await prisma.socialAccount.create({ data: { workspaceId: workspace.id, platform: data.platform, accountName: data.accountName, handle: data.handle, isConnected: true, metadata: { provider: "mock" } } });
  await writeAuditLog({ action: "UPDATE", entityType: "social_account", entityId: account.id, userId: user.id, workspaceId: workspace.id, details: { provider: "mock" } });
  revalidatePath("/" + workspace.slug + "/social-accounts");
  return account;
}
