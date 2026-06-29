"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Sparkles } from "lucide-react";
import { createCampaign } from "@/actions/campaign";
import { PlatformSelector } from "@/components/campaign/platform-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { notify } from "@/lib/toast";

export function CampaignWizard({ workspaceId, workspaceSlug }: { workspaceId: string; workspaceSlug: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [platforms, setPlatforms] = useState<string[]>(["INSTAGRAM", "FACEBOOK"]);
  const [error, setError] = useState<string | null>(null);

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const campaign = await notify.promise(createCampaign({
          workspaceId,
          name: String(formData.get("name") || ""),
          description: String(formData.get("description") || "") || undefined,
          goal: String(formData.get("goal") || "LEAD_GENERATION"),
          status: String(formData.get("status") || "DRAFT"),
          budget: String(formData.get("budget") || "") || undefined,
          startDate: String(formData.get("startDate") || "") || undefined,
          endDate: String(formData.get("endDate") || "") || undefined,
          platforms,
          targetAudience: { summary: String(formData.get("targetAudience") || "") },
          offer: String(formData.get("offer") || "") || undefined,
          notes: String(formData.get("notes") || "") || undefined,
          generateVideo: formData.get("generateVideo") === "on",
        }), {
          loading: "Saving campaign...",
          success: "Campaign saved",
          error: "Campaign couldn't be saved — check required fields",
        });
        router.push("/" + workspaceSlug + "/campaigns/" + campaign.id);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not create the campaign.");
      }
    });
  }

  const steps = ["Goal", "Audience", "Content", "Platforms", "Review"];

  return (
    <form action={submit} className="mx-auto max-w-2xl rounded-2xl border border-border bg-bg-surface p-5 sm:p-8">
      <div className="mb-8 grid grid-cols-5 gap-2">
        {steps.map((step, index) => <div key={step} className="text-center"><span className={index === 0 ? "mx-auto grid size-8 place-items-center rounded-full bg-indigo-600 text-sm text-white ring-4 ring-indigo-500/30" : "mx-auto grid size-8 place-items-center rounded-full bg-slate-700 text-sm text-slate-300"}>{index + 1}</span><p className="mt-2 text-[11px] text-slate-500">{step}</p></div>)}
      </div>
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-indigo-400/10 text-indigo-200"><Sparkles className="size-5" /></span>
        <div>
          <h2 className="font-medium text-white">Campaign brief</h2>
          <p className="text-sm text-slate-400">Give the copywriting agent a clear advertising assignment.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-5">
        <label className="text-sm text-slate-300">Campaign name<Input name="name" className="mt-2" placeholder="Spring launch, always-on growth, founder story..." required /></label>
        <label className="text-sm text-slate-300">Objective and context<textarea name="description" className="mt-2 min-h-28 w-full rounded-xl border border-white/10 bg-slate-950/50 p-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-indigo-400" placeholder="Describe the product moment, proof points, customer pain, and desired action." /></label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm text-slate-300">Objective<select name="goal" className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 text-sm text-slate-100 outline-none"><option value="LEAD_GENERATION">Lead generation</option><option value="BRAND_AWARENESS">Brand awareness</option><option value="SALES_CONVERSION">Sales conversion</option><option value="ENGAGEMENT">Engagement</option><option value="TRAFFIC">Traffic</option></select></label>
          <label className="text-sm text-slate-300">Status<select name="status" className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 text-sm text-slate-100 outline-none"><option value="DRAFT">Draft</option><option value="ACTIVE">Active</option><option value="COMPLETED">Completed</option></select></label>
          <label className="text-sm text-slate-300">Budget<Input name="budget" type="number" min="1" className="mt-2" placeholder="2500" /></label>
          <label className="text-sm text-slate-300">Offer<Input name="offer" className="mt-2" placeholder="20% off, free audit, trial..." /></label>
          <label className="text-sm text-slate-300">Start date<Input name="startDate" type="date" className="mt-2" /></label>
          <label className="text-sm text-slate-300">End date<Input name="endDate" type="date" className="mt-2" /></label>
        </div>

        <label className="text-sm text-slate-300">Target audience<textarea name="targetAudience" className="mt-2 min-h-20 w-full rounded-xl border border-white/10 bg-slate-950/50 p-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-indigo-400" placeholder="Who should see this campaign?" /></label>
        <label className="text-sm text-slate-300">Notes<textarea name="notes" className="mt-2 min-h-20 w-full rounded-xl border border-white/10 bg-slate-950/50 p-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-indigo-400" placeholder="Constraints, claims to avoid, local context, competitors, landing page..." /></label>
        <label className="flex items-center gap-3 rounded-lg border border-border bg-bg-base p-3 text-sm text-slate-300">
          <input name="generateVideo" type="checkbox" className="size-4 rounded border-border bg-bg-surface" />
          Generate an AI video storyboard and media asset for this campaign
        </label>

        <div>
          <p className="text-sm text-slate-300">Platforms</p>
          <div className="mt-2"><PlatformSelector value={platforms} onChange={setPlatforms} /></div>
        </div>
      </div>

      {error ? <p className="mt-5 text-sm text-rose-300">{error}</p> : null}
      <div className="mt-8 flex justify-end"><Button type="submit" className="h-12 w-full" disabled={pending || platforms.length === 0}>{pending ? <><LoaderCircle className="size-4 animate-spin" />Generating your campaign...</> : "Generate Campaign"}</Button></div>
    </form>
  );
}
