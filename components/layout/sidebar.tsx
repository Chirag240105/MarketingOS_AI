import Link from "next/link";
import { BarChart3, CalendarDays, CheckSquare, Compass, FolderKanban, Plus, Settings, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const links = [
  ["Overview", "", Compass],
  ["Campaigns", "/campaigns", FolderKanban],
  ["Calendar", "/calendar", CalendarDays],
  ["Approvals", "/approvals", CheckSquare],
  ["Analytics", "/analytics", BarChart3],
  ["Brand", "/brand", Sparkles],
  ["Social accounts", "/social-accounts", Users],
  ["Settings", "/settings", Settings],
] as const;

export function Sidebar({ workspaceSlug }: { workspaceSlug?: string }) {
  const prefix = workspaceSlug ? "/" + workspaceSlug : "";
  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/8 bg-slate-950/30 p-4 lg:flex lg:flex-col">
      <Link href="/" className="flex items-center gap-2 px-2 py-3 text-sm font-semibold text-white"><span className="grid size-8 place-items-center rounded-lg bg-indigo-400 text-slate-950"><Sparkles className="size-4" /></span>MarketingOS AI</Link>
      <nav className="mt-7 space-y-1">
        {links.map(([label, suffix, Icon]) => (
          <Link key={label} href={prefix + suffix} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition hover:bg-white/6 hover:text-white", !workspaceSlug && "pointer-events-none opacity-50")}>
            <Icon className="size-4" />{label}
          </Link>
        ))}
      </nav>
      {workspaceSlug ? <Link href={"/" + workspaceSlug + "/campaigns/new"} className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-3 py-2.5 text-sm font-medium text-white hover:bg-indigo-400"><Plus className="size-4" />New campaign</Link> : null}
      <div className="mt-auto rounded-2xl border border-white/8 bg-white/[0.03] p-3">
        <p className="text-xs font-medium text-slate-200">Aurora-ready architecture</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">Local Docker now. Amazon Aurora PostgreSQL when you ship.</p>
      </div>
    </aside>
  );
}
