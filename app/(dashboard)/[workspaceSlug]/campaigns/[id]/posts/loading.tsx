function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-bg-surface p-4">
      <div className="h-5 w-24 rounded bg-slate-800" />
      <div className="mt-5 space-y-3">
        <div className="h-4 rounded bg-slate-800" />
        <div className="h-4 w-5/6 rounded bg-slate-800" />
        <div className="h-4 w-2/3 rounded bg-slate-800" />
      </div>
      <div className="mt-6 h-9 w-32 rounded bg-slate-800" />
    </div>
  );
}

export default function PostsLoading() {
  return (
    <section className="animate-pulse">
      <div className="h-4 w-36 rounded bg-slate-800" />
      <div className="mt-3 h-9 w-80 max-w-full rounded bg-slate-800" />
      <div className="mt-8 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => <CardSkeleton key={index} />)}
      </div>
    </section>
  );
}
