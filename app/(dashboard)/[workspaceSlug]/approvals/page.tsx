import Link from "next/link";
import { CheckSquare, Plus } from "lucide-react";
import { PostCard } from "@/components/posts/post-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/utils/permissions";
import { requireWorkspaceBySlug } from "@/lib/utils/workspace";

export default async function ApprovalsPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params;
  const { workspace, membership } = await requireWorkspaceBySlug(workspaceSlug);
  const canApprove = hasPermission(membership.role, "post:approve");
  const posts = await prisma.generatedPost.findMany({
    where: { campaign: { workspaceId: workspace.id }, status: { in: ["PENDING_APPROVAL", "EDITING", "APPROVED"] } },
    select: {
      id: true,
      platform: true,
      title: true,
      body: true,
      caption: true,
      hashtags: true,
      mentions: true,
      callToAction: true,
      status: true,
      mediaUrls: true,
      adId: true,
      adStatus: true,
      campaign: { select: { name: true, workspace: { select: { brandProfile: { select: { website: true } } } } } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return <section><p className="text-sm font-medium text-indigo-200">Approval inbox</p><h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-white">Keep the final say human.</h1><p className="mt-2 text-sm text-slate-400">{posts.length ? posts.length + " drafts and approved posts are ready for action." : "Nothing needs a decision right now."}</p>{posts.length ? <div className="mt-8 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{posts.map((post) => <PostCard key={post.id} post={post} canApprove={canApprove} />)}</div> : <Card className="mt-8 p-12 text-center"><CheckSquare className="mx-auto size-16 text-slate-700" /><h2 className="mt-4 text-lg font-semibold text-slate-400">All caught up</h2><p className="mt-2 text-sm text-slate-600">No posts waiting for review.</p><Link className="mt-6 inline-flex" href={"/"+workspace.slug+"/campaigns/new"}><Button><Plus className="size-4" />New Campaign</Button></Link></Card>}</section>;
}
