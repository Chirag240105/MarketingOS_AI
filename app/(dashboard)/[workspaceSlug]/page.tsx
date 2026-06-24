import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { MetricsCard } from "@/components/analytics/metrics-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireWorkspaceBySlug } from "@/lib/utils/workspace";

export default async function WorkspaceOverview({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params;
  const { workspace } = await requireWorkspaceBySlug(workspaceSlug);
  const campaigns = await (await import("@/lib/db")).prisma.campaign.findMany({ where: { workspaceId: workspace.id }, orderBy: { updatedAt: "desc" }, take: 3 });
  const pending = await (await import("@/lib/db")).prisma.generatedPost.count({ where: { campaign: { workspaceId: workspace.id }, status: "PENDING_APPROVAL" } });
  const scheduled = await (await import("@/lib/db")).prisma.scheduledPost.count({ where: { campaign: { workspaceId: workspace.id }, status: "SCHEDULED" } });
  return (
    <section>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-indigo-200">Good momentum</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">{workspace.name}</h1><p className="mt-2 text-sm text-slate-400">A clear view of what your marketing agents are moving forward.</p></div><Link href={"/"+workspace.slug+"/campaigns/new"}><Button>New campaign <ArrowRight className="size-4" /></Button></Link></div>
      <div className="mt-7 grid gap-4 md:grid-cols-3"><MetricsCard label="Approval inbox" value={String(pending)} detail="Ready for a human decision" /><MetricsCard label="Scheduled" value={String(scheduled)} detail="Next post is safely queued" /><MetricsCard label="Active campaigns" value={String(campaigns.filter((item) => item.status === "ACTIVE").length)} detail="Strategy is in motion" /></div>
      <div className="mt-8 grid gap-5 xl:grid-cols-[1.35fr_.65fr]"><div><div className="mb-4 flex items-center justify-between"><h2 className="font-medium text-white">Recent campaigns</h2><Link href={"/"+workspace.slug+"/campaigns"} className="text-sm text-indigo-300">View all</Link></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{campaigns.length ? campaigns.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} workspaceSlug={workspace.slug} />) : <Card className="col-span-full p-8 text-center"><Sparkles className="mx-auto size-6 text-indigo-300" /><p className="mt-3 font-medium text-white">Your first campaign starts here.</p><p className="mt-1 text-sm text-slate-400">Set a goal, choose platforms, and let the agent team draft the work.</p><Link className="mt-5 inline-block" href={"/"+workspace.slug+"/campaigns/new"}><Button size="sm">Create campaign</Button></Link></Card>}</div></div>
        <Card className="p-5"><p className="font-medium text-white">Next best move</p><p className="mt-3 text-sm leading-6 text-slate-400">{pending ? "Your agents have done their part. Review the pending drafts and keep a human decision at the publishing gate." : "Set your brand profile first so every agent can write with a consistent point of view."}</p><Link href={pending ? "/"+workspace.slug+"/approvals" : "/"+workspace.slug+"/brand"} className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-indigo-300">{pending ? "Open approvals" : "Add brand context"} <ArrowRight className="size-4" /></Link><div className="mt-8 border-t border-white/8 pt-4 text-xs text-slate-500"><CheckCircle2 className="mr-2 inline size-3.5 text-emerald-300" />Workspace access is role-gated and audit logged.</div></Card></div>
    </section>
  );
}
