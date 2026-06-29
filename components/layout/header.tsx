import Link from "next/link";
import { Bell, Zap } from "lucide-react";

export function Header({ workspaceName, workspaceSlug, userName }: { workspaceName?: string; workspaceSlug?: string; userName?: string | null }) {
  const initials = (userName || "U").slice(0, 1).toUpperCase();
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-bg-base/95 px-4 backdrop-blur sm:px-7">
      <h1 className="font-display text-base font-semibold text-white">{workspaceName || "MarketingOS AI"}</h1>
      <div className="flex items-center gap-3">
        {workspaceSlug ? (
          <Link href={"/" + workspaceSlug + "/campaigns/new"} className="inline-flex h-9 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-500">
            <Zap className="size-4" />
            New Campaign
          </Link>
        ) : null}
        <button className="grid size-9 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-bg-elevated hover:text-white" aria-label="Notifications"><Bell className="size-4" /></button>
        <Link href="/onboarding" className="grid size-8 place-items-center rounded-full bg-accent text-xs font-semibold text-white">{initials}</Link>
      </div>
    </header>
  );
}
