import Link from "next/link";
import { CreditCard, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireWorkspaceBySlug } from "@/lib/utils/workspace";

export default async function SettingsPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params;
  const { workspace } = await requireWorkspaceBySlug(workspaceSlug, "ADMIN");
  return <section><p className="text-sm font-medium text-indigo-200">Workspace settings</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">{workspace.name}</h1><div className="mt-8 grid gap-4 md:grid-cols-2"><Link href={"/"+workspace.slug+"/settings/team"}><Card className="p-5 transition hover:border-indigo-300/25"><Users className="size-5 text-indigo-200" /><p className="mt-5 font-medium text-white">Team and roles</p><p className="mt-2 text-sm text-slate-400">Invite people and control what they can do.</p></Card></Link><Link href={"/"+workspace.slug+"/settings/billing"}><Card className="p-5 transition hover:border-indigo-300/25"><CreditCard className="size-5 text-cyan-200" /><p className="mt-5 font-medium text-white">Plan and billing</p><p className="mt-2 text-sm text-slate-400">Stripe webhook-ready subscription state.</p></Card></Link></div></section>;
}
