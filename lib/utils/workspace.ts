import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { WorkspaceRole } from "@/types/db";

const roleOrder: WorkspaceRole[] = ["VIEWER", "MEMBER", "EDITOR", "ADMIN", "OWNER"];

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

export async function requireWorkspaceMembership(
  workspaceId: string,
  minimumRole: WorkspaceRole = "VIEWER",
) {
  const user = await getCurrentUser();
  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
    include: { workspace: true },
  });

  if (!membership || roleOrder.indexOf(membership.role) < roleOrder.indexOf(minimumRole)) {
    throw new Error("You do not have access to this workspace.");
  }

  return { user, membership, workspace: membership.workspace };
}

export async function requireWorkspaceBySlug(
  slug: string,
  minimumRole: WorkspaceRole = "VIEWER",
) {
  const workspace = await prisma.workspace.findUnique({ where: { slug } });
  if (!workspace) throw new Error("Workspace not found.");
  return requireWorkspaceMembership(workspace.id, minimumRole);
}
