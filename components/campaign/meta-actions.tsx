"use client";

import { useState, useTransition } from "react";
import { Play, Power, RotateCw, Send, Trash2 } from "lucide-react";
import { createMetaCampaignBundle, deleteMetaCampaign, launchMetaCampaign, pauseMetaCampaign, resumeMetaCampaign } from "@/actions/meta-campaign";
import { Button } from "@/components/ui/button";

export function MetaActions({ campaignId, hasMetaCampaign, metaStatus }: { campaignId: string; hasMetaCampaign: boolean; metaStatus?: string | null }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function run(action: () => Promise<unknown>, success: string) {
    setMessage(null);
    startTransition(async () => {
      try {
        await action();
        setMessage(success);
      } catch (cause) {
        setMessage(cause instanceof Error ? cause.message : "Meta action failed.");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => createMetaCampaignBundle(campaignId), "Meta campaign draft created.")}><Send className="size-3.5" />Create Meta draft</Button>
        <Button size="sm" disabled={pending || !hasMetaCampaign} onClick={() => run(() => launchMetaCampaign(campaignId), "Campaign launched on Meta.")}><Play className="size-3.5" />Launch</Button>
        <Button size="sm" variant="secondary" disabled={pending || !hasMetaCampaign || metaStatus === "PAUSED"} onClick={() => run(() => pauseMetaCampaign(campaignId), "Campaign paused.")}><Power className="size-3.5" />Pause</Button>
        <Button size="sm" variant="secondary" disabled={pending || !hasMetaCampaign || metaStatus === "ACTIVE"} onClick={() => run(() => resumeMetaCampaign(campaignId), "Campaign resumed.")}><RotateCw className="size-3.5" />Resume</Button>
        <Button size="sm" variant="danger" disabled={pending || !hasMetaCampaign} onClick={() => run(() => deleteMetaCampaign(campaignId), "Campaign deleted in Meta.")}><Trash2 className="size-3.5" />Delete</Button>
      </div>
      {message ? <p className={message.includes("failed") || message.includes("missing") || message.includes("Connect") ? "mt-3 text-xs text-rose-300" : "mt-3 text-xs text-emerald-300"}>{message}</p> : null}
    </div>
  );
}
