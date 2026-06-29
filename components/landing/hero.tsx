"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Film,
  ImageIcon,
  Megaphone,
  PlayCircle,
  RadioTower,
  Sparkles,
  Target,
  Video,
  WalletCards,
} from "lucide-react";

const trustItems = ["AI Strategy", "AI Images", "AI Videos", "Social Publishing", "Analytics"];

const stats = [
  { value: "500+", label: "Campaigns generated" },
  { value: "92%", label: "Automation score" },
  { value: "6+", label: "AI agents" },
];

const campaigns = [
  { name: "Summer Launch", status: "Ready", score: 94, color: "bg-cyan-300" },
  { name: "Founder Story", status: "Drafting", score: 72, color: "bg-indigo-300" },
  { name: "Retargeting Push", status: "Live", score: 88, color: "bg-emerald-300" },
];

const agents = [
  { name: "Brand", progress: 100 },
  { name: "Competitor", progress: 92 },
  { name: "Strategy", progress: 86 },
  { name: "Copy", progress: 78 },
  { name: "Creative", progress: 66 },
];

const publishingQueue = [
  { platform: "Instagram", time: "10:30", icon: ImageIcon },
  { platform: "LinkedIn", time: "14:00", icon: RadioTower },
  { platform: "Meta Ads", time: "17:45", icon: Megaphone },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

export function LandingHero() {
  return (
    <section className="relative isolate min-h-[90vh] overflow-hidden border-b border-white/10 bg-bg-base">
      <HeroBackground />

      <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 sm:px-10">
        <Link href="/" className="flex items-center gap-2 font-semibold text-white">
          <span className="grid size-9 place-items-center rounded-lg bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-300/20">
            <Sparkles className="size-5" />
          </span>
          MarketingOS AI
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/login" className="rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:text-white sm:px-4">
            Sign in
          </Link>
          <Link
            href="/register"
            className="hidden rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950 shadow-lg shadow-white/10 transition-colors hover:bg-slate-200 sm:inline-flex"
          >
            Create Campaign
          </Link>
        </div>
      </nav>

      <div className="relative z-10 mx-auto grid min-h-[calc(90vh-88px)] max-w-7xl grid-cols-1 items-center gap-12 px-6 pb-16 pt-8 sm:px-10 lg:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)] lg:gap-16 xl:gap-24">
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.08 }}
          className="max-w-[620px]"
        >
          <motion.p
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-slate-950/70 px-3 py-1.5 text-xs font-medium text-cyan-100 shadow-lg shadow-black/20 backdrop-blur"
          >
            <span className="size-1.5 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.8)]" />
            AI-powered marketing operating system
          </motion.p>

          <motion.h1
            variants={fadeUp}
            className="mt-6 max-w-[12ch] text-balance text-[2.25rem] font-semibold leading-[1.03] text-white sm:text-5xl md:text-6xl lg:text-[4rem] xl:text-[4.5rem]"
          >
            Run Your Entire Marketing Team with AI
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            Plan campaigns, generate creative, publish across channels, and learn from performance with specialized AI agents in one premium workspace.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-cyan-300 px-5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-300/20 transition hover:-translate-y-0.5 hover:bg-cyan-200"
            >
              Create Your First Campaign <ArrowRight className="size-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/15 bg-slate-950/70 px-5 text-sm font-medium text-slate-100 backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-300/35 hover:bg-white/10"
            >
              See product workflow <ChevronRight className="size-4" />
            </a>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-7 flex flex-wrap gap-2">
            {trustItems.map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300">
                <CheckCircle2 className="size-3.5 text-emerald-300" />
                {item}
              </span>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="mt-8 grid max-w-lg grid-cols-3 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-white/10 bg-slate-950/50 p-3 backdrop-blur">
                <p className="text-xl font-semibold text-white sm:text-2xl">{stat.value}</p>
                <p className="mt-1 text-[0.72rem] leading-4 text-slate-400">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 26, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.12 }}
          className="relative mx-auto w-full max-w-[760px] lg:max-w-none"
        >
          <DashboardPreview />
        </motion.div>
      </div>
    </section>
  );
}

function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_35%,rgba(99,102,241,0.26),transparent_34%),radial-gradient(circle_at_18%_18%,rgba(34,211,238,0.12),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.25),rgba(5,10,20,0.96))]" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="absolute -right-24 top-28 size-[34rem] rounded-full bg-cyan-300/10 blur-3xl" />
      <div className="absolute left-1/2 top-2/3 h-40 w-[52rem] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
    </div>
  );
}

