import { PostCard } from "@/components/posts/post-card";
import { prisma } from "@/lib/db";
import { requireWorkspaceBySlug } from "@/lib/utils/workspace";

export default async function ApprovalsPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params;
  const { workspace } = await requireWorkspaceBySlug(workspaceSlug);
  const posts = await prisma.generatedPost.findMany({ where: { campaign: { workspaceId: workspace.id }, status: { in: ["PENDING_APPROVAL", "EDITING"] } }, include: { campaign: true }, orderBy: { updatedAt: "desc" } });
  return <section><p className="text-sm font-medium text-indigo-200">Approval inbox</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Keep the final say human.</h1><p className="mt-2 text-sm text-slate-400">{posts.length ? posts.length + " drafts are ready for a decision." : "Nothing needs a decision right now."}</p><div className="mt-8 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{posts.map((post) => <PostCard key={post.id} post={post} />)}</div></section>;
}
