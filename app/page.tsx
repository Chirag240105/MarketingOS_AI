import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  Brain,
  CalendarCheck,
  CheckCircle2,
  FileText,
  ImageIcon,
  Layers3,
  Megaphone,
  PlayCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Video,
} from "lucide-react";

const workflow = [
  "Enter business details",
  "Create campaign brief",
  "AI analyzes brand",
  "AI studies competitors",
  "AI builds campaign strategy",
  "AI writes captions and ad copy",
  "AI generates creative briefs",
  "Hugging Face generates images",
  "Kling generates videos",
  "Publishing plan is created",
  "Analytics are reviewed",
  "Learning agent improves the next campaign",
];

const agents = [
  { name: "Brand Analysis Agent", icon: ShieldCheck, output: "Brand profile and messaging pillars", why: "Keeps every campaign grounded in the same voice and promise." },
  { name: "Competitor Analysis Agent", icon: Search, output: "Competitor map and opportunities", why: "Finds the angles that make the campaign worth noticing." },
  { name: "Campaign Strategy Agent", icon: Target, output: "Funnel, platform strategy, and budget allocation", why: "Turns the brief into a channel-specific plan." },
  { name: "Copywriting Agent", icon: FileText, output: "Hooks, captions, ad copy, and landing copy", why: "Creates reviewable copy without starting from a blank page." },
  { name: "Creative Generation Agent", icon: ImageIcon, output: "Creative brief, image prompt, and video prompt", why: "Gives media generation a clear commercial direction." },
  { name: "Publishing Agent", icon: CalendarCheck, output: "Publishing plan and approval checklist", why: "Keeps launch timing and review steps visible." },
  { name: "Analytics Agent", icon: BarChart3, output: "Metric readout and recommendations", why: "Explains what happened after the campaign runs." },
  { name: "Learning Agent", icon: Brain, output: "Wins, losses, and future experiments", why: "Feeds results back into the next campaign." },
];

const features = [
  "Database-backed AI agent pipeline",
  "Campaign creation, approvals, scheduling, and analytics",
  "Hugging Face image generation and Kling video fallback",
  "Demo mode for safe hackathon walkthroughs",
  "Docker PostgreSQL locally, Aurora PostgreSQL for showcase",
  "S3-ready generated asset storage",
];

const tech = ["Next.js 15", "React 19", "TypeScript", "Tailwind CSS", "Prisma 7", "PostgreSQL", "Auth.js", "Hugging Face", "Kling AI", "AWS S3", "Aurora PostgreSQL"];

