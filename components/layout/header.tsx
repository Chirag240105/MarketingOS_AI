import Link from "next/link";
import { Bell, Menu, Search } from "lucide-react";

export function Header({ workspaceName, userName }: { workspaceName?: string; userName?: string | null }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-white/8 px-4 sm:px-7">
      <div className="flex items-center gap-3">
        <Menu className="size-5 text-slate-400 lg:hidden" />
        <div><p className="text-sm font-medium text-slate-100">{workspaceName || "MarketingOS AI"}</p><p className="text-xs text-slate-500">Campaign command center</p></div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-slate-500 md:flex"><Search className="size-3.5" />Search workspace</div>
        <button className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-white/6 hover:text-white" aria-label="Notifications"><Bell className="size-4" /></button>
        <Link href="/onboarding" className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-indigo-400 to-cyan-300 text-xs font-semibold text-slate-950">{(userName || "U").slice(0, 1).toUpperCase()}</Link>
      </div>
    </header>
  );
}
