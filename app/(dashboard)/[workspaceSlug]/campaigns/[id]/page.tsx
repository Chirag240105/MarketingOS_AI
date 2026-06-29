import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, BarChart3, Brain, CalendarDays, FileText, ImageIcon, Play, Video } from "lucide-react";
import { GenerationProgress } from "@/components/ai/generation-progress";
import { VideoReelGeneration } from "@/components/ai/video-reel-generation";
import { MetaActions } from "@/components/campaign/meta-actions";
import { RunPipelineButton } from "@/components/campaign/run-pipeline-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { requireWorkspaceBySlug } from "@/lib/utils/workspace";

const tones: Record<string, "slate" | "indigo" | "emerald" | "amber" | "rose"> = {
  DRAFT: "slate",
  PLANNING: "indigo",
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
  REVIEW: "amber",
  SCHEDULED: "indigo",
  ACTIVE: "emerald",
  PAUSED: "rose",
  COMPLETED: "emerald",
  ARCHIVED: "slate",
};

export default async function CampaignDetailPage({ params }: { params: Promise<{ workspaceSlug: string; id: string }> }) {
  const { workspaceSlug, id } = await params;
  const { workspace } = await requireWorkspaceBySlug(workspaceSlug);
  const campaign = await prisma.campaign.findFirst({
    where: { id, workspaceId: workspace.id },
    include: {
      generatedPosts: true,
      campaignAssets: true,
      metaCampaign: true,
      aiJobs: { orderBy: { createdAt: "desc" }, take: 6 },
      campaignPlatforms: true,
      agentRuns: { orderBy: { createdAt: "desc" } },
      brandAnalysis: true,
      competitorAnalysis: true,
      campaignStrategy: true,
      campaignCopy: true,
      creativeBrief: true,
      generatedAssets: { orderBy: { createdAt: "desc" } },
      publishingPlan: true,
      campaignAnalytics: { orderBy: { snapshotDate: "desc" }, take: 5 },
      learningInsights: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });

  if (!campaign) return <div className="py-20 text-center text-slate-400">Campaign not found.</div>;

  const imageAsset = campaign.generatedAssets.find((asset) => asset.type === "IMAGE");
  const videoAsset = campaign.generatedAssets.find((asset) => asset.type === "VIDEO");

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={tones[campaign.status] || "slate"}>{campaign.status.replaceAll("_", " ")}</Badge>
            <span className="text-xs text-slate-500">{campaign.goal.replaceAll("_", " ")}</span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">{campaign.name}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{campaign.description || "This campaign is ready for a sharper brief."}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={"/" + workspace.slug + "/campaigns/" + campaign.id + "/run"} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:bg-indigo-500">
            <Play className="size-4" />
            Run workflow
          </Link>
          <Link href={"/" + workspace.slug + "/campaigns/" + campaign.id + "/posts"} className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5">Review posts</Link>
          <Link href={"/" + workspace.slug + "/campaigns/" + campaign.id + "/analytics"} className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5">Analytics</Link>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <RunPipelineButton campaignId={campaign.id} label={campaign.agentRuns.length ? "Resume pipeline" : "Run full pipeline"} />
        <RunPipelineButton campaignId={campaign.id} mode="analytics" />
        <RunPipelineButton campaignId={campaign.id} mode="learning" />
      </div>

      <div className="mt-8"><GenerationProgress campaignId={campaign.id} /></div>
      <div className="mt-5"><VideoReelGeneration campaignId={campaign.id} campaignName={campaign.name} /></div>
      <div className="mt-5"><MetaActions campaignId={campaign.id} hasMetaCampaign={Boolean(campaign.metaCampaign)} metaStatus={campaign.metaCampaign?.status} /></div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
        <PipelineBrief campaign={campaign} />
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-white">Agent activity</h2>
            <span className="text-xs text-slate-500">{campaign.agentRuns.length} MarketingOS runs</span>
          </div>
          <div className="mt-5 space-y-4">
            {campaign.agentRuns.length ? campaign.agentRuns.slice(0, 8).map((run) => (
              <div key={run.id} className="flex gap-3">
                <span className={run.status === "COMPLETED" ? "mt-1.5 size-2 rounded-full bg-emerald-300" : run.status === "FAILED" ? "mt-1.5 size-2 rounded-full bg-rose-300" : "mt-1.5 size-2 rounded-full bg-indigo-300"} />
                <div>
                  <p className="text-sm text-slate-200">{run.agentName}</p>
                  <p className="text-xs text-slate-500">{run.status.toLowerCase()} with {run.modelUsed}</p>
                </div>
              </div>
            )) : <p className="text-sm text-slate-500">Run the workflow to add an auditable agent trail here.</p>}
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <JsonPanel title="Brand analysis" icon={<FileText className="size-4" />} value={campaign.brandAnalysis?.profile} empty="Brand Analysis Agent has not run yet." />
        <JsonPanel title="Competitor analysis" icon={<BarChart3 className="size-4" />} value={campaign.competitorAnalysis ? { summary: campaign.competitorAnalysis.summary, competitors: campaign.competitorAnalysis.competitors, opportunities: campaign.competitorAnalysis.opportunities } : null} empty="Competitor Analysis Agent has not run yet." />
        <JsonPanel title="Strategy" icon={<CalendarDays className="size-4" />} value={campaign.campaignStrategy?.strategy} empty="Campaign Strategy Agent has not run yet." />
        <JsonPanel title="Copy" icon={<FileText className="size-4" />} value={campaign.campaignCopy?.copy} empty="Copywriting Agent has not run yet." />
        <JsonPanel title="Creative brief" icon={<ImageIcon className="size-4" />} value={campaign.creativeBrief?.brief} empty="Creative Generation Agent has not run yet." />
        <JsonPanel title="Publishing plan" icon={<ArrowRight className="size-4" />} value={campaign.publishingPlan?.plan} empty="Publishing Agent has not run yet." />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <AssetPanel title="Generated image" icon={<ImageIcon className="size-4" />} asset={imageAsset} />
        <AssetPanel title="Generated video" icon={<Video className="size-4" />} asset={videoAsset} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <JsonPanel title="Analytics" icon={<BarChart3 className="size-4" />} value={campaign.campaignAnalytics.length ? campaign.campaignAnalytics : null} empty="No analytics snapshots yet. Use Analyze results to create mock-backed insights when providers are not connected." />
        <JsonPanel title="Learning insights" icon={<Brain className="size-4" />} value={campaign.learningInsights.length ? campaign.learningInsights.map((item) => item.output) : null} empty="Learning Agent has not run yet." />
      </div>
    </section>
  );
}

