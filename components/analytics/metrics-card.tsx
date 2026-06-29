import { Card } from "@/components/ui/card";

export function MetricsCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <Card className="p-5"><p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{label}</p><p className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white">{value}</p><p className="mt-2 text-xs text-emerald-300">{detail}</p></Card>;
}
