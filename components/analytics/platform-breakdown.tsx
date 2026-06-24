import { Card } from "@/components/ui/card";

export function PlatformBreakdown({ rows }: { rows: { platform: string; impressions: number; engagement: number }[] }) {
  return <Card className="p-5"><p className="font-medium text-white">Platform pulse</p><div className="mt-5 space-y-4">{rows.map((row) => <div key={row.platform}><div className="flex justify-between text-sm"><span className="text-slate-300">{row.platform}</span><span className="text-slate-500">{row.engagement.toLocaleString()} engagements</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-cyan-300" style={{ width: Math.min(100, row.impressions / 100).toString() + "%" }} /></div></div>)}</div></Card>;
}
