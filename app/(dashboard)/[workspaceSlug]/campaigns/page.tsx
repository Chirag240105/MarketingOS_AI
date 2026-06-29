import Link from "next/link";
import { FolderOpen, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PLATFORM_LIST, platformLabel } from "@/config/platforms";
import { prisma } from "@/lib/db";
import { requireWorkspaceBySlug } from "@/lib/utils/workspace";

const tones: Record<string, "slate" | "indigo" | "emerald" | "amber" | "rose"> = {
  ACTIVE: "emerald",
  REVIEW: "amber",
  GENERATING: "indigo",
  BRAND_ANALYZED: "indigo",
  COMPETITOR_ANALYZED: "indigo",
  STRATEGY_READY: "indigo",
  COPY_READY: "indigo",
  CREATIVE_READY: "indigo",
  READY_TO_PUBLISH: "emerald",
  PUBLISHED: "emerald",
  ANALYZED: "emerald",
  LEARNING_UPDATED: "emerald",
  FAILED: "rose",
  DRAFT: "slate",
  PAUSED: "rose",
  SCHEDULED: "indigo",
  COMPLETED: "emerald",
};

const marketingOsSteps = [
  "Brand Analysis Agent",
  "Competitor Analysis Agent",
  "Campaign Strategy Agent",
  "Copywriting Agent",
  "Creative Generation Agent",
  "Publishing Agent",
];

