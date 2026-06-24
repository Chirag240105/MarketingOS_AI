"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const platforms = ["INSTAGRAM", "LINKEDIN", "X", "FACEBOOK", "TIKTOK", "YOUTUBE", "PINTEREST"] as const;

export function PlatformSelector({ value, onChange }: { value: string[]; onChange: (platforms: string[]) => void }) {
  function toggle(platform: string) {
    onChange(value.includes(platform) ? value.filter((item) => item !== platform) : [...value, platform]);
  }
  return <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{platforms.map((platform) => <button type="button" key={platform} onClick={() => toggle(platform)} className={cn("flex items-center justify-between rounded-xl border px-3 py-3 text-left text-sm transition", value.includes(platform) ? "border-indigo-400/50 bg-indigo-400/10 text-indigo-100" : "border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/5")}><span>{platform.replace("_", " ")}</span>{value.includes(platform) ? <Check className="size-4" /> : null}</button>)}</div>;
}
