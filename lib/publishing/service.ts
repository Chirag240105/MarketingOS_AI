import { prisma } from "@/lib/db";
import { PLATFORMS } from "@/config/platforms";
import { linkedInPublisher } from "@/lib/publishing/linkedin";
import { metaPublisher } from "@/lib/publishing/meta";
import type { SocialPublisher } from "@/lib/publishing/provider";
import { xPublisher } from "@/lib/publishing/x";

function publisherFor(platform: "INSTAGRAM" | "FACEBOOK" | "X" | "LINKEDIN" | "TIKTOK" | "YOUTUBE" | "PINTEREST"): SocialPublisher {
  if (!PLATFORMS[platform].publishingSupported) throw new Error(`${PLATFORMS[platform].label} publishing is coming soon.`);
  if (platform === "INSTAGRAM" || platform === "FACEBOOK") return metaPublisher;
  if (platform === "LINKEDIN") return linkedInPublisher;
  if (platform === "X") return xPublisher;
  throw new Error(`${platform} publishing is not supported yet.`);
}

export async function publishScheduledPost(scheduleId: string) {
  const schedule = await prisma.scheduledPost.findUnique({
    where: { id: scheduleId },
    include: { post: true, campaign: { include: { workspace: { include: { socialAccounts: true } } } } },
  });
  if (!schedule) throw new Error("Scheduled post not found.");
  if (schedule.status === "PUBLISHED") return { status: "already_published" };

  const claimed = await prisma.scheduledPost.updateMany({
    where: { id: schedule.id, status: "SCHEDULED" },
    data: { status: "PUBLISHING" },
  });
  if (!claimed.count) return { status: "already_processing" };

  const account = schedule.campaign.workspace.socialAccounts.find(
    (item) => item.platform === schedule.platform && item.isConnected,
  );
  if (!account) {
    await prisma.scheduledPost.update({ where: { id: schedule.id }, data: { status: "FAILED", errorMessage: "No connected account for this platform." } });
    await prisma.generatedPost.update({ where: { id: schedule.postId }, data: { status: "FAILED" } });
    return { status: "failed", error: "No connected account for this platform." };
  }

  try {
    if (schedule.platform === "INSTAGRAM" && !schedule.post.mediaUrls.length) {
      throw new Error("Instagram publishing requires a public image URL. Generate or attach an image before approving this post.");
    }
    const result = await publisherFor(schedule.platform).publish(account, {
      body: schedule.post.body,
      caption: schedule.post.caption,
      mediaUrls: schedule.post.mediaUrls,
    });
    await prisma.$transaction([
      prisma.publishedPost.upsert({
        where: { postId: schedule.postId },
        update: { status: "PUBLISHED", publishedAt: new Date(), externalId: result.externalId, externalUrl: result.externalUrl, metadata: result.response as never },
        create: {
          postId: schedule.postId,
          scheduledPostId: schedule.id,
          campaignId: schedule.campaignId,
          socialAccountId: account.id,
          platform: schedule.platform,
          externalId: result.externalId,
          externalUrl: result.externalUrl,
          publishedAt: new Date(),
          metadata: result.response as never,
        },
      }),
      prisma.scheduledPost.update({ where: { id: schedule.id }, data: { status: "PUBLISHED", publishedAt: new Date(), errorMessage: null } }),
      prisma.generatedPost.update({ where: { id: schedule.postId }, data: { status: "PUBLISHED" } }),
    ]);
    return { status: "published", externalUrl: result.externalUrl };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Publishing failed";
    await prisma.$transaction([
      prisma.scheduledPost.update({ where: { id: schedule.id }, data: { status: "FAILED", errorMessage: message, retryCount: { increment: 1 } } }),
      prisma.generatedPost.update({ where: { id: schedule.postId }, data: { status: "FAILED" } }),
    ]);
    return { status: "failed", error: message };
  }
}

export async function publishDuePosts() {
  const due = await prisma.scheduledPost.findMany({
    where: { status: "SCHEDULED", scheduledAt: { lte: new Date() } },
    orderBy: { scheduledAt: "asc" },
    take: 100,
  });
  const results = await Promise.all(due.map((schedule) => publishScheduledPost(schedule.id)));
  return { attempted: due.length, results };
}
