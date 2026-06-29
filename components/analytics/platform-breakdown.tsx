import { Card } from "@/components/ui/card";

const colors: Record<string, string> = {
  INSTAGRAM: "#E1306C",
  FACEBOOK: "#1877F2",
  LINKEDIN: "#0A66C2",
  X: "#000000",
};

export function PlatformBreakdown({ rows }: { rows: { platform: string; impressions: number; engagement: number }[] }) {
  return <Card className="p-5"><p className="font-medium text-white">Platform pulse</p><div className="mt-5 space-y-4">{rows.map((row) => <div key={row.platform}><div className="flex justify-between text-sm"><span className="text-slate-300">{row.platform}</span><span className="text-slate-500">{row.engagement.toLocaleString()} engagements</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-bg-elevated"><div className="h-full rounded-full" style={{ width: Math.min(100, row.impressions / 100).toString() + "%", backgroundColor: colors[row.platform] || "#6366F1" }} /></div></div>)}</div></Card>;
}
