import Link from "next/link";
import { Plus } from "lucide-react";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { Button } from "@/components/ui/button";
import { requireWorkspaceBySlug } from "@/lib/utils/workspace";
import { prisma } from "@/lib/db";

export default async function CampaignsPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params;
  const { workspace } = await requireWorkspaceBySlug(workspaceSlug);
  const campaigns = await prisma.campaign.findMany({ where: { workspaceId: workspace.id }, orderBy: { updatedAt: "desc" } });
  return <section><div className="flex items-end justify-between"><div><p className="text-sm font-medium text-indigo-200">Campaign library</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Work with intent.</h1><p className="mt-2 text-sm text-slate-400">Each campaign carries strategy, content, approvals, and outcomes together.</p></div><Link href={"/"+workspace.slug+"/campaigns/new"}><Button><Plus className="size-4" />New campaign</Button></Link></div><div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{campaigns.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} workspaceSlug={workspace.slug} />)}</div></section>;
}
