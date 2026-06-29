function Cell({ className = "" }: { className?: string }) {
  return <div className={"h-4 rounded bg-slate-800 " + className} />;
}

export default function CampaignsLoading() {
  return (
    <section className="animate-pulse">
      <Cell className="h-4 w-36" />
      <Cell className="mt-3 h-9 w-80 max-w-full" />
      <div className="mt-8 rounded-xl border border-border bg-bg-surface p-4">
        <Cell className="h-10 w-full" />
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        {Array.from({ length: 5 }).map((_, row) => (
          <div key={row} className="grid grid-cols-4 gap-4 border-b border-border p-4 last:border-0">
            {Array.from({ length: 4 }).map((__, col) => <Cell key={col} className={col === 0 ? "w-40" : "w-24"} />)}
          </div>
        ))}
      </div>
    </section>
  );
}
