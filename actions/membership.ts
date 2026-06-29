"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import type { MembershipRole } from "@/lib/generated/prisma/client";
import { requireWorkspaceMembership } from "@/lib/utils/workspace";

const roleSchema = z.enum(["OWNER", "ADMIN", "EDITOR", "MEMBER", "VIEWER"]);

const inviteSchema = z.object({
  workspaceId: z.string().cuid(),
  email: z.string().trim().email(),
  role: roleSchema.exclude(["OWNER"]),
});

const updateSchema = z.object({
  workspaceId: z.string().cuid(),
  membershipId: z.string().cuid(),
  role: roleSchema,
});

const removeSchema = z.object({
  workspaceId: z.string().cuid(),
  membershipId: z.string().cuid(),
});

export async function inviteMember(input: unknown) {
  const data = inviteSchema.parse(input);
  const { user, membership, workspace } = await requireWorkspaceMembership(data.workspaceId, "ADMIN");
  const invitedUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (!invitedUser) throw new Error("Ask this person to register first, then invite them again.");

  const created = await prisma.membership.upsert({
    where: { userId_workspaceId: { userId: invitedUser.id, workspaceId: workspace.id } },
    update: { role: data.role },
    create: { userId: invitedUser.id, workspaceId: workspace.id, role: data.role },
  });

  await writeAuditLog({
    action: "INVITE",
    entityType: "membership",
    entityId: created.id,
    userId: user.id,
    workspaceId: workspace.id,
    details: { email: data.email, role: data.role, inviterRole: membership.role },
  });
  revalidatePath("/" + workspace.slug + "/settings/team");
  revalidatePath("/" + workspace.slug + "/settings");
  return created;
}

export async function updateMemberRole(input: unknown) {
  const data = updateSchema.parse(input);
  const { user, membership, workspace } = await requireWorkspaceMembership(data.workspaceId, "ADMIN");
  const target = await prisma.membership.findFirst({ where: { id: data.membershipId, workspaceId: workspace.id } });
  if (!target) throw new Error("Membership not found.");
  if (data.role === "OWNER" && membership.role !== "OWNER") throw new Error("Only an owner can grant owner access.");
  if (target.role === "OWNER" && data.role !== "OWNER") await assertAnotherOwner(workspace.id, target.id);

  const updated = await prisma.membership.update({ where: { id: target.id }, data: { role: data.role as MembershipRole } });
  await writeAuditLog({
    action: "UPDATE_ROLE",
    entityType: "membership",
    entityId: target.id,
    userId: user.id,
    workspaceId: workspace.id,
    details: { from: target.role, to: data.role },
  });
  revalidatePath("/" + workspace.slug + "/settings/team");
  revalidatePath("/" + workspace.slug + "/settings");
  return updated;
}

export async function removeMember(input: unknown) {
  const data = removeSchema.parse(input);
  const { user, workspace } = await requireWorkspaceMembership(data.workspaceId, "ADMIN");
  const target = await prisma.membership.findFirst({ where: { id: data.membershipId, workspaceId: workspace.id } });
  if (!target) throw new Error("Membership not found.");
  if (target.role === "OWNER") await assertAnotherOwner(workspace.id, target.id);

  await prisma.membership.delete({ where: { id: target.id } });
  await writeAuditLog({
    action: "REMOVE_MEMBER",
    entityType: "membership",
    entityId: target.id,
    userId: user.id,
    workspaceId: workspace.id,
    details: { removedUserId: target.userId, role: target.role },
  });
  revalidatePath("/" + workspace.slug + "/settings/team");
  revalidatePath("/" + workspace.slug + "/settings");
  return { ok: true };
}

async function assertAnotherOwner(workspaceId: string, excludedMembershipId: string) {
  const owners = await prisma.membership.count({
    where: { workspaceId, role: "OWNER", id: { not: excludedMembershipId } },
  });
  if (!owners) throw new Error("A workspace must keep at least one owner.");
}
