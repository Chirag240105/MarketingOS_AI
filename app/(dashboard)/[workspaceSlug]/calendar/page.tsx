import Link from "next/link";
import { CalendarDays, Clock3, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { requireWorkspaceBySlug } from "@/lib/utils/workspace";

export default async function CalendarPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params;
  const { workspace } = await requireWorkspaceBySlug(workspaceSlug);
  const schedules = await prisma.scheduledPost.findMany({
    where: { campaign: { workspaceId: workspace.id } },
    select: {
      id: true,
      scheduledAt: true,
      status: true,
      post: { select: { caption: true, body: true } },
      campaign: { select: { name: true } },
    },
    orderBy: { scheduledAt: "asc" },
    take: 30,
  });
  return <section><p className="text-sm font-medium text-indigo-200">Publishing calendar</p><h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-white">A calendar with a memory.</h1><p className="mt-2 text-sm text-slate-400">Only approved posts can enter this queue. The cron worker owns publish state changes.</p><Card className="mt-8 overflow-hidden">{schedules.length ? <><div className="grid grid-cols-[120px_1fr_120px] border-b border-border px-5 py-3 text-xs font-medium uppercase tracking-[.12em] text-slate-500"><span>When</span><span>Post</span><span>Status</span></div>{schedules.map((schedule) => <div key={schedule.id} className="grid grid-cols-[120px_1fr_120px] items-center gap-3 border-b border-border px-5 py-4 last:border-0"><div className="text-sm text-slate-300"><CalendarDays className="mr-1 inline size-3.5 text-indigo-300" />{schedule.scheduledAt.toLocaleDateString()}<span className="mt-1 block text-xs text-slate-500"><Clock3 className="mr-1 inline size-3" />{schedule.scheduledAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div><div><p className="text-sm text-white">{schedule.campaign.name}</p><p className="mt-1 truncate text-xs text-slate-500">{schedule.post.caption || schedule.post.body}</p></div><Badge tone={schedule.status === "PUBLISHED" ? "emerald" : schedule.status === "FAILED" ? "rose" : "indigo"}>{schedule.status}</Badge></div>)}</> : <div className="p-12 text-center"><CalendarDays className="mx-auto size-16 text-slate-700" /><h2 className="mt-4 text-lg font-semibold text-slate-400">Nothing scheduled</h2><p className="mt-2 text-sm text-slate-600">Approve posts and add publish times to fill your calendar.</p><Link className="mt-6 inline-flex" href={"/"+workspace.slug+"/campaigns/new"}><Button><Plus className="size-4" />New Campaign</Button></Link></div>}</Card></section>;
}
