import { CalendarDays, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { requireWorkspaceBySlug } from "@/lib/utils/workspace";

export default async function CalendarPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params;
  const { workspace } = await requireWorkspaceBySlug(workspaceSlug);
  const schedules = await prisma.scheduledPost.findMany({ where: { campaign: { workspaceId: workspace.id } }, include: { post: true, campaign: true }, orderBy: { scheduledAt: "asc" }, take: 30 });
  return <section><p className="text-sm font-medium text-indigo-200">Publishing calendar</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">A calendar with a memory.</h1><p className="mt-2 text-sm text-slate-400">Only approved posts can enter this queue. The cron worker owns publish state changes.</p><Card className="mt-8 overflow-hidden"><div className="grid grid-cols-[120px_1fr_120px] border-b border-white/8 px-5 py-3 text-xs font-medium uppercase tracking-[.12em] text-slate-500"><span>When</span><span>Post</span><span>Status</span></div>{schedules.length ? schedules.map((schedule) => <div key={schedule.id} className="grid grid-cols-[120px_1fr_120px] items-center gap-3 border-b border-white/6 px-5 py-4 last:border-0"><div className="text-sm text-slate-300"><CalendarDays className="mr-1 inline size-3.5 text-indigo-300" />{schedule.scheduledAt.toLocaleDateString()}<span className="mt-1 block text-xs text-slate-500"><Clock3 className="mr-1 inline size-3" />{schedule.scheduledAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div><div><p className="text-sm text-white">{schedule.campaign.name}</p><p className="mt-1 truncate text-xs text-slate-500">{schedule.post.caption || schedule.post.body}</p></div><Badge tone={schedule.status === "PUBLISHED" ? "emerald" : schedule.status === "FAILED" ? "rose" : "indigo"}>{schedule.status}</Badge></div>) : <div className="p-12 text-center text-sm text-slate-500">No approved posts are scheduled yet.</div>}</Card></section>;
}