function DashboardPreview() {
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      className="relative rounded-2xl border border-white/10 bg-slate-950/70 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-4"
    >
      <div className="absolute -left-5 top-16 hidden rounded-xl border border-cyan-300/20 bg-slate-950/85 p-3 shadow-2xl shadow-cyan-950/30 backdrop-blur xl:block">
        <div className="flex items-center gap-2">
          <ImageIcon className="size-4 text-cyan-200" />
          <span className="text-xs font-medium text-white">Creative ready</span>
        </div>
        <div className="mt-3 h-20 w-28 rounded-lg bg-[radial-gradient(circle_at_35%_35%,rgba(34,211,238,0.7),transparent_28%),linear-gradient(135deg,#172554,#312e81_50%,#0f172a)]" />
      </div>

      <div className="absolute -right-4 bottom-14 hidden rounded-xl border border-indigo-300/20 bg-slate-950/90 p-3 shadow-2xl shadow-indigo-950/40 backdrop-blur xl:block">
        <div className="flex items-center gap-2">
          <WalletCards className="size-4 text-indigo-200" />
          <span className="text-xs font-medium text-white">Credits</span>
        </div>
        <p className="mt-2 text-2xl font-semibold text-white">74%</p>
        <div className="mt-2 h-1.5 w-28 rounded-full bg-slate-800">
          <motion.div
            initial={{ width: "18%" }}
            animate={{ width: "74%" }}
            transition={{ duration: 1.2, delay: 0.5 }}
            className="h-full rounded-full bg-indigo-300"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(8,13,25,0.96))]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-rose-400/80" />
            <span className="size-2.5 rounded-full bg-amber-300/80" />
            <span className="size-2.5 rounded-full bg-emerald-300/80" />
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200 sm:flex">
            <RadioTower className="size-3.5" />
            Live workspace
          </div>
        </div>

        <div className="grid gap-3 p-3 sm:gap-4 sm:p-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-3 sm:space-y-4">
            <Panel className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-cyan-200">Campaign command center</p>
                  <h2 className="mt-1 text-lg font-semibold text-white">Product launch sprint</h2>
                </div>
                <span className="rounded-full bg-cyan-300/10 px-2.5 py-1 text-xs text-cyan-100">Generating</span>
              </div>
              <div className="mt-4 grid gap-2">
                {campaigns.map((campaign) => (
                  <div key={campaign.name} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3">
                    <span className={`size-2.5 rounded-full ${campaign.color}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{campaign.name}</p>
                      <p className="text-xs text-slate-500">{campaign.status}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-200">{campaign.score}</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="size-4 text-cyan-200" />
                  <p className="text-sm font-medium text-white">AI agent pipeline</p>
                </div>
                <span className="text-xs text-slate-500">5 active</span>
              </div>
              <div className="mt-4 space-y-3">
                {agents.map((agent, index) => (
                  <div key={agent.name}>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">{agent.name}</span>
                      <span className="text-slate-500">{agent.progress}%</span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-slate-800">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${agent.progress}%` }}
                        transition={{ duration: 0.9, delay: 0.25 + index * 0.08 }}
                        className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-indigo-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <div className="grid gap-3 sm:grid-cols-2">
              <Panel className="p-4">
                <div className="flex items-center gap-2">
                  <ImageIcon className="size-4 text-cyan-200" />
                  <p className="text-sm font-medium text-white">Image generation</p>
                </div>
                <div className="mt-3 aspect-[4/3] rounded-lg border border-white/10 bg-[radial-gradient(circle_at_28%_28%,rgba(34,211,238,0.75),transparent_24%),radial-gradient(circle_at_72%_38%,rgba(99,102,241,0.72),transparent_28%),linear-gradient(135deg,#020617,#172554_55%,#0f172a)]" />
              </Panel>
              <Panel className="p-4">
                <div className="flex items-center gap-2">
                  <Film className="size-4 text-indigo-200" />
                  <p className="text-sm font-medium text-white">Video preview</p>
                </div>
                <div className="mt-3 grid aspect-[4/3] place-items-center rounded-lg border border-white/10 bg-[linear-gradient(135deg,#111827,#1e1b4b_50%,#020617)]">
                  <span className="grid size-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur">
                    <PlayCircle className="size-5" />
                  </span>
                </div>
              </Panel>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <Panel className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="size-4 text-emerald-200" />
                  <p className="text-sm font-medium text-white">Analytics</p>
                </div>
                <span className="text-xs text-emerald-200">+18.4%</span>
              </div>
              <div className="mt-5 flex h-28 items-end gap-2">
                {[42, 66, 54, 82, 70, 96, 88].map((height, index) => (
                  <motion.div
                    key={height + index}
                    initial={{ height: 8 }}
                    animate={{ height }}
                    transition={{ duration: 0.8, delay: 0.25 + index * 0.06 }}
                    className="flex-1 rounded-t-md bg-gradient-to-t from-indigo-400/70 to-cyan-300"
                  />
                ))}
              </div>
            </Panel>

            <Panel className="p-4">
              <div className="flex items-center gap-2">
                <CalendarCheck className="size-4 text-cyan-200" />
                <p className="text-sm font-medium text-white">Publishing queue</p>
              </div>
              <div className="mt-4 space-y-2">
                {publishingQueue.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.platform} className="flex items-center gap-3 rounded-lg bg-white/[0.035] p-3">
                      <span className="grid size-8 place-items-center rounded-lg bg-white/5 text-cyan-100">
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-200">{item.platform}</span>
                      <span className="text-xs text-slate-500">{item.time}</span>
                    </div>
                  );
                })}
              </div>
            </Panel>

            <Panel className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="size-4 text-indigo-200" />
                  <p className="text-sm font-medium text-white">Connected platforms</p>
                </div>
                <span className="text-xs text-slate-500">6 synced</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {["Meta", "IG", "X", "YT", "LI", "TikTok"].map((item) => (
                  <span key={item} className="rounded-lg border border-white/10 bg-white/[0.035] px-2 py-2 text-center text-xs text-slate-300">
                    {item}
                  </span>
                ))}
              </div>
            </Panel>

            <Panel className="p-4">
              <div className="flex items-center gap-2">
                <Video className="size-4 text-emerald-200" />
                <p className="text-sm font-medium text-white">Recent activity</p>
              </div>
              <div className="mt-4 space-y-3 text-xs text-slate-400">
                <p>Creative agent generated 4 ad concepts.</p>
                <p>Analytics agent found 3 optimization wins.</p>
                <p>Publishing plan scheduled across 4 channels.</p>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <motion.div
      whileHover={{ y: -3, borderColor: "rgba(103,232,249,0.28)" }}
      transition={{ duration: 0.2 }}
      className={`rounded-xl border border-white/10 bg-white/[0.045] shadow-lg shadow-black/20 backdrop-blur ${className || ""}`}
    >
      {children}
    </motion.div>
  );
}
