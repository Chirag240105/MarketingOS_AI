import { Brain } from "lucide-react";
import { Card } from "@/components/ui/card";

export function BrandIntelligenceCard({ summary, updatedAt }: { summary?: string | null; updatedAt?: Date | string | null }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <Brain className="size-5 text-indigo-300" />
        <h2 className="font-medium text-white">Brand intelligence</h2>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-400">
        {summary || "Run campaign generation to analyze the brand and cache useful positioning context for future campaigns."}
      </p>
      {updatedAt ? <p className="mt-3 text-xs text-slate-600">Updated {new Date(updatedAt).toLocaleDateString()}</p> : null}
    </Card>
  );
}
