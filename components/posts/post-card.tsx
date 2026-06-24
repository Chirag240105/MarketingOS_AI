import { ApprovalActions } from "@/components/posts/approval-actions";
import { PlatformPreview } from "@/components/posts/platform-preview";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function PostCard({ post }: { post: { id: string; platform: string; body: string; caption?: string | null; hashtags: string[]; status: string } }) {
  return <Card className="overflow-hidden p-4"><div className="mb-4 flex items-center justify-between"><Badge tone={post.status === "APPROVED" ? "emerald" : post.status === "REJECTED" ? "rose" : "amber"}>{post.status.replaceAll("_", " ")}</Badge><span className="text-xs text-slate-500">AI draft</span></div><PlatformPreview platform={post.platform} body={post.body} caption={post.caption} hashtags={post.hashtags} /><div className="mt-4">{post.status === "PENDING_APPROVAL" || post.status === "EDITING" ? <ApprovalActions postId={post.id} /> : null}</div></Card>;
}