export default function Home() {
  return (
    <main className="min-h-screen bg-bg-base text-slate-100">
      <section className="relative min-h-[92vh] overflow-hidden border-b border-white/10">
        <DashboardScene />
        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 sm:px-10">
          <Link href="/" className="flex items-center gap-2 font-semibold text-white">
            <span className="grid size-9 place-items-center rounded-lg bg-cyan-300 text-slate-950"><Sparkles className="size-5" /></span>
            MarketingOS AI
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:text-white">Sign in</Link>
            <Link href="/register" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950 hover:bg-slate-200">Create Your First Campaign</Link>
          </div>
        </nav>

        <div className="relative z-10 mx-auto flex min-h-[calc(92vh-88px)] max-w-7xl flex-col justify-center px-6 pb-20 pt-10 sm:px-10">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-slate-950/70 px-3 py-1.5 text-xs font-medium text-cyan-100">
              <span className="size-1.5 rounded-full bg-cyan-300" />
              AI-powered marketing operating system
            </p>
            <h1 className="mt-6 text-5xl font-semibold text-white sm:text-7xl">
              Your AI-powered marketing team in one dashboard.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-200">
              MarketingOS AI helps businesses plan, create, publish, analyze, and improve marketing campaigns using specialized AI agents.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/register" className="inline-flex h-12 items-center gap-2 rounded-lg bg-cyan-300 px-5 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
                Create Your First Campaign <ArrowRight className="size-4" />
              </Link>
              <a href="#how-it-works" className="inline-flex h-12 items-center rounded-lg border border-white/15 bg-slate-950/70 px-5 text-sm font-medium text-slate-100 hover:bg-white/10">See how it works</a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-10">
        <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-medium text-cyan-200">What is MarketingOS AI?</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">A full agency workflow, connected from brief to learning.</h2>
          </div>
          <div className="grid gap-4 text-sm leading-6 text-slate-300 md:grid-cols-2">
            <p>Most teams jump between strategy docs, AI chats, design tools, ad platforms, spreadsheets, and analytics dashboards. MarketingOS AI puts the workflow in one place.</p>
            <p>Each agent produces a concrete output that is stored with the campaign, so judges can inspect the chain from business brief to creative, publishing plan, analytics, and next experiment.</p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-white/10 bg-slate-950/50">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:px-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium text-cyan-200">How it works</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">From business context to better next campaign.</h2>
            </div>
            <Link href="/register" className="inline-flex items-center gap-2 text-sm font-medium text-cyan-200">Start the workflow <ArrowRight className="size-4" /></Link>
          </div>
          <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {workflow.map((step, index) => (
              <li key={step} className="flex min-h-20 gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-cyan-300/10 text-sm font-semibold text-cyan-200">{index + 1}</span>
                <span className="pt-1 text-sm text-slate-200">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-10">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-cyan-200">AI agent workflow</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Eight agents, each with a job judges can understand.</h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {agents.map((agent) => {
            const Icon = agent.icon;
            return (
              <article key={agent.name} className="rounded-lg border border-white/10 bg-bg-surface p-5">
                <Icon className="size-5 text-cyan-200" />
                <h3 className="mt-4 font-medium text-white">{agent.name}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{agent.output}</p>
                <p className="mt-4 border-t border-white/10 pt-4 text-xs leading-5 text-slate-500">{agent.why}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-white/10 bg-slate-950/50">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-16 sm:px-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-cyan-200">Demo campaign example</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Show judges a full campaign without live provider risk.</h2>
            <p className="mt-5 text-sm leading-6 text-slate-300">Turn on demo mode, create a campaign, run the pipeline, then open the campaign detail page to show every stored output: brief, brand analysis, competitor analysis, strategy, copy, creative brief, generated media records, publishing plan, analytics, and learning insights.</p>
          </div>
          <div className="grid gap-3">
            {["Create campaign brief", "Run full pipeline", "Review generated outputs", "Analyze results", "Update learning"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-lg border border-white/10 bg-bg-surface p-4">
                <CheckCircle2 className="size-5 text-emerald-300" />
                <span className="text-sm text-slate-200">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 sm:px-10 lg:grid-cols-3">
        <div>
          <p className="text-sm font-medium text-cyan-200">Key features</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Built for a real operating workflow.</h2>
        </div>
        <div className="grid gap-3 lg:col-span-2 sm:grid-cols-2">
          {features.map((feature) => (
            <div key={feature} className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-300" />
              {feature}
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-slate-950/50">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:px-10">
          <p className="text-sm font-medium text-cyan-200">Why it is different</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Comparison title="Meta Ads Manager" text="Great for media buying, but not a full campaign creation, approval, creative, and learning workflow." icon={<Megaphone className="size-5" />} />
            <Comparison title="Canva" text="Great for design production, but it does not own brand analysis, strategy, copywriting, publishing, and analytics together." icon={<Layers3 className="size-5" />} />
            <Comparison title="Normal AI tools" text="Great for individual prompts, but outputs are not organized into a database-backed marketing pipeline." icon={<Sparkles className="size-5" />} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-10">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-medium text-cyan-200">Tech stack</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Modern SaaS foundations with practical AI integrations.</h2>
          </div>
          <div className="flex max-w-2xl flex-wrap gap-2">
            {tech.map((item) => <span key={item} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300">{item}</span>)}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-6 py-14 text-center sm:px-10">
        <h2 className="text-3xl font-semibold text-white">Create your first campaign and show the whole operating system.</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-400">Use demo mode for a stable hackathon walkthrough, then switch real providers on only when you want live AI media generation.</p>
        <Link href="/register" className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-slate-950 hover:bg-slate-200">
          Create Your First Campaign <ArrowRight className="size-4" />
        </Link>
      </section>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-xs text-slate-500 sm:px-10">
        MarketingOS AI. Built for a clean judge demo: local Docker by default, Aurora only when needed, demo mode when credits matter.
      </footer>
    </main>
  );
}

function DashboardScene() {
  return (
    <div className="absolute inset-0 bg-slate-950">
      <div className="absolute inset-x-0 bottom-0 top-24 mx-auto max-w-7xl px-6 opacity-55 sm:px-10">
        <div className="grid h-full content-end gap-4 pb-10 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-lg border border-white/10 bg-slate-950/80 p-4 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <p className="text-xs text-cyan-200">Campaign pipeline</p>
                <p className="mt-1 text-sm font-medium text-white">Summer launch</p>
              </div>
              <span className="rounded-full bg-emerald-300/10 px-2.5 py-1 text-xs text-emerald-200">Ready to publish</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {["Brand", "Competitors", "Strategy", "Copy", "Creative", "Publishing"].map((item) => (
                <div key={item} className="rounded-md border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-xs text-slate-400">{item} Agent</p>
                  <div className="mt-3 h-2 rounded-full bg-slate-800"><div className="h-2 rounded-full bg-cyan-300" style={{ width: "84%" }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4">
            <div className="rounded-lg border border-white/10 bg-slate-950/80 p-4">
              <div className="flex items-center gap-3"><PlayCircle className="size-5 text-cyan-200" /><span className="text-sm font-medium text-white">Product reel</span></div>
              <div className="mt-4 aspect-video rounded-md border border-white/10 bg-slate-900" />
            </div>
            <div className="rounded-lg border border-white/10 bg-slate-950/80 p-4">
              <div className="flex items-center gap-3"><Video className="size-5 text-cyan-200" /><span className="text-sm font-medium text-white">Learning insight</span></div>
              <p className="mt-3 text-xs leading-5 text-slate-400">Reels with clear workflow visuals produced the strongest saves and demo starts.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Comparison({ title, text, icon }: { title: string; text: string; icon: ReactNode }) {
  return (
    <article className="rounded-lg border border-white/10 bg-bg-surface p-5">
      <div className="text-cyan-200">{icon}</div>
      <h3 className="mt-4 font-medium text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
    </article>
  );
}
