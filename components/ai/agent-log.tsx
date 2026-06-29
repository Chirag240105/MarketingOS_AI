import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type AgentLogItem = {
  id?: string;
  agentName?: string;
  agentType?: string;
  modelUsed?: string | null;
  status: string;
  errorMessage?: string | null;
  error?: string | null;
  createdAt?: Date | string;
  completedAt?: Date | string | null;
};

const tones: Record<string, "slate" | "indigo" | "emerald" | "amber" | "rose"> = {
  COMPLETED: "emerald",
  RUNNING: "indigo",
  RETRYING: "amber",
  FAILED: "rose",
  PENDING: "slate",
};

export function AgentLog({ runs }: { runs: AgentLogItem[] }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-medium text-white">Agent log</h2>
        <span className="text-xs text-slate-500">{runs.length} records</span>
      </div>
      <div className="mt-5 space-y-3">
        {runs.length ? runs.map((run, index) => (
          <div key={run.id || `${run.agentName || run.agentType}-${index}`} className="rounded-lg border border-border bg-bg-base p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">{run.agentName || run.agentType?.replaceAll("_", " ") || "Agent"}</p>
                {run.modelUsed ? <p className="mt-1 text-xs text-slate-500">{run.modelUsed}</p> : null}
              </div>
              <Badge tone={tones[run.status] || "slate"}>{run.status.replaceAll("_", " ")}</Badge>
            </div>
            {run.errorMessage || run.error ? <p className="mt-3 text-xs text-rose-300">{run.errorMessage || run.error}</p> : null}
          </div>
        )) : <p className="text-sm text-slate-500">Agent activity will appear here after generation starts.</p>}
      </div>
    </Card>
  );
}
