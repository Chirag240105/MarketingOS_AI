import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

const tones = {
  slate: "bg-slate-400/10 text-slate-300 ring-slate-400/20",
  indigo: "bg-indigo-400/10 text-indigo-200 ring-indigo-400/20",
  emerald: "bg-emerald-400/10 text-emerald-200 ring-emerald-400/20",
  amber: "bg-amber-400/10 text-amber-200 ring-amber-400/20",
  rose: "bg-rose-400/10 text-rose-200 ring-rose-400/20",
};

export function Badge({
  className,
  tone = "slate",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", tones[tone], className)}
      {...props}
    />
  );
}
