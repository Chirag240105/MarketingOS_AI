"use client";

import { useState } from "react";
import { CheckCircle2, LoaderCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";

export function GenerationProgress({ campaignId, onComplete }: { campaignId: string; onComplete?: () => void }) {
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function generate() {
    setState("running");
    setMessage("The marketing agents are building strategy, copy, safety checks, and creative assets...");
    try {
      const result = await notify.promise(
        fetch("/api/campaign/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ campaignId }) })
          .then(async (response) => {
            const json = await response.json() as { ok: boolean; error?: string; warning?: string; data?: { postCount?: number; status?: "generated" | "fallback"; warning?: string } };
            if (!json.ok) throw new Error(json.error || "Generation failed.");
            return json;
          }),
        {
          loading: "Generating campaign...",
          success: "Campaign generated",
          error: "AI generation failed. Review provider configuration and try again.",
        },
      );
      setState("done");
      setMessage(result.warning || result.data?.warning || String(result.data?.postCount || 0) + " posts are ready for review.");
      onComplete?.();
    } catch (cause) {
      setState("error");
      setMessage(cause instanceof Error && cause.message.includes("429") ? "AI provider is busy; try again shortly." : "AI generation failed. Review provider configuration and try again.");
    }
  }

  return (
    <div className="rounded-2xl border border-indigo-300/15 bg-indigo-400/5 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-indigo-400/15 text-indigo-200">
            {state === "running" ? <LoaderCircle className="size-5 animate-spin" /> : state === "done" ? <CheckCircle2 className="size-5 text-emerald-300" /> : <Sparkles className="size-5" />}
          </span>
          <div>
            <p className="font-medium text-white">{state === "done" ? "Generation complete" : "Generate AI campaign"}</p>
            <p className="mt-1 text-sm text-slate-400">{message || "Runs brand, competitor, strategy, copy, safety, and creative agents for this campaign."}</p>
          </div>
        </div>
        <Button onClick={generate} disabled={state === "running"}>{state === "running" ? "Generating..." : state === "done" ? "Generate again" : "Generate campaign"}</Button>
      </div>
    </div>
  );
}
