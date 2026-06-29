"use client";

import { Check } from "lucide-react";
import { PLATFORM_LIST } from "@/config/platforms";
import { cn } from "@/lib/utils/cn";

export function PlatformSelector({ value, onChange }: { value: string[]; onChange: (platforms: string[]) => void }) {
  function toggle(platform: string) {
    onChange(value.includes(platform) ? value.filter((item) => item !== platform) : [...value, platform]);
  }
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {PLATFORM_LIST.map((platform) => {
        const Icon = platform.icon;
        const selected = value.includes(platform.id);
        return (
          <button
            type="button"
            key={platform.id}
            onClick={() => platform.selectable && toggle(platform.id)}
            disabled={!platform.selectable}
            className={cn(
              "flex min-h-12 items-center justify-between rounded-lg border px-3 py-3 text-left text-sm transition-colors",
              selected ? "border-indigo-500 bg-indigo-600 text-white" : "border-border bg-bg-surface text-slate-400 hover:border-slate-500",
              !platform.selectable && "cursor-not-allowed opacity-50 hover:border-border",
            )}
          >
            <span className="flex items-center gap-2">
              <Icon className="size-4" />
              <span>
                {platform.label}
                {!platform.selectable ? <span className="block text-[10px] text-slate-500">Coming soon</span> : null}
              </span>
            </span>
            {selected ? <Check className="size-4" /> : null}
          </button>
        );
      })}
    </div>
  );
}
