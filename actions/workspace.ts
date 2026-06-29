"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { getCurrentUser, requireWorkspaceMembership } from "@/lib/utils/workspace";

const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2).max(100),
});

const updateWorkspaceSettingsSchema = z.object({
  workspaceId: z.string().cuid(),
  name: z.string().trim().min(2).max(100),
  brandColors: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).min(1).max(4),
});

export async function createWorkspace(input: z.infer<typeof createWorkspaceSchema>) {
  const user = await getCurrentUser();
  const data = createWorkspaceSchema.parse(input);
  const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + crypto.randomUUID().slice(0, 6);
  const workspace = await prisma.workspace.create({
    data: {
      name: data.name,
      slug,
      ownerId: user.id,
      memberships: { create: { userId: user.id, role: "OWNER" } },
    },
  });
  await writeAuditLog({ action: "CREATE", entityType: "workspace", entityId: workspace.id, userId: user.id, workspaceId: workspace.id });
  revalidatePath("/");
  return workspace;
}

export async function updateWorkspaceSettings(input: unknown) {
  const data = updateWorkspaceSettingsSchema.parse(input);
  const { user, workspace } = await requireWorkspaceMembership(data.workspaceId, "ADMIN");
  const updated = await prisma.workspace.update({
    where: { id: workspace.id },
    data: { name: data.name },
  });
  await prisma.brandProfile.updateMany({
    where: { workspaceId: workspace.id },
    data: { brandColors: data.brandColors as never },
  });
  await writeAuditLog({
    action: "UPDATE",
    entityType: "workspace",
    entityId: workspace.id,
    userId: user.id,
    workspaceId: workspace.id,
    details: { name: data.name, brandColorsUpdated: true },
  });
  revalidatePath("/" + workspace.slug + "/settings");
  return updated;
}
