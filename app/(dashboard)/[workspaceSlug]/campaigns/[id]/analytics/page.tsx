import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EngagementChart } from "@/components/analytics/engagement-chart";
import { MetricsCard } from "@/components/analytics/metrics-card";
import { prisma } from "@/lib/db";
import { requireWorkspaceBySlug } from "@/lib/utils/workspace";

export default async function CampaignAnalyticsPage({ params }: { params: Promise<{ workspaceSlug: string; id: string }> }) {
  const { workspaceSlug, id } = await params;
  const { workspace } = await requireWorkspaceBySlug(workspaceSlug);
  const campaign = await prisma.campaign.findFirst({ where: { id, workspaceId: workspace.id }, include: { analyticsSnapshots: { orderBy: { snapshotDate: "asc" } } } });
  if (!campaign) return <p className="text-slate-400">Campaign not found.</p>;
  const total = campaign.analyticsSnapshots.reduce((acc, item) => ({ impressions: acc.impressions + item.impressions, engagement: acc.engagement + item.engagement }), { impressions: 0, engagement: 0 });
  return <section><Link href={"/"+workspace.slug+"/campaigns/"+campaign.id} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft className="size-4" />Back to campaign</Link><h1 className="mt-5 text-3xl font-semibold tracking-tight text-white">{campaign.name} performance</h1><div className="mt-7 grid gap-4 sm:grid-cols-2"><MetricsCard label="Impressions" value={total.impressions.toLocaleString()} detail="Tracked snapshots" /><MetricsCard label="Engagements" value={total.engagement.toLocaleString()} detail="Combined platform response" /></div><div className="mt-5"><EngagementChart data={campaign.analyticsSnapshots.map((item) => ({ date: item.snapshotDate.toLocaleDateString(undefined, { month: "short", day: "numeric" }), engagement: item.engagement }))} /></div></section>;
}
