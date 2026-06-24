"use client";

import { useState } from "react";
import { CheckCircle2, LoaderCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GenerationProgress({ campaignId, onComplete }: { campaignId: string; onComplete?: () => void }) {
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  async function generate() {
    setState("running");
    setMessage("Your agent team is mapping the brief...");
    const response = await fetch("/api/ai/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ campaignId }) });
    const result = await response.json() as { ok: boolean; error?: string; data?: { postCount?: number; mocked?: boolean } };
    if (!result.ok) { setState("error"); setMessage(result.error || "Generation failed."); return; }
    setState("done");
    setMessage(String(result.data?.postCount || 0) + " posts are ready for review" + (result.data?.mocked ? " (mock agent mode)." : "."));
    onComplete?.();
  }
  return <div className="rounded-2xl border border-indigo-300/15 bg-indigo-400/5 p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><span className="grid size-10 place-items-center rounded-xl bg-indigo-400/15 text-indigo-200">{state === "running" ? <LoaderCircle className="size-5 animate-spin" /> : state === "done" ? <CheckCircle2 className="size-5 text-emerald-300" /> : <Sparkles className="size-5" />}</span><div><p className="font-medium text-white">{state === "done" ? "Generation complete" : "Ask your agent team for the first draft"}</p><p className="mt-1 text-sm text-slate-400">{message || "Strategy, copy, visual direction, video, and safety review happen as one tracked job."}</p></div></div><Button onClick={generate} disabled={state === "running"}>{state === "running" ? "Generating..." : state === "done" ? "Generate again" : "Generate campaign"}</Button></div></div>;
}