type CampaignBriefForView = {
  budget: { toString(): string } | null;
  campaignPlatforms?: Array<{ platform: string }>;
  platforms: string[];
  startDate: Date | null;
  endDate: Date | null;
  offer: string | null;
  notes: string | null;
};

function PipelineBrief({ campaign }: { campaign: CampaignBriefForView }) {
  const platforms = "campaignPlatforms" in campaign && Array.isArray(campaign.campaignPlatforms) && campaign.campaignPlatforms.length
    ? campaign.campaignPlatforms.map((item) => item.platform)
    : campaign.platforms;

  return (
    <Card className="p-5">
      <h2 className="font-medium text-white">Brief</h2>
      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
        <div><dt className="text-slate-500">Budget</dt><dd className="mt-1 text-slate-200">{campaign.budget ? "Rs " + campaign.budget.toString() : "-"}</dd></div>
        <div><dt className="text-slate-500">Platforms</dt><dd className="mt-1 text-slate-200">{platforms.join(" / ")}</dd></div>
        <div><dt className="text-slate-500">Start</dt><dd className="mt-1 text-slate-200">{campaign.startDate?.toLocaleDateString() || "-"}</dd></div>
        <div><dt className="text-slate-500">End</dt><dd className="mt-1 text-slate-200">{campaign.endDate?.toLocaleDateString() || "-"}</dd></div>
        <div className="sm:col-span-2"><dt className="text-slate-500">Offer</dt><dd className="mt-1 text-slate-200">{campaign.offer || "-"}</dd></div>
        <div className="sm:col-span-2"><dt className="text-slate-500">Notes</dt><dd className="mt-1 text-slate-200">{campaign.notes || "-"}</dd></div>
      </dl>
    </Card>
  );
}

