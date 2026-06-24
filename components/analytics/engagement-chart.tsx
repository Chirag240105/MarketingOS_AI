"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";

export function EngagementChart({ data }: { data: { date: string; engagement: number }[] }) {
  return <Card className="h-80 p-5"><p className="font-medium text-white">Engagement over time</p><div className="mt-5 h-60"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data}><defs><linearGradient id="engagement" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#818cf8" stopOpacity={0.45} /><stop offset="95%" stopColor="#818cf8" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} /><YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,.12)", borderRadius: 12 }} /><Area type="monotone" dataKey="engagement" stroke="#818cf8" strokeWidth={2} fill="url(#engagement)" /></AreaChart></ResponsiveContainer></div></Card>;
}
