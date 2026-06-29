import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EngagementChart } from "@/components/analytics/engagement-chart";
import { MetricsCard } from "@/components/analytics/metrics-card";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { requireWorkspaceBySlug } from "@/lib/utils/workspace";

export default async function CampaignAnalyticsPage({ params }: { params: Promise<{ workspaceSlug: string; id: string }> }) {
  const { workspaceSlug, id } = await params;
  const { workspace } = await requireWorkspaceBySlug(workspaceSlug);
  const campaign = await prisma.campaign.findFirst({
    where: { id, workspaceId: workspace.id },
    include: {
      analyticsSnapshots: { orderBy: { snapshotDate: "asc" } },
      campaignAnalytics: { orderBy: { snapshotDate: "desc" }, take: 20 },
      campaignRecommendations: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!campaign) return <p className="text-slate-400">Campaign not found.</p>;
  const latest = campaign.campaignAnalytics[0];
  const postTotal = campaign.analyticsSnapshots.reduce((acc, item) => ({ impressions: acc.impressions + item.impressions, engagement: acc.engagement + item.engagement }), { impressions: 0, engagement: 0 });
  return <section><Link href={"/"+workspace.slug+"/campaigns/"+campaign.id} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft className="size-4" />Back to campaign</Link><h1 className="mt-5 text-3xl font-semibold tracking-tight text-white">{campaign.name} performance</h1><div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricsCard label="Spend" value={latest ? "₹" + latest.spend.toString() : "₹0"} detail="Latest Meta snapshot" /><MetricsCard label="Reach" value={(latest?.reach || 0).toLocaleString()} detail="People reached" /><MetricsCard label="CTR" value={latest?.ctr ? (latest.ctr * 100).toFixed(2) + "%" : "-"} detail="Click-through rate" /><MetricsCard label="ROAS" value={latest?.roas ? latest.roas.toFixed(2) + "x" : "-"} detail="Return on ad spend" /></div><div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricsCard label="Impressions" value={(latest?.impressions || postTotal.impressions).toLocaleString()} detail="Ad and post delivery" /><MetricsCard label="Clicks" value={(latest?.clicks || 0).toLocaleString()} detail="Meta clicks" /><MetricsCard label="CPC" value={latest?.cpc ? "₹" + latest.cpc.toString() : "-"} detail="Cost per click" /><MetricsCard label="Frequency" value={latest?.frequency ? latest.frequency.toFixed(2) : "-"} detail="Average exposures" /></div><div className="mt-5"><EngagementChart data={campaign.analyticsSnapshots.map((item) => ({ date: item.snapshotDate.toLocaleDateString(undefined, { month: "short", day: "numeric" }), engagement: item.engagement }))} /></div><Card className="mt-5 p-5"><h2 className="font-medium text-white">Optimization recommendations</h2><div className="mt-4 space-y-3">{campaign.campaignRecommendations.length ? campaign.campaignRecommendations.map((item) => <div key={item.id} className="rounded-xl border border-white/10 bg-slate-950/40 p-3"><p className="text-sm text-slate-200">{item.summary}</p><p className="mt-1 text-xs leading-5 text-slate-400">{item.recommendation}</p></div>) : <p className="text-sm text-slate-500">Sync analytics to generate recommendations for this campaign.</p>}</div></Card></section>;
}
