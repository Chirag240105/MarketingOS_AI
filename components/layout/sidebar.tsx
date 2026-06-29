"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarClock, CheckSquare, CreditCard, LayoutDashboard, Megaphone, Palette, Settings, Share2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const sections = [
  { label: "", items: [["Overview", "", LayoutDashboard]] },
  { label: "Campaigns", items: [["Campaigns", "/campaigns", Megaphone], ["Brand Profile", "/brand", Palette]] },
  { label: "Content", items: [["Review Queue", "/approvals", CheckSquare], ["Scheduled", "/calendar", CalendarClock]] },
  { label: "Publish", items: [["Social Accounts", "/social-accounts", Share2], ["Analytics", "/analytics", BarChart3]] },
  { label: "Account", items: [["Settings", "/settings", Settings], ["Billing", "/settings/billing", CreditCard]] },
] as const;

export function Sidebar({
  workspaceSlug,
  workspaceName,
  userName,
  pendingCount = 0,
}: {
  workspaceSlug?: string;
  workspaceName?: string;
  userName?: string | null;
  pendingCount?: number;
}) {
  const pathname = usePathname();
  const prefix = workspaceSlug ? "/" + workspaceSlug : "";
  const initials = (userName || workspaceName || "U").slice(0, 1).toUpperCase();

  const renderItem = ([label, suffix, Icon]: (typeof sections)[number]["items"][number], compact = false) => {
    const href = prefix + suffix;
    const active = suffix === "" ? pathname === prefix : pathname.startsWith(href);
    return (
      <Link
        key={label}
        href={href}
        prefetch={true}
        className={cn(
          "flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-150",
          active ? "border-l-2 border-indigo-500 bg-accent-glow font-medium text-indigo-400" : "text-slate-400 hover:bg-bg-elevated hover:text-white",
          !workspaceSlug && "pointer-events-none opacity-50",
          compact && "h-12 flex-1 flex-col justify-center gap-1 px-1 text-[10px]",
        )}
      >
        <Icon className={compact ? "size-4" : "size-4 shrink-0"} />
        <span className={compact ? "truncate" : "flex-1"}>{label}</span>
        {!compact && label === "Review Queue" && pendingCount > 0 ? <span className="rounded-full bg-indigo-500 px-1.5 py-0.5 text-[10px] text-white">{pendingCount}</span> : null}
      </Link>
    );
  };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-bg-base p-4 md:flex">
        <Link href={prefix || "/"} className="flex items-center gap-2 px-2 py-3 font-display text-lg font-bold text-white">
          <span className="grid size-8 place-items-center rounded-lg bg-accent text-white"><Sparkles className="size-4" /></span>
          MarketingOS
        </Link>
        <nav className="mt-6 flex-1 space-y-1">
          {sections.map((section) => (
            <div key={section.label || "overview"}>
              {section.label ? <p className="mb-1 mt-6 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">{section.label}</p> : null}
              <div className="space-y-1">{section.items.map((item) => renderItem(item))}</div>
            </div>
          ))}
        </nav>
        <div className="rounded-xl border border-border bg-bg-surface p-3">
          <p className="truncate text-sm font-medium text-white">{workspaceName || "Workspace"}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-accent text-xs font-semibold text-white">{initials}</span>
            <span className="truncate text-xs text-slate-500">{userName || "Marketing lead"}</span>
          </div>
        </div>
      </aside>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-bg-base/95 px-2 py-2 backdrop-blur md:hidden">
        {[sections[0].items[0], sections[1].items[0], sections[2].items[0], sections[3].items[1]].map((item) => renderItem(item, true))}
      </nav>
    </>
  );
}
