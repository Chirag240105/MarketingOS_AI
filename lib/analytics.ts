import { learnFromAnalytics } from "@/lib/ai/agents/analytics-learning";
import { prisma } from "@/lib/db";

function metricSeed(value: string) {
  return Array.from(value).reduce((sum, character) => sum + character.charCodeAt(0), 0);
}

export async function syncMockAnalytics() {
  const published = await prisma.publishedPost.findMany({
    where: { status: "PUBLISHED" },
    include: { campaign: true },
    take: 100,
  });
  let created = 0;
  for (const post of published) {
    const seed = metricSeed(post.id + new Date().toISOString().slice(0, 10));
    const impressions = 900 + (seed % 4500);
    const engagement = Math.round(impressions * (0.035 + (seed % 30) / 1000));
    await prisma.analyticsSnapshot.create({
      data: {
        campaignId: post.campaignId,
        publishedPostId: post.id,
        platform: post.platform,
        impressions,
        reach: Math.round(impressions * 0.72),
        engagement,
        likes: Math.round(engagement * 0.7),
        comments: Math.round(engagement * 0.1),
        shares: Math.round(engagement * 0.1),
        saves: Math.round(engagement * 0.1),
        clicks: Math.round(impressions * 0.015),
        ctr: 0.015,
        snapshotDate: new Date(),
      },
    });
    created++;
  }
  return { publishedPosts: published.length, snapshotsCreated: created };
}

export async function buildCampaignInsights(campaignId: string) {
  const snapshots = await prisma.analyticsSnapshot.findMany({ where: { campaignId }, orderBy: { snapshotDate: "desc" }, take: 50 });
  return learnFromAnalytics(snapshots);
}
