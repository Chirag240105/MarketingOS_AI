"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { CheckCircle2 } from "lucide-react";
import { saveBrandProfile } from "@/actions/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormValues = { companyName: string; website: string; description: string; mission: string; toneOfVoice: string; industry: string; primaryGoal: string; budget: string; location: string; productsServices: string; values: string; competitors: string; hashtags: string };

export function BrandProfileForm({ workspaceId, initial }: { workspaceId: string; initial?: Partial<FormValues> }) {
  const { register, handleSubmit } = useForm<FormValues>({ defaultValues: { companyName: "", website: "", description: "", mission: "", toneOfVoice: "", industry: "", primaryGoal: "", budget: "", location: "", productsServices: "", values: "", competitors: "", hashtags: "", ...initial } });
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const list = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);
  const onSubmit = (values: FormValues) => {
    setSaved(false); setError(null);
    startTransition(async () => {
      try { await saveBrandProfile({ workspaceId, ...values, website: values.website || undefined, budget: values.budget || undefined, productsServices: list(values.productsServices), values: list(values.values), competitors: list(values.competitors), hashtags: list(values.hashtags) }); setSaved(true); }
      catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save your brand profile."); }
    });
  };
  return <form onSubmit={handleSubmit(onSubmit)} className="glass rounded-3xl p-5 sm:p-8"><div className="grid gap-5 md:grid-cols-2"><label className="text-sm text-slate-300">Business name<Input className="mt-2" {...register("companyName", { required: true })} /></label><label className="text-sm text-slate-300">Website<Input className="mt-2" type="url" placeholder="https://..." {...register("website")} /></label><label className="text-sm text-slate-300 md:col-span-2">Description<textarea className="mt-2 min-h-28 w-full rounded-xl border border-white/10 bg-slate-950/50 p-3 text-sm text-slate-100 outline-none focus:border-indigo-400" {...register("description")} /></label><label className="text-sm text-slate-300">Industry<Input className="mt-2" placeholder="SaaS, retail, wellness..." {...register("industry")} /></label><label className="text-sm text-slate-300">Tone of voice<Input className="mt-2" placeholder="Clear, candid, optimistic..." {...register("toneOfVoice")} /></label><label className="text-sm text-slate-300">Primary goal<Input className="mt-2" placeholder="More leads, store visits, sales..." {...register("primaryGoal")} /></label><label className="text-sm text-slate-300">Monthly budget<Input className="mt-2" type="number" min="1" placeholder="25000" {...register("budget")} /></label><label className="text-sm text-slate-300">Location<Input className="mt-2" placeholder="Mumbai, India or online" {...register("location")} /></label><label className="text-sm text-slate-300">Products/services <span className="text-slate-600">(comma separated)</span><Input className="mt-2" {...register("productsServices")} /></label><label className="text-sm text-slate-300 md:col-span-2">Mission<Input className="mt-2" {...register("mission")} /></label><label className="text-sm text-slate-300">Values <span className="text-slate-600">(comma separated)</span><Input className="mt-2" {...register("values")} /></label><label className="text-sm text-slate-300">Competitors <span className="text-slate-600">(comma separated)</span><Input className="mt-2" {...register("competitors")} /></label><label className="text-sm text-slate-300 md:col-span-2">Signature hashtags <span className="text-slate-600">(comma separated)</span><Input className="mt-2" {...register("hashtags")} /></label></div>{error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}<div className="mt-7 flex items-center justify-end gap-3">{saved ? <span className="inline-flex items-center gap-1 text-sm text-emerald-300"><CheckCircle2 className="size-4" />Saved</span> : null}<Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save brand profile"}</Button></div></form>;
}
