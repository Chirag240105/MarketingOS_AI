"use client";

import { useState } from "react";
import { ImageIcon, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CreativeGeneration({ campaignId }: { campaignId: string }) {
  const [prompt, setPrompt] = useState("");
  const [state, setState] = useState<"idle" | "running" | "error" | "done">("idle");
  const [message, setMessage] = useState("");
  async function generate() {
    if (!prompt.trim()) return;
    setState("running");
    const response = await fetch("/api/ai/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ campaignId, prompt, name: "Campaign creative" }) });
    const result = await response.json() as { ok: boolean; error?: string };
    if (!result.ok) { setState("error"); setMessage(result.error || "Image generation failed."); return; }
    setState("done");
    setMessage("Creative generated and saved to the campaign assets.");
    setPrompt("");
  }
  return <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/5 p-5"><div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200"><ImageIcon className="size-5" /></span><div><p className="font-medium text-white">Generate a campaign creative</p><p className="mt-1 text-sm text-slate-400">The final image is stored in S3 and attached to this campaign.</p></div></div><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={4000} placeholder="Describe the visual, product name, composition, audience, and specific on-image text you want..." className="mt-4 min-h-24 w-full rounded-xl border border-white/10 bg-slate-950/50 p-3 text-sm text-slate-100 outline-none focus:border-cyan-300" /><div className="mt-3 flex items-center justify-between gap-3"><p className={state === "error" ? "text-xs text-rose-300" : "text-xs text-slate-400"}>{message}</p><Button type="button" onClick={generate} disabled={state === "running" || !prompt.trim()}>{state === "running" ? <><LoaderCircle className="size-4 animate-spin" /> Generating</> : "Generate creative"}</Button></div></div>;
}
