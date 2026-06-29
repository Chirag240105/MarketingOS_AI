import Link from "next/link";
import { ArrowLeft, CheckCircle2, CircleDashed, XCircle } from "lucide-react";
import { RunPipelineButton } from "@/components/campaign/run-pipeline-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { requireWorkspaceBySlug } from "@/lib/utils/workspace";

const statusTone: Record<string, "slate" | "indigo" | "emerald" | "amber" | "rose"> = {
  COMPLETED: "emerald",
  RUNNING: "indigo",
  RETRYING: "amber",
  FAILED: "rose",
  PENDING: "slate",
  SKIPPED: "slate",
};

const pipelineSteps = [
  "Brand Analysis Agent",
  "Competitor Analysis Agent",
  "Campaign Strategy Agent",
  "Copywriting Agent",
  "Creative Generation Agent",
  "Publishing Agent",
  "Analytics Agent",
  "Learning Agent",
];

export default async function RunCampaignPage({ params }: { params: Promise<{ workspaceSlug: string; id: string }> }) {
  const { workspaceSlug, id } = await params;
  const { workspace } = await requireWorkspaceBySlug(workspaceSlug, "EDITOR");
  const campaign = await prisma.campaign.findFirst({
    where: { id, workspaceId: workspace.id },
    include: {
      agentRuns: { orderBy: { createdAt: "desc" } },
      generatedAssets: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!campaign) return <div className="py-20 text-center text-slate-400">Campaign not found.</div>;

  return (
    <section>
      <Link href={"/" + workspace.slug + "/campaigns/" + campaign.id} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="size-4" />
        Back to pipeline
      </Link>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-200">MarketingOS run console</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">{campaign.name}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">Run or resume the multi-agent workflow. Completed stages are reused automatically.</p>
        </div>
        <Badge tone={campaign.status === "FAILED" ? "rose" : campaign.status === "READY_TO_PUBLISH" ? "emerald" : "indigo"}>
          {campaign.status.replaceAll("_", " ")}
        </Badge>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <RunPipelineButton campaignId={campaign.id} />
        <RunPipelineButton campaignId={campaign.id} mode="analytics" />
        <RunPipelineButton campaignId={campaign.id} mode="learning" />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <Card className="p-5">
          <h2 className="font-medium text-white">Workflow stages</h2>
          <div className="mt-5 space-y-4">
            {pipelineSteps.map((step) => {
              const latest = campaign.agentRuns.find((run) => run.agentName === step);
              const Icon = latest?.status === "COMPLETED" ? CheckCircle2 : latest?.status === "FAILED" ? XCircle : CircleDashed;
              return (
                <div key={step} className="flex items-start gap-3">
                  <Icon className={latest?.status === "COMPLETED" ? "mt-0.5 size-4 text-emerald-300" : latest?.status === "FAILED" ? "mt-0.5 size-4 text-rose-300" : "mt-0.5 size-4 text-slate-500"} />
                  <div>
                    <p className="text-sm text-slate-200">{step}</p>
                    <p className="mt-1 text-xs text-slate-500">{latest ? `${latest.status.toLowerCase()} with ${latest.modelUsed}` : "Waiting to run"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-white">Agent run log</h2>
            <span className="text-xs text-slate-500">{campaign.agentRuns.length} records</span>
          </div>
          <div className="mt-5 space-y-3">
            {campaign.agentRuns.length ? campaign.agentRuns.map((run) => (
              <div key={run.id} className="rounded-lg border border-border bg-bg-base p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{run.agentName}</p>
                    <p className="mt-1 text-xs text-slate-500">{run.modelUsed}</p>
                  </div>
                  <Badge tone={statusTone[run.status] || "slate"}>{run.status}</Badge>
                </div>
                {run.errorMessage ? <p className="mt-3 text-xs text-rose-300">{run.errorMessage}</p> : null}
              </div>
            )) : <p className="text-sm text-slate-500">No agent runs yet.</p>}
          </div>
        </Card>
      </div>
    </section>
  );
}
