"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createCampaign } from "@/actions/campaign";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlatformSelector } from "@/components/campaign/platform-selector";

export function CampaignWizard({ workspaceId, workspaceSlug }: { workspaceId: string; workspaceSlug: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [platforms, setPlatforms] = useState<string[]>(["INSTAGRAM", "LINKEDIN"]);
  const [error, setError] = useState<string | null>(null);

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const campaign = await createCampaign({
          workspaceId,
          name: String(formData.get("name") || ""),
          description: String(formData.get("description") || "") || undefined,
          goal: String(formData.get("goal") || "LEAD_GENERATION"),
          budget: String(formData.get("budget") || "") || undefined,
          platforms,
        });
        router.push("/" + workspaceSlug + "/campaigns/" + campaign.id);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not create the campaign.");
      }
    });
  }

  return <form action={submit} className="glass max-w-3xl rounded-3xl p-5 sm:p-8"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-indigo-400/10 text-indigo-200"><Sparkles className="size-5" /></span><div><h2 className="font-medium text-white">Campaign brief</h2><p className="text-sm text-slate-400">Give the agents a clear assignment. They’ll handle the first draft.</p></div></div><div className="mt-8 grid gap-5"><label className="text-sm text-slate-300">Campaign name<Input name="name" className="mt-2" placeholder="Spring launch, always-on growth, founder story..." required /></label><label className="text-sm text-slate-300">What are we trying to make happen?<textarea name="description" className="mt-2 min-h-28 w-full rounded-xl border border-white/10 bg-slate-950/50 p-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-indigo-400" placeholder="Describe the product moment, offer, audience, and proof points." /></label><div className="grid gap-5 sm:grid-cols-2"><label className="text-sm text-slate-300">Primary goal<select name="goal" className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 text-sm text-slate-100 outline-none"><option value="LEAD_GENERATION">Lead generation</option><option value="BRAND_AWARENESS">Brand awareness</option><option value="SALES_CONVERSION">Sales conversion</option><option value="ENGAGEMENT">Engagement</option><option value="TRAFFIC">Traffic</option></select></label><label className="text-sm text-slate-300">Test budget (optional)<Input name="budget" type="number" min="1" className="mt-2" placeholder="2500" /></label></div><div><p className="text-sm text-slate-300">Where should it show up?</p><div className="mt-2"><PlatformSelector value={platforms} onChange={setPlatforms} /></div></div></div>{error ? <p className="mt-5 text-sm text-rose-300">{error}</p> : null}<div className="mt-8 flex justify-end"><Button type="submit" disabled={pending || platforms.length === 0}>{pending ? "Creating campaign..." : "Create campaign"}</Button></div></form>;
}
