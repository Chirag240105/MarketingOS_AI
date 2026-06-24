import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SocialConnectForm } from "@/components/social-connect-form";
import { prisma } from "@/lib/db";
import { requireWorkspaceBySlug } from "@/lib/utils/workspace";

export default async function SocialAccountsPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params;
  const { workspace } = await requireWorkspaceBySlug(workspaceSlug, "ADMIN");
  const accounts = await prisma.socialAccount.findMany({ where: { workspaceId: workspace.id }, orderBy: { platform: "asc" } });
  return <section><p className="text-sm font-medium text-indigo-200">Distribution layer</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Connect the places your audience lives.</h1><p className="mt-2 text-sm text-slate-400">Mock connections simulate publishing today; provider adapters are ready for OAuth credentials later.</p><div className="mt-8"><SocialConnectForm workspaceId={workspace.id} /></div><div className="mt-5 grid gap-4 md:grid-cols-2">{accounts.map((account) => <Card key={account.id} className="p-5"><div className="flex items-center justify-between"><p className="font-medium text-white">{account.platform}</p><Badge tone={account.isConnected ? "emerald" : "slate"}>{account.isConnected ? "Connected" : "Disconnected"}</Badge></div><p className="mt-3 text-sm text-slate-300">{account.accountName}</p><p className="mt-1 text-xs text-slate-500">{account.handle || "No public handle"} · Mock provider</p></Card>)}</div></section>;
}
