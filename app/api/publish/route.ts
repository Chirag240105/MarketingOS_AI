import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { publishScheduledPost } from "@/lib/publishing/service";
import { requireWorkspaceMembership } from "@/lib/utils/workspace";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const body = await request.json() as { postId?: string };
    if (!body.postId) return NextResponse.json({ ok: false, error: "postId is required" }, { status: 400 });
    const post = await prisma.generatedPost.findUnique({ where: { id: body.postId }, include: { campaign: true } });
    if (!post) return NextResponse.json({ ok: false, error: "Post not found" }, { status: 404 });
    await requireWorkspaceMembership(post.campaign.workspaceId, "EDITOR");
    if (post.status !== "APPROVED" && post.status !== "SCHEDULED") {
      return NextResponse.json({ ok: false, error: "Only approved posts can be published." }, { status: 400 });
    }
    const scheduled = await prisma.scheduledPost.upsert({
      where: { postId: post.id },
      update: { scheduledAt: new Date(), status: "SCHEDULED" },
      create: { postId: post.id, campaignId: post.campaignId, platform: post.platform, scheduledAt: new Date(), timezone: "UTC" },
    });
    return NextResponse.json({ ok: true, data: await publishScheduledPost(scheduled.id) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Publishing failed" }, { status: 400 });
  }
}
