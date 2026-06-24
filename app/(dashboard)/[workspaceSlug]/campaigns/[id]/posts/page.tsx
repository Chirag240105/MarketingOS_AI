import { PostCard } from "@/components/posts/post-card";
import { prisma } from "@/lib/db";
import { requireWorkspaceBySlug } from "@/lib/utils/workspace";

export default async function CampaignPostsPage({ params }: { params: Promise<{ workspaceSlug: string; id: string }> }) {
  const { workspaceSlug, id } = await params;
  const { workspace } = await requireWorkspaceBySlug(workspaceSlug);
  const campaign = await prisma.campaign.findFirst({ where: { id, workspaceId: workspace.id }, include: { generatedPosts: { orderBy: { createdAt: "desc" } } } });
  if (!campaign) return <div className="py-20 text-center text-slate-400">Campaign not found.</div>;
  return <section><p className="text-sm font-medium text-indigo-200">Campaign content</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Preview before you publish.</h1><p className="mt-2 text-sm text-slate-400">Approve, request edits, or reject each platform-native draft.</p><div className="mt-8 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{campaign.generatedPosts.length ? campaign.generatedPosts.map((post) => <PostCard key={post.id} post={post} />) : <p className="text-sm text-slate-500">Generate this campaign first to create approval-ready posts.</p>}</div></section>;
}
