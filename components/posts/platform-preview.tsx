import { Badge } from "@/components/ui/badge";

export function PlatformPreview({
  platform,
  title,
  body,
  caption,
  hashtags,
  cta,
}: {
  platform: string;
  title?: string | null;
  body: string;
  caption?: string | null;
  hashtags: string[];
  cta?: string | null;
}) {
  return <div className="rounded-xl border border-white/8 bg-slate-950/45 p-4"><div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-200">{platform}</span><Badge tone="slate">Text draft</Badge></div>{title ? <p className="mt-4 text-sm font-medium text-white">{title}</p> : null}<p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-200">{caption || body}</p><p className="mt-2 text-xs text-indigo-200">{hashtags.map((tag) => tag.startsWith("#") ? tag : "#" + tag).join(" ")}</p>{cta ? <p className="mt-3 text-xs font-medium text-emerald-200">CTA: {cta}</p> : null}</div>;
}
