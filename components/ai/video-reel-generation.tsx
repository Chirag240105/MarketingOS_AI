"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle, Play, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";

type VideoAsset = {
  id: string;
  url: string;
  name: string;
};

type VideoResponse = {
  ok: boolean;
  error?: string;
  data?: {
    status: "PROCESSING" | "COMPLETED" | "FAILED";
    taskId?: string;
    providerStatus?: string;
    progress?: number;
    asset?: VideoAsset | null;
  };
};

const durationOptions = [3, 4, 5, 6, 7, 8];

export function VideoReelGeneration({ campaignId, campaignName }: { campaignId: string; campaignName: string }) {
  const [prompt, setPrompt] = useState("");
  const [productName, setProductName] = useState(campaignName);
  const [duration, setDuration] = useState("5");
  const [state, setState] = useState<"idle" | "running" | "processing" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [asset, setAsset] = useState<VideoAsset | null>(null);

  async function handleResponse(response: Response) {
    const result = await response.json() as VideoResponse;
    if (!result.ok) throw new Error(result.error || "Video generation failed.");
    if (result.data?.asset) {
      setAsset(result.data.asset);
      setTaskId(null);
      setState("done");
      setMessage("Product reel generated and saved to campaign assets.");
      notify.success("Product reel saved");
      return;
    }
    if (result.data?.taskId) {
      setTaskId(result.data.taskId);
      setState("processing");
      const progressValue = typeof result.data.progress === "number" ? result.data.progress : undefined;
      const progress = progressValue === undefined ? "" : ` (${Math.round(progressValue <= 1 ? progressValue * 100 : progressValue)}%)`;
      setMessage(`The video provider is rendering the reel${progress}. This can take a little while.`);
      return;
    }
    setState("processing");
    setMessage(result.data?.providerStatus || "Video generation is still processing.");
  }

  async function generate() {
    setState("running");
    setMessage("Starting the video generation job...");
    setAsset(null);
    try {
      await handleResponse(await fetch("/api/ai/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          prompt,
          productName,
          duration: Number(duration),
          aspectRatio: "9:16",
          name: `${productName || campaignName} reel`,
        }),
      }));
    } catch (cause) {
      setState("error");
      setMessage(cause instanceof Error ? cause.message : "Video generation failed.");
    }
  }

  useEffect(() => {
    if (!taskId || state !== "processing") return;
    const timeout = window.setTimeout(async () => {
      try {
        const query = new URLSearchParams({
          campaignId,
          taskId,
          name: `${productName || campaignName} reel`,
          prompt,
        });
        await handleResponse(await fetch(`/api/ai/video?${query.toString()}`));
      } catch (cause) {
        setState("error");
        setMessage(cause instanceof Error ? cause.message : "Could not check video status.");
      }
    }, 8000);
    return () => window.clearTimeout(timeout);
  }, [campaignId, campaignName, productName, prompt, state, taskId]);

  const isBusy = state === "running" || state === "processing";

  return (
    <div className="rounded-xl border border-cyan-300/15 bg-cyan-400/5 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-cyan-300/10 text-cyan-200">
            {isBusy ? <LoaderCircle className="size-5 animate-spin" /> : state === "done" ? <CheckCircle2 className="size-5 text-emerald-300" /> : <Video className="size-5" />}
          </span>
          <div>
            <p className="font-medium text-white">Create product reel</p>
            <p className="mt-1 text-sm text-slate-400">Generate a vertical product reel and attach it to this campaign.</p>
          </div>
        </div>
        {asset ? <a href={asset.url} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 px-4 text-sm text-slate-100 hover:bg-white/5"><Play className="size-4" /> Open reel</a> : null}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_120px]">
        <label className="text-sm text-slate-300">
          Product name
          <input value={productName} onChange={(event) => setProductName(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 text-sm text-slate-100 outline-none focus:border-cyan-300" />
        </label>
        <label className="text-sm text-slate-300">
          Duration
          <select value={duration} onChange={(event) => setDuration(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 text-sm text-slate-100 outline-none focus:border-cyan-300">
            {durationOptions.map((option) => (
              <option key={option} value={option}>{option} sec</option>
            ))}
          </select>
        </label>
      </div>
      <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={3000} placeholder="Optional extra direction: scene, camera movement, mood, offer, or visual proof points..." className="mt-4 min-h-28 w-full rounded-lg border border-white/10 bg-slate-950/50 p-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-300" />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className={state === "error" ? "text-xs text-rose-300" : "text-xs text-slate-400"}>{message || "Reels are generated in 9:16 format for Instagram and short-form placements."}</p>
        <Button type="button" onClick={generate} disabled={isBusy}>
          {state === "running" ? "Starting..." : state === "processing" ? "Rendering..." : state === "done" ? "Generate another" : "Generate reel"}
        </Button>
      </div>
    </div>
  );
}
