import { TeamManagement } from "@/components/settings/team-management";
import { Card } from "@/components/ui/card";
import { hasPermission } from "@/lib/utils/permissions";
import { prisma } from "@/lib/db";
import { requireWorkspaceBySlug } from "@/lib/utils/workspace";

export default async function TeamPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params;
  const { workspace, membership } = await requireWorkspaceBySlug(workspaceSlug, "VIEWER");
  const members = await prisma.membership.findMany({
    where: { workspaceId: workspace.id },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { joinedAt: "asc" },
  });
  const canManage = hasPermission(membership.role, "team:manage");

  return (
    <section>
      <p className="text-sm font-medium text-indigo-200">Team</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">People with context.</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">Admins and owners can add registered users, update roles, and remove teammates.</p>
      <Card className="mt-8 p-5">
        <TeamManagement workspaceId={workspace.id} members={members} canManage={canManage} viewerRole={membership.role} />
      </Card>
    </section>
  );
}
