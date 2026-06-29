import { BarChart3 } from "lucide-react";
import { EngagementChart } from "@/components/analytics/engagement-chart";
import { MetricsCard } from "@/components/analytics/metrics-card";
import { PlatformBreakdown } from "@/components/analytics/platform-breakdown";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { requireWorkspaceBySlug } from "@/lib/utils/workspace";

export default async function AnalyticsPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params;
  const { workspace } = await requireWorkspaceBySlug(workspaceSlug);
  const [snapshots, campaignAnalytics, recommendations, learnedInsights] = await Promise.all([
    prisma.analyticsSnapshot.findMany({
      where: { campaign: { workspaceId: workspace.id } },
      orderBy: { snapshotDate: "asc" },
      take: 60,
      select: { platform: true, impressions: true, engagement: true, clicks: true, snapshotDate: true },
    }),
    prisma.campaignAnalytics.findMany({
      where: { campaign: { workspaceId: workspace.id } },
      orderBy: { snapshotDate: "desc" },
      take: 100,
      select: { spend: true, reach: true, impressions: true, clicks: true, conversions: true, engagement: true },
    }),
    prisma.campaignRecommendation.findMany({
      where: { campaign: { workspaceId: workspace.id }, status: "open" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, summary: true, recommendation: true },
    }),
    prisma.aIRecommendation.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, summary: true, wins: true, opportunities: true, nextExperiments: true },
    }),
  ]);
  const totals = campaignAnalytics.reduce((acc, item) => ({ spend: acc.spend + Number(item.spend), reach: acc.reach + item.reach, impressions: acc.impressions + item.impressions, clicks: acc.clicks + item.clicks, conversions: acc.conversions + item.conversions, engagement: acc.engagement + item.engagement }), { spend: 0, reach: 0, impressions: 0, clicks: 0, conversions: 0, engagement: 0 });
  const fallbackTotals = snapshots.reduce((acc, item) => ({ impressions: acc.impressions + item.impressions, engagement: acc.engagement + item.engagement, clicks: acc.clicks + item.clicks }), { impressions: 0, engagement: 0, clicks: 0 });
  const rows = Object.values(snapshots.reduce<Record<string, { platform: string; impressions: number; engagement: number }>>((acc, item) => { const row = acc[item.platform] || { platform: item.platform, impressions: 0, engagement: 0 }; row.impressions += item.impressions; row.engagement += item.engagement; acc[item.platform] = row; return acc; }, {}));
  const hasData = snapshots.length || campaignAnalytics.length;

  return (
    <section>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-indigo-200">Performance intelligence</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-white">Learn your way into better ads.</h1>
          <p className="mt-2 text-sm text-slate-400">Meta campaign insights and platform snapshots are synchronized into your workspace.</p>
        </div>
        <div className="flex rounded-lg border border-border bg-bg-surface p-1 text-xs">
          {["Last 7 days", "30 days", "90 days"].map((label, index) => <span key={label} className={index === 1 ? "rounded-md bg-accent px-3 py-1.5 text-white" : "px-3 py-1.5 text-slate-500"}>{label}</span>)}
        </div>
      </div>

      {hasData ? (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4"><MetricsCard label="Spend" value={"Rs " + totals.spend.toLocaleString()} detail="Meta campaign spend" /><MetricsCard label="Reach" value={totals.reach.toLocaleString()} detail="People reached" /><MetricsCard label="Impressions" value={(totals.impressions || fallbackTotals.impressions).toLocaleString()} detail="Ad and post delivery" /><MetricsCard label="Clicks" value={(totals.clicks || fallbackTotals.clicks).toLocaleString()} detail="Signals of intent" /></div>
          <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_.8fr]"><EngagementChart data={snapshots.map((item) => ({ date: item.snapshotDate.toLocaleDateString(undefined, { month: "short", day: "numeric" }), engagement: item.engagement }))} /><PlatformBreakdown rows={rows} /></div>
          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <Card className="p-5"><h2 className="font-medium text-white">AI recommendations</h2><div className="mt-4 space-y-3">{recommendations.length ? recommendations.map((item) => <div key={item.id} className="rounded-xl border border-border bg-bg-base p-3"><p className="text-sm text-slate-200">{item.summary}</p><p className="mt-1 text-xs leading-5 text-slate-400">{item.recommendation}</p></div>) : <p className="text-sm text-slate-500">Recommendations appear after analytics snapshots are synced.</p>}</div></Card>
            <Card className="p-5"><h2 className="font-medium text-white">Insights from past campaigns</h2><div className="mt-4 space-y-3">{learnedInsights.length ? learnedInsights.map((item) => <div key={item.id} className="rounded-xl border border-border bg-bg-base p-3"><p className="text-sm text-slate-200">{item.summary}</p><p className="mt-1 text-xs leading-5 text-slate-400">{[...item.wins, ...item.opportunities, ...item.nextExperiments].slice(0, 3).join(" / ")}</p></div>) : <p className="text-sm text-slate-500">Learning insights appear after analytics sync or a campaign analytics run.</p>}</div></Card>
          </div>
        </>
      ) : (
        <Card className="mt-8 p-12 text-center">
          <BarChart3 className="mx-auto size-16 text-slate-700" />
          <h2 className="mt-4 text-lg font-semibold text-slate-400">No data yet</h2>
          <p className="mt-2 text-sm text-slate-600">Publish posts to start seeing analytics.</p>
        </Card>
      )}
    </section>
  );
}
