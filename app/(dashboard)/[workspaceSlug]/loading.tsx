function Block({ className = "" }: { className?: string }) {
  return <div className={"rounded-xl bg-slate-800 " + className} />;
}

export default function WorkspaceLoading() {
  return (
    <section className="animate-pulse">
      <div className="flex items-end justify-between">
        <div>
          <Block className="h-4 w-28" />
          <Block className="mt-3 h-9 w-64" />
          <Block className="mt-3 h-4 w-96 max-w-full" />
        </div>
        <Block className="hidden h-10 w-36 sm:block" />
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <Block key={index} className="h-32" />)}
      </div>
      <div className="mt-8 grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <Block className="h-96" />
        <Block className="h-96" />
      </div>
    </section>
  );
}
