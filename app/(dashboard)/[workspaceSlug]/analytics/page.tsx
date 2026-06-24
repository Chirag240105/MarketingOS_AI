import { EngagementChart } from "@/components/analytics/engagement-chart";
import { MetricsCard } from "@/components/analytics/metrics-card";
import { PlatformBreakdown } from "@/components/analytics/platform-breakdown";
import { prisma } from "@/lib/db";
import { requireWorkspaceBySlug } from "@/lib/utils/workspace";

export default async function AnalyticsPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params;
  const { workspace } = await requireWorkspaceBySlug(workspaceSlug);
  const snapshots = await prisma.analyticsSnapshot.findMany({ where: { campaign: { workspaceId: workspace.id } }, orderBy: { snapshotDate: "asc" }, take: 60 });
  const totals = snapshots.reduce((acc, item) => ({ impressions: acc.impressions + item.impressions, engagement: acc.engagement + item.engagement, clicks: acc.clicks + item.clicks }), { impressions: 0, engagement: 0, clicks: 0 });
  const rows = Object.values(snapshots.reduce<Record<string, { platform: string; impressions: number; engagement: number }>>((acc, item) => { const row = acc[item.platform] || { platform: item.platform, impressions: 0, engagement: 0 }; row.impressions += item.impressions; row.engagement += item.engagement; acc[item.platform] = row; return acc; }, {}));
  return <section><p className="text-sm font-medium text-indigo-200">Performance intelligence</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Learn your way into better work.</h1><p className="mt-2 text-sm text-slate-400">Mock sync data today; the same schema is ready for real provider insights later.</p><div className="mt-8 grid gap-4 md:grid-cols-3"><MetricsCard label="Impressions" value={totals.impressions.toLocaleString()} detail="Across connected platforms" /><MetricsCard label="Engagements" value={totals.engagement.toLocaleString()} detail="A useful proxy for resonance" /><MetricsCard label="Clicks" value={totals.clicks.toLocaleString()} detail="Signals of deeper intent" /></div><div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_.8fr]"><EngagementChart data={snapshots.map((item) => ({ date: item.snapshotDate.toLocaleDateString(undefined, { month: "short", day: "numeric" }), engagement: item.engagement }))} /><PlatformBreakdown rows={rows} /></div></section>;
}
