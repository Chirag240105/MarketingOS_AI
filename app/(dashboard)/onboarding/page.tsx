import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const membership = await prisma.membership.findFirst({ where: { userId: session.user.id }, include: { workspace: { include: { brandProfile: true } } } });
  if (!membership) redirect("/register");
  const workspace = membership.workspace;
  return (
    <section className="mx-auto max-w-3xl py-8">
      <div className="mb-10"><p className="text-sm font-medium text-indigo-200">Welcome, {session.user.name?.split(" ")[0] || "there"}</p><h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">Give your agents a little context.</h1><p className="mt-3 max-w-xl text-slate-400">Strong campaign output starts with a clear brand foundation. You can refine this any time.</p></div>
      <div className="space-y-4">
        {[
          ["1", "Shape your brand context", "Tell us your offer, audience, voice, and visual world.", "/"+workspace.slug+"/brand", Boolean(workspace.brandProfile)],
          ["2", "Create your first campaign", "Set a goal and choose the channels worth your attention.", "/"+workspace.slug+"/campaigns/new", false],
          ["3", "Review and schedule", "Keep a human decision at every meaningful publish point.", "/"+workspace.slug+"/approvals", false],
        ].map(([number, title, description, href, complete]) => (
          <Card key={String(title)} className="flex items-center gap-4 p-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-400/10 text-sm font-semibold text-indigo-200">{number}</span>
            <div className="min-w-0 flex-1"><p className="font-medium text-white">{title}</p><p className="mt-1 text-sm text-slate-400">{description}</p></div>
            {complete ? <CheckCircle2 className="size-5 text-emerald-300" /> : <Link href={href as string}><Button variant="secondary" size="sm">Open <ArrowRight className="size-3.5" /></Button></Link>}
          </Card>
        ))}
      </div>
      <div className="mt-8 flex items-center gap-2 text-sm text-slate-500"><Sparkles className="size-4 text-indigo-300" />Add an AI provider key to generate your first campaign.</div>
    </section>
  );
}
