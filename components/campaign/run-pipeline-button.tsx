"use client";

import { useState, useTransition } from "react";
import { BarChart3, Brain, LoaderCircle, Play } from "lucide-react";
import { runMarketingOsAnalytics, runMarketingOsLearning, runMarketingOsPipeline } from "@/actions/marketing-os";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";

type RunPipelineButtonProps = {
  campaignId: string;
  mode?: "pipeline" | "analytics" | "learning";
  label?: string;
};

const copy = {
  pipeline: {
    icon: Play,
    label: "Run full pipeline",
    loading: "Running MarketingOS agents...",
    success: "Pipeline completed",
    error: "Pipeline failed",
  },
  analytics: {
    icon: BarChart3,
    label: "Analyze results",
    loading: "Analyzing campaign results...",
    success: "Analytics updated",
    error: "Analytics failed",
  },
  learning: {
    icon: Brain,
    label: "Update learning",
    loading: "Updating learning insights...",
    success: "Learning updated",
    error: "Learning failed",
  },
};

export function RunPipelineButton({ campaignId, mode = "pipeline", label }: RunPipelineButtonProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const state = copy[mode];
  const Icon = state.icon;

  function run() {
    setError(null);
    startTransition(async () => {
      try {
        const action = mode === "analytics" ? runMarketingOsAnalytics : mode === "learning" ? runMarketingOsLearning : runMarketingOsPipeline;
        await notify.promise(action(campaignId) as Promise<unknown>, {
          loading: state.loading,
          success: state.success,
          error: state.error,
        });
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not run this workflow.");
      }
    });
  }

  return (
    <div>
      <Button onClick={run} disabled={pending} className="w-full sm:w-auto">
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Icon className="size-4" />}
        {label || state.label}
      </Button>
      {error ? <p className="mt-2 max-w-md text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
