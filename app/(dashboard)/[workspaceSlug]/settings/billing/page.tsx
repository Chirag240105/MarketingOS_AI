import { CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { requireWorkspaceBySlug } from "@/lib/utils/workspace";

export default async function BillingPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params;
  const { workspace } = await requireWorkspaceBySlug(workspaceSlug, "ADMIN");
  const subscription = await prisma.subscription.findFirst({ where: { workspaceId: workspace.id }, orderBy: { updatedAt: "desc" } });
  return <section><p className="text-sm font-medium text-indigo-200">Billing</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">A plan that can grow with you.</h1><Card className="mt-8 max-w-xl p-6"><CreditCard className="size-6 text-indigo-200" /><div className="mt-5 flex items-center justify-between"><div><p className="font-medium text-white">{subscription?.plan || workspace.plan} plan</p><p className="mt-1 text-sm text-slate-400">Subscription state is synced by a verified Stripe webhook.</p></div><Badge tone={subscription?.status === "ACTIVE" ? "emerald" : "slate"}>{subscription?.status || "NOT CONFIGURED"}</Badge></div><p className="mt-6 rounded-xl border border-white/8 bg-white/[0.02] p-3 text-xs leading-5 text-slate-500">Configure STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to enable live subscription updates. Billing is intentionally not client-trusted.</p></Card></section>;
}