export default async function CampaignsPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<{ status?: string; objective?: string; platform?: string; q?: string }>;
}) {
  const { workspaceSlug } = await params;
  const filters = await searchParams;
  const { workspace } = await requireWorkspaceBySlug(workspaceSlug);
  const campaigns = await prisma.campaign.findMany({
    where: {
      workspaceId: workspace.id,
      status: filters.status ? filters.status as never : undefined,
      goal: filters.objective ? filters.objective as never : undefined,
      platforms: filters.platform ? { has: filters.platform as never } : undefined,
      name: filters.q ? { contains: filters.q, mode: "insensitive" } : undefined,
    },
    select: {
      id: true,
      name: true,
      goal: true,
      budget: true,
      status: true,
      platforms: true,
      createdAt: true,
      campaignAnalytics: {
        orderBy: { snapshotDate: "desc" },
        take: 1,
        select: { spend: true, reach: true, impressions: true, clicks: true, ctr: true, cpc: true, cpm: true, conversions: true, roas: true },
      },
      agentRuns: {
        where: { status: "COMPLETED", agentName: { in: marketingOsSteps } },
        select: { agentName: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-indigo-200">Campaign dashboard</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-white">Manage ads from one place.</h1>
          <p className="mt-2 text-sm text-slate-400">Create, launch, monitor, and optimize your marketing campaigns.</p>
        </div>
        <Link href={"/" + workspace.slug + "/campaigns/new"}><Button><Plus className="size-4" />New campaign</Button></Link>
      </div>

      <Card className="mt-6 p-4">
        <form className="grid gap-3 md:grid-cols-[1.2fr_.8fr_.8fr_.8fr_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 size-4 text-slate-500" />
            <input name="q" defaultValue={filters.q || ""} placeholder="Search campaigns" className="h-10 w-full rounded-lg border border-border bg-bg-base pl-9 pr-3 text-sm text-slate-100 outline-none focus:border-indigo-500" />
          </label>
          <select name="status" defaultValue={filters.status || ""} className="h-10 rounded-lg border border-border bg-bg-base px-3 text-sm text-slate-100 outline-none"><option value="">All statuses</option><option value="DRAFT">Draft</option><option value="BRAND_ANALYZED">Brand analyzed</option><option value="COMPETITOR_ANALYZED">Competitor analyzed</option><option value="STRATEGY_READY">Strategy ready</option><option value="COPY_READY">Copy ready</option><option value="CREATIVE_READY">Creative ready</option><option value="READY_TO_PUBLISH">Ready to publish</option><option value="FAILED">Failed</option><option value="ACTIVE">Active</option><option value="COMPLETED">Completed</option><option value="REVIEW">Review</option><option value="PAUSED">Paused</option></select>
          <select name="objective" defaultValue={filters.objective || ""} className="h-10 rounded-lg border border-border bg-bg-base px-3 text-sm text-slate-100 outline-none"><option value="">All objectives</option><option value="LEAD_GENERATION">Lead generation</option><option value="BRAND_AWARENESS">Awareness</option><option value="SALES_CONVERSION">Sales</option><option value="ENGAGEMENT">Engagement</option><option value="TRAFFIC">Traffic</option></select>
          <select name="platform" defaultValue={filters.platform || ""} className="h-10 rounded-lg border border-border bg-bg-base px-3 text-sm text-slate-100 outline-none"><option value="">All platforms</option>{PLATFORM_LIST.map((platform) => <option key={platform.id} value={platform.id}>{platform.label}{platform.publishingSupported ? "" : " (coming soon)"}</option>)}</select>
          <Button type="submit" size="sm">Filter</Button>
        </form>
      </Card>

      {campaigns.length ? (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr><th className="px-4 py-3">Campaign</th><th className="px-4 py-3">Objective</th><th className="px-4 py-3">Budget</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Progress</th><th className="px-4 py-3">Spend</th><th className="px-4 py-3">Reach</th><th className="px-4 py-3">Impressions</th><th className="px-4 py-3">Clicks</th><th className="px-4 py-3">CTR</th><th className="px-4 py-3">CPC</th><th className="px-4 py-3">CPM</th><th className="px-4 py-3">Conv.</th><th className="px-4 py-3">ROAS</th><th className="px-4 py-3">Created</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {campaigns.map((campaign) => {
                const metrics = campaign.campaignAnalytics[0];
                const completedStages = new Set(campaign.agentRuns.map((run) => run.agentName)).size;
                return (
                  <tr key={campaign.id} className="text-slate-300 transition-colors hover:bg-bg-elevated">
                    <td className="px-4 py-4"><Link className="font-medium text-white hover:text-indigo-200" href={"/" + workspace.slug + "/campaigns/" + campaign.id} prefetch={true}>{campaign.name}</Link><p className="mt-1 text-xs text-slate-500">{campaign.platforms.map(platformLabel).join(" / ")}</p></td>
                    <td className="px-4 py-4">{campaign.goal.replaceAll("_", " ")}</td>
                    <td className="px-4 py-4">{campaign.budget ? "Rs " + campaign.budget.toString() : "-"}</td>
                    <td className="px-4 py-4"><Badge tone={tones[campaign.status] || "slate"}>{campaign.status.replaceAll("_", " ")}</Badge></td>
                    <td className="px-4 py-4">{completedStages}/{marketingOsSteps.length}</td>
                    <td className="px-4 py-4">{metrics ? "Rs " + metrics.spend.toString() : "-"}</td>
                    <td className="px-4 py-4">{metrics?.reach.toLocaleString() || "-"}</td>
                    <td className="px-4 py-4">{metrics?.impressions.toLocaleString() || "-"}</td>
                    <td className="px-4 py-4">{metrics?.clicks.toLocaleString() || "-"}</td>
                    <td className="px-4 py-4">{metrics?.ctr ? (metrics.ctr * 100).toFixed(2) + "%" : "-"}</td>
                    <td className="px-4 py-4">{metrics?.cpc ? "Rs " + metrics.cpc.toString() : "-"}</td>
                    <td className="px-4 py-4">{metrics?.cpm ? "Rs " + metrics.cpm.toString() : "-"}</td>
                    <td className="px-4 py-4">{metrics?.conversions.toLocaleString() || "-"}</td>
                    <td className="px-4 py-4">{metrics?.roas ? metrics.roas.toFixed(2) + "x" : "-"}</td>
                    <td className="px-4 py-4">{campaign.createdAt.toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <Card className="mt-8 p-12 text-center">
          <FolderOpen className="mx-auto size-16 text-slate-700" />
          <h2 className="mt-4 text-lg font-semibold text-slate-400">No campaigns yet</h2>
          <p className="mt-2 text-sm text-slate-600">Create your first campaign to get started.</p>
          <Link className="mt-6 inline-flex" href={"/" + workspace.slug + "/campaigns/new"}><Button><Plus className="size-4" />New Campaign</Button></Link>
        </Card>
      )}
    </section>
  );
}
