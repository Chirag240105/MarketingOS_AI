import { Badge } from "@/components/ui/badge";

export function PlatformPreview({ platform, body, caption, hashtags }: { platform: string; body: string; caption?: string | null; hashtags: string[] }) {
  return <div className="rounded-xl border border-white/8 bg-slate-950/45 p-4"><div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-200">{platform}</span><Badge tone="slate">Preview</Badge></div><div className="mt-4 h-28 rounded-lg bg-gradient-to-br from-indigo-400/30 via-slate-800 to-cyan-400/20" /><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-200">{caption || body}</p><p className="mt-2 text-xs text-indigo-200">{hashtags.map((tag) => tag.startsWith("#") ? tag : "#" + tag).join(" ")}</p></div>;
}
