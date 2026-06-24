import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

const proof = ["Strategy to scheduled content in one workspace", "Agentic generation with approval controls", "Built for your Docker-to-Aurora journey"];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden px-6 py-6 sm:px-10">
      <nav className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-white">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-400 to-cyan-400 text-slate-950"><Sparkles className="size-5" /></span>
          MarketingOS AI
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="rounded-xl px-4 py-2 text-sm text-slate-300 hover:text-white">Sign in</Link>
          <Link href="/register" className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-950 hover:bg-slate-200">Start building</Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-14 py-24 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-32">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-400/10 px-3 py-1.5 text-xs font-medium text-indigo-200">
            <span className="size-1.5 rounded-full bg-cyan-300" /> The AI marketing operating system
          </div>
          <h1 className="text-balance max-w-3xl text-5xl font-semibold tracking-[-0.055em] text-white sm:text-7xl">
            The calm, clever way to ship a better campaign.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
            MarketingOS turns your brand context into strategy, posts, visual direction, approvals, scheduling, and performance learning—without losing the human in the loop.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/register" className="inline-flex h-12 items-center gap-2 rounded-xl bg-indigo-500 px-5 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400">
              Create your workspace <ArrowRight className="size-4" />
            </Link>
            <a href="#workflow" className="inline-flex h-12 items-center rounded-xl border border-white/10 px-5 text-sm font-medium text-slate-200 hover:bg-white/5">See the workflow</a>
          </div>
          <ul className="mt-10 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
            {proof.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-300" />{item}</li>)}
          </ul>
        </div>

        <div id="workflow" className="glass relative rounded-3xl p-5 sm:p-7">
          <div className="absolute -inset-10 -z-10 rounded-full bg-indigo-500/15 blur-3xl" />
          <div className="mb-5 flex items-center justify-between">
            <div><p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Campaign pulse</p><p className="mt-1 font-medium text-white">Summer launch · In review</p></div>
            <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-200">8 assets ready</span>
          </div>
          <div className="space-y-3">
            {[
              ["Business Analyzer", "Mapped buyer tension and offer", "done"],
              ["Campaign Strategist", "Built platform-native campaign plan", "done"],
              ["Copywriter", "Drafted 4 approval-ready posts", "done"],
              ["Brand Safety", "Checking message confidence", "live"],
            ].map(([agent, detail, status]) => (
              <div key={agent} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/35 p-4">
                <span className={status === "live" ? "size-2 rounded-full bg-cyan-300 shadow-[0_0_14px_#67e8f9]" : "size-2 rounded-full bg-emerald-300"} />
                <div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-100">{agent}</p><p className="truncate text-xs text-slate-400">{detail}</p></div>
                <span className="text-xs text-slate-500">{status === "live" ? "Working" : "Done"}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl bg-gradient-to-r from-indigo-500/20 to-cyan-500/10 p-4">
            <p className="text-sm font-medium text-white">One source of truth for your next move.</p>
            <p className="mt-1 text-xs leading-5 text-slate-300">Every generated asset keeps its strategy, reviewer feedback, schedule, and results attached.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
