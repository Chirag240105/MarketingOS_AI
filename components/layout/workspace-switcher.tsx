import Link from "next/link";

export function WorkspaceSwitcher({ workspaces }: { workspaces: { slug: string; name: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {workspaces.map((workspace) => <Link key={workspace.slug} href={"/" + workspace.slug} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5">{workspace.name}</Link>)}
    </div>
  );
}