function JsonPanel({ title, icon, value, empty }: { title: string; icon: ReactNode; value: unknown; empty: string }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.025] px-5 py-4">
        <div className="flex min-w-0 items-center gap-2 text-white">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-cyan-300/10 text-cyan-200">{icon}</span>
          <h2 className="truncate font-medium">{title}</h2>
        </div>
        {value ? <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-xs font-medium text-emerald-200">Ready</span> : null}
      </div>
      {value ? (
        <div className="agent-output max-h-[34rem] overflow-auto p-5">
          <AgentOutputValue value={value} depth={0} />
        </div>
      ) : (
        <p className="p-5 text-sm text-slate-500">{empty}</p>
      )}
    </Card>
  );
}

function AgentOutputValue({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === null || value === undefined || value === "") {
    return <span className="agent-output-empty">Not provided</span>;
  }

  if (value instanceof Date) {
    return <span className="agent-output-chip">{value.toLocaleString()}</span>;
  }

  if (Array.isArray(value)) {
    if (!value.length) return <span className="agent-output-empty">No items</span>;

    const isSimpleList = value.every((item) => !Array.isArray(item) && !isPlainRecord(item));
    if (isSimpleList) {
      return (
        <ul className="agent-output-list">
          {value.map((item, index) => (
            <li key={index}>{String(item)}</li>
          ))}
        </ul>
      );
    }

    return (
      <div className={depth === 0 ? "agent-output-stack" : "agent-output-nested-stack"}>
        {value.map((item, index) => (
          <div key={index} className="agent-output-card">
            <AgentOutputValue value={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }

  if (isPlainRecord(value)) {
    const entries = Object.entries(value).filter(([, item]) => item !== null && item !== undefined && item !== "");
    if (!entries.length) return <span className="agent-output-empty">No details</span>;

    const summary = entries.find(([key, item]) => key.toLowerCase() === "summary" && typeof item === "string");
    const rest = entries.filter(([key]) => key.toLowerCase() !== "summary");

    return (
      <div className="agent-output-stack">
        {summary ? <p className="agent-output-summary">{String(summary[1])}</p> : null}
        <div className="agent-output-grid">
          {rest.map(([key, item]) => {
            const complex = Array.isArray(item) || isPlainRecord(item);
            return (
              <section key={key} className={complex ? "agent-output-section agent-output-section-wide" : "agent-output-section"}>
                <h3>{formatOutputLabel(key)}</h3>
                <AgentOutputValue value={item} depth={depth + 1} />
              </section>
            );
          })}
        </div>
      </div>
    );
  }

  if (typeof value === "boolean") {
    return <span className={value ? "agent-output-chip agent-output-chip-good" : "agent-output-chip"}>{value ? "Yes" : "No"}</span>;
  }

  if (typeof value === "number") {
    return <span className="agent-output-chip agent-output-chip-number">{value}</span>;
  }

  if (typeof value === "string" && value.length > 140) {
    return <p className="agent-output-longtext">{value}</p>;
  }

  return <span className="agent-output-chip">{String(value)}</span>;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value) || value instanceof Date) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function formatOutputLabel(label: string) {
  return label
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function AssetPanel({ title, icon, asset }: { title: string; icon: ReactNode; asset?: { status: string; url: string | null; base64Ref: string | null; prompt: string | null; errorMessage: string | null; type: string } }) {
  const source = asset?.url || asset?.base64Ref || "";
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-white">
          <span className="text-indigo-200">{icon}</span>
          <h2 className="font-medium">{title}</h2>
        </div>
        {asset ? <Badge tone={asset.status === "COMPLETED" ? "emerald" : asset.status === "FAILED" ? "rose" : "indigo"}>{asset.status}</Badge> : null}
      </div>
      {asset?.type === "IMAGE" && source ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={source} alt={title} className="mt-4 aspect-video w-full rounded-lg object-cover" />
      ) : null}
      {asset?.type === "VIDEO" && source ? <video src={source} controls className="mt-4 aspect-video w-full rounded-lg bg-black" /> : null}
      {asset?.errorMessage ? <p className="mt-4 text-sm text-rose-300">{asset.errorMessage}</p> : null}
      {asset?.prompt ? <p className="mt-4 line-clamp-4 text-xs leading-5 text-slate-500">{asset.prompt}</p> : null}
      {!asset ? <p className="mt-4 text-sm text-slate-500">No asset has been generated yet.</p> : null}
    </Card>
  );
}
