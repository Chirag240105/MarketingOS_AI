import { Card } from "@/components/ui/card";

type StrategyDisplayProps = {
  strategy?: unknown;
};

export function StrategyDisplay({ strategy }: StrategyDisplayProps) {
  if (!strategy) {
    return <Card className="p-5 text-sm text-slate-500">No campaign strategy has been generated yet.</Card>;
  }

  return (
    <Card className="p-5">
      <h2 className="font-medium text-white">Campaign strategy</h2>
      <pre className="mt-4 max-h-96 overflow-auto rounded-lg border border-border bg-bg-base p-4 text-xs leading-5 text-slate-300">
        {JSON.stringify(strategy, null, 2)}
      </pre>
    </Card>
  );
}
