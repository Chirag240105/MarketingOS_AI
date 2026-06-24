import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[.9fr_1.1fr]">
      <section className="hidden border-r border-white/8 bg-slate-950/35 p-10 lg:flex lg:flex-col">
        <Link href="/" className="flex items-center gap-2 font-semibold text-white"><span className="grid size-9 place-items-center rounded-xl bg-indigo-400 text-slate-950"><Sparkles className="size-5" /></span>MarketingOS AI</Link>
        <div className="my-auto max-w-md">
          <p className="text-sm font-medium text-indigo-200">Your marketing command center</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">A small team can now move like an agency.</h1>
          <p className="mt-5 leading-7 text-slate-400">Create a workspace, set your brand context, and let your agents do the first hard draft.</p>
        </div>
        <p className="text-xs text-slate-600">Built for focused teams and real approval workflows.</p>
      </section>
      <section className="flex items-center justify-center p-6 sm:p-10">{children}</section>
    </main>
  );
}
