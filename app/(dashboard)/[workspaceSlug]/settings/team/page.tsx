import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { requireWorkspaceBySlug } from "@/lib/utils/workspace";

export default async function TeamPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params;
  const { workspace } = await requireWorkspaceBySlug(workspaceSlug, "ADMIN");
  const members = await prisma.membership.findMany({ where: { workspaceId: workspace.id }, include: { user: true }, orderBy: { joinedAt: "asc" } });
  return <section><p className="text-sm font-medium text-indigo-200">Team</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">People with context.</h1><Card className="mt-8 overflow-hidden">{members.map((membership) => <div key={membership.id} className="flex items-center justify-between border-b border-white/8 px-5 py-4 last:border-0"><div><p className="text-sm font-medium text-white">{membership.user.name || membership.user.email}</p><p className="mt-1 text-xs text-slate-500">{membership.user.email}</p></div><Badge tone={membership.role === "OWNER" ? "indigo" : "slate"}>{membership.role}</Badge></div>)}</Card></section>;
}
