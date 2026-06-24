import Link from "next/link";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const tones: Record<string, "slate" | "indigo" | "emerald" | "amber" | "rose"> = {
  ACTIVE: "emerald", REVIEW: "amber", GENERATING: "indigo", DRAFT: "slate", PAUSED: "rose", SCHEDULED: "indigo",
};

export function CampaignCard({ campaign, workspaceSlug }: { campaign: { id: string; name: string; status: string; goal: string; platforms: string[]; updatedAt: Date }; workspaceSlug: string }) {
  return (
    <Link href={"/" + workspaceSlug + "/campaigns/" + campaign.id}>
      <Card className="group h-full p-5 transition hover:-translate-y-0.5 hover:border-indigo-300/25">
        <div className="flex items-start justify-between gap-4"><Badge tone={tones[campaign.status] || "slate"}>{campaign.status.replaceAll("_", " ")}</Badge><ArrowUpRight className="size-4 text-slate-500 transition group-hover:text-indigo-200" /></div>
        <h3 className="mt-5 text-lg font-medium text-white">{campaign.name}</h3>
        <p className="mt-2 text-sm text-slate-400">{campaign.goal.replaceAll("_", " ")}</p>
        <div className="mt-5 flex items-center justify-between text-xs text-slate-500"><span>{campaign.platforms.join(" · ")}</span><span className="inline-flex items-center gap-1"><CalendarDays className="size-3" />Updated {campaign.updatedAt.toLocaleDateString()}</span></div>
      </Card>
    </Link>
  );
}
