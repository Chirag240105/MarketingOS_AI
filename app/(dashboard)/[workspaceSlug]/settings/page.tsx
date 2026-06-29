import Link from "next/link";
import { Bot, CheckCircle2, CreditCard, Palette, Users } from "lucide-react";
import { GeneralSettingsForm } from "@/components/settings/general-settings-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { isConfigured } from "@/lib/env";
import { requireWorkspaceBySlug } from "@/lib/utils/workspace";

export default async function SettingsPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params;
  const { workspace } = await requireWorkspaceBySlug(workspaceSlug, "ADMIN");
  const [brandProfile, members, subscription] = await Promise.all([
    prisma.brandProfile.findUnique({ where: { workspaceId: workspace.id }, select: { brandColors: true } }),
    prisma.membership.findMany({ where: { workspaceId: workspace.id }, include: { user: { select: { name: true, email: true } } }, orderBy: { joinedAt: "asc" } }),
    prisma.subscription.findFirst({ where: { workspaceId: workspace.id }, orderBy: { createdAt: "desc" }, select: { plan: true, status: true } }),
  ]);
  const colors = Array.isArray(brandProfile?.brandColors) ? brandProfile.brandColors.filter((item): item is string => typeof item === "string").slice(0, 4) : ["#6366F1", "#10B981"];
  const providers = [
    ["Text AI", isConfigured(process.env.GROQ_API) || isConfigured(process.env.GEMINI_API) || isConfigured(process.env.MISTRAL_KEY)],
    ["Image generation", isConfigured(process.env.RUNWAY_API_KEY) || isConfigured(process.env.RUNWAY_API) || isConfigured(process.env.HF_TOKEN) || isConfigured(process.env.HUGGINGFACE_API_KEY) || isConfigured(process.env.OPENAI_API_KEY) || (isConfigured(process.env.GEMINI_API) && isConfigured(process.env.GEMINI_IMAGE_MODEL))],
    ["Runway recipes", isConfigured(process.env.RUNWAY_API_KEY) || isConfigured(process.env.RUNWAY_API)],
    ["Meta publishing", isConfigured(process.env.META_AD_ACCOUNT_ID) && isConfigured(process.env.META_PAGE_ID)],
  ] as const;

  return (
    <section>
      <p className="text-sm font-medium text-indigo-200">Workspace settings</p>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-white">{workspace.name}</h1>
      <p className="mt-2 text-sm text-slate-400">Tune the operating details investors, admins, and growth teams expect to see.</p>

      <div className="mt-8 flex flex-wrap gap-2">
        {["General", "AI status", "Team", "Billing"].map((tab, index) => (
          <span key={tab} className={index === 0 ? "rounded-lg bg-accent px-3 py-2 text-sm text-white" : "rounded-lg border border-border px-3 py-2 text-sm text-slate-400"}>{tab}</span>
        ))}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2"><Palette className="size-5 text-indigo-300" /><h2 className="font-medium text-white">General</h2></div>
          <GeneralSettingsForm workspaceId={workspace.id} name={workspace.name} colors={colors} />
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2"><Bot className="size-5 text-indigo-300" /><h2 className="font-medium text-white">AI provider status</h2></div>
          <div className="mt-5 grid gap-3">
            {providers.map(([label, configured]) => (
              <div key={label} className="rounded-xl border border-border bg-bg-base p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-400">{label}</p>
                  <span className={configured ? "rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300" : "rounded-full bg-amber-500/10 px-2 py-1 text-xs text-amber-300"}>
                    {configured ? "Configured" : "Not configured"}
                  </span>
                </div>
              </div>
            ))}
            <p className="text-xs leading-5 text-slate-500">Provider keys are deployment-level secrets and are never rendered in workspace settings.</p>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2"><Users className="size-5 text-indigo-300" /><h2 className="font-medium text-white">Team</h2></div>
          <div className="mt-5 space-y-3">
            {members.slice(0, 4).map((member) => (
              <div key={member.id} className="flex items-center justify-between rounded-xl border border-border bg-bg-base p-3">
                <div><p className="text-sm font-medium text-white">{member.user.name || member.user.email}</p><p className="text-xs text-slate-500">{member.user.email}</p></div>
                <span className="rounded-full bg-accent-glow px-2 py-1 text-xs text-indigo-300">{member.role}</span>
              </div>
            ))}
          </div>
          <Link className="mt-4 inline-flex" href={"/" + workspace.slug + "/settings/team"}><Button variant="secondary">Manage team</Button></Link>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2"><CreditCard className="size-5 text-indigo-300" /><h2 className="font-medium text-white">Billing</h2></div>
          <div className="mt-5 rounded-xl border border-border bg-bg-base p-4"><div className="flex items-center justify-between"><div><p className="font-medium text-white">Current plan</p><p className="mt-1 text-sm text-slate-500">{subscription?.status || "No active subscription"}</p></div><span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">{subscription?.plan || workspace.plan}</span></div></div>
          <div className="mt-4 rounded-xl border border-indigo-500/30 bg-accent-glow p-4"><CheckCircle2 className="size-5 text-indigo-300" /><p className="mt-3 font-medium text-white">Upgrade to Pro</p><p className="mt-1 text-sm text-slate-400">Unlock higher campaign volume, richer analytics, and more team seats.</p><Link className="mt-4 inline-flex" href={"/" + workspace.slug + "/settings/billing"}><Button>View billing</Button></Link></div>
        </Card>
      </div>
    </section>
  );
}
