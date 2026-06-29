import type { PublishedPost, SocialAccount } from "@/lib/generated/prisma/client";
import { learnFromAnalytics } from "@/lib/ai/agents/analytics-learning";
import { prisma } from "@/lib/db";

type Metrics = {
  spend?: number;
  impressions: number;
  reach: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  raw: unknown;
};

const number = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;

async function json(response: Response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Analytics provider request failed: ${JSON.stringify(body) || response.statusText}`);
  return body as Record<string, unknown>;
}

async function metaMetrics(post: PublishedPost, account: SocialAccount): Promise<Metrics> {
  const version = process.env.META_GRAPH_API_VERSION;
  if (!version || !account.accessToken) throw new Error("Meta analytics is not configured for this account.");
  const metrics = account.platform === "INSTAGRAM" ? "impressions,reach,likes,comments,saved,shares" : "post_impressions,post_engaged_users,post_clicks";
  const data = await json(await fetch(`https://graph.facebook.com/${version}/${post.externalId}/insights?metric=${metrics}&access_token=${encodeURIComponent(account.accessToken)}`));
  const insights = Array.isArray(data.data) ? data.data as Array<{ name?: string; values?: Array<{ value?: unknown }> }> : [];
  const values = Object.fromEntries(insights.map((item) => [item.name || "", number(item.values?.[0]?.value)]));
  const impressions = values.impressions || values.post_impressions || 0;
  const likes = values.likes || 0;
  const comments = values.comments || 0;
  const shares = values.shares || 0;
  const saves = values.saved || 0;
  return { impressions, reach: values.reach || 0, likes, comments, shares, saves, clicks: values.post_clicks || 0, engagement: likes + comments + shares + saves || values.post_engaged_users || 0, raw: data };
}

async function xMetrics(post: PublishedPost, account: SocialAccount): Promise<Metrics> {
  if (!account.accessToken) throw new Error("X analytics is not configured for this account.");
  const data = await json(await fetch(`https://api.x.com/2/tweets/${post.externalId}?tweet.fields=public_metrics,organic_metrics`, { headers: { Authorization: `Bearer ${account.accessToken}` } }));
  const tweet = data.data as { public_metrics?: Record<string, unknown>; organic_metrics?: Record<string, unknown> } | undefined;
  const values = tweet?.organic_metrics || tweet?.public_metrics || {};
  const likes = number(values.like_count);
  const comments = number(values.reply_count);
  const shares = number(values.retweet_count);
  const impressions = number(values.impression_count);
  return { impressions, reach: 0, likes, comments, shares, saves: number(values.bookmark_count), clicks: number(values.url_link_clicks), engagement: likes + comments + shares + number(values.bookmark_count), raw: data };
}

async function linkedInMetrics(post: PublishedPost, account: SocialAccount): Promise<Metrics> {
  const version = process.env.LINKEDIN_API_VERSION;
  if (!version || !account.accessToken) throw new Error("LinkedIn analytics is not configured for this account.");
  if (!post.externalId) throw new Error("LinkedIn post ID is missing.");
  const data = await json(await fetch(`https://api.linkedin.com/rest/socialActions/${encodeURIComponent(post.externalId)}`, {
    headers: { Authorization: `Bearer ${account.accessToken}`, "Linkedin-Version": version, "X-Restli-Protocol-Version": "2.0.0" },
  }));
  const comments = number((data.commentSummary as Record<string, unknown> | undefined)?.totalFirstLevelComments);
  const likes = number((data.reactionSummaries as Record<string, unknown> | undefined)?.LIKE);
  return { impressions: 0, reach: 0, likes, comments, shares: 0, saves: 0, clicks: 0, engagement: likes + comments, raw: data };
}

async function fetchMetrics(post: PublishedPost, account: SocialAccount) {
  if (account.platform === "INSTAGRAM" || account.platform === "FACEBOOK") return metaMetrics(post, account);
  if (account.platform === "X") return xMetrics(post, account);
  if (account.platform === "LINKEDIN") return linkedInMetrics(post, account);
  throw new Error(`${account.platform} analytics is not supported yet.`);
}

async function fetchMetaCampaignInsights(metaCampaign: { externalId: string | null; campaign: { workspace: { socialAccounts: SocialAccount[] } } }) {
  if (!metaCampaign.externalId) throw new Error("Meta campaign ID is missing.");
  const version = process.env.META_GRAPH_API_VERSION;
  if (!version) throw new Error("META_GRAPH_API_VERSION is not configured.");
  const account = metaCampaign.campaign.workspace.socialAccounts.find((item) => (item.platform === "FACEBOOK" || item.platform === "INSTAGRAM") && item.isConnected && item.accessToken);
  if (!account?.accessToken) throw new Error("Connected Meta account is missing.");
  const fields = "spend,reach,impressions,clicks,ctr,cpm,cpc,frequency,actions,conversions,purchase_roas";
  const data = await json(await fetch(`https://graph.facebook.com/${version}/${metaCampaign.externalId}/insights?fields=${fields}&access_token=${encodeURIComponent(account.accessToken)}`));
  const row = Array.isArray(data.data) ? data.data[0] as Record<string, unknown> | undefined : undefined;
  const actions = Array.isArray(row?.actions) ? row.actions as Array<{ action_type?: string; value?: string }> : [];
  const actionValue = (name: string) => number(actions.find((item) => item.action_type === name)?.value);
  const roasRows = Array.isArray(row?.purchase_roas) ? row.purchase_roas as Array<{ value?: string }> : [];
  return {
    spend: numeric(row?.spend) || 0,
    reach: number(row?.reach) || Math.round(numeric(row?.reach) || 0),
    impressions: number(row?.impressions) || Math.round(numeric(row?.impressions) || 0),
    clicks: number(row?.clicks) || Math.round(numeric(row?.clicks) || 0),
    ctr: numeric(row?.ctr),
    cpm: numeric(row?.cpm),
    cpc: numeric(row?.cpc),
    frequency: numeric(row?.frequency),
    conversions: number(row?.conversions) || actionValue("lead") || actionValue("purchase"),
    roas: numeric(roasRows[0]?.value),
    engagement: actionValue("post_engagement"),
    comments: actionValue("comment"),
    shares: actionValue("post_share"),
    likes: actionValue("like"),
    raw: data,
  };
}

export async function syncAnalytics() {
  const published = await prisma.publishedPost.findMany({
    where: { status: "PUBLISHED" },
    include: { socialAccount: true },
    take: 100,
  });
  const failures: Array<{ postId: string; error: string }> = [];
  let snapshotsCreated = 0;
  const touchedCampaignIds = new Set<string>();
  for (const post of published) {
    try {
      const metrics = await fetchMetrics(post, post.socialAccount);
      await prisma.analyticsSnapshot.create({
        data: {
          campaignId: post.campaignId,
          publishedPostId: post.id,
          platform: post.platform,
          impressions: metrics.impressions,
          reach: metrics.reach,
          engagement: metrics.engagement,
          likes: metrics.likes,
          comments: metrics.comments,
          shares: metrics.shares,
          saves: metrics.saves,
          clicks: metrics.clicks,
          ctr: metrics.impressions ? metrics.clicks / metrics.impressions : null,
          providerResponse: metrics.raw as never,
          snapshotDate: new Date(),
        },
      });
      snapshotsCreated++;
      touchedCampaignIds.add(post.campaignId);
    } catch (error) {
      failures.push({ postId: post.id, error: error instanceof Error ? error.message : "Analytics sync failed" });
    }
  }
  const metaCampaigns = await prisma.metaCampaign.findMany({
    where: { externalId: { not: null }, status: { not: "DELETED" } },
    include: { campaign: { include: { workspace: { include: { socialAccounts: true } } } } },
    take: 100,
  });
  let campaignSnapshotsCreated = 0;
  for (const metaCampaign of metaCampaigns) {
    try {
      const metrics = await fetchMetaCampaignInsights(metaCampaign);
      await prisma.campaignAnalytics.create({
        data: {
          campaignId: metaCampaign.campaignId,
          spend: metrics.spend,
          reach: metrics.reach,
          impressions: metrics.impressions,
          clicks: metrics.clicks,
          ctr: metrics.ctr,
          cpm: metrics.cpm,
          cpc: metrics.cpc,
          frequency: metrics.frequency,
          conversions: metrics.conversions,
          roas: metrics.roas,
          engagement: metrics.engagement,
          comments: metrics.comments,
          shares: metrics.shares,
          likes: metrics.likes,
          providerResponse: metrics.raw as never,
          snapshotDate: new Date(),
        },
      });
      await createCampaignRecommendations(metaCampaign.campaignId, metrics);
      campaignSnapshotsCreated++;
      touchedCampaignIds.add(metaCampaign.campaignId);
    } catch (error) {
      failures.push({ postId: metaCampaign.campaignId, error: error instanceof Error ? error.message : "Meta campaign analytics sync failed" });
    }
  }
  for (const campaignId of touchedCampaignIds) {
    try {
      await buildCampaignInsights(campaignId);
    } catch (error) {
      failures.push({ postId: campaignId, error: error instanceof Error ? error.message : "Learning update failed" });
    }
  }
  return { publishedPosts: published.length, snapshotsCreated, campaignSnapshotsCreated, failures };
}

export async function buildCampaignInsights(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new Error("Campaign not found.");
  const snapshots = await prisma.analyticsSnapshot.findMany({ where: { campaignId }, orderBy: { snapshotDate: "desc" }, take: 50 });
  const campaignAnalytics = await prisma.campaignAnalytics.findMany({ where: { campaignId }, orderBy: { snapshotDate: "desc" }, take: 10 });
  if (!snapshots.length && !campaignAnalytics.length) throw new Error("No live analytics are available for this campaign yet.");
  await createCampaignRecommendations(campaignId, campaignAnalytics[0]);
  if (!snapshots.length) {
    return prisma.aIRecommendation.create({
      data: {
        campaignId,
        workspaceId: campaign.workspaceId,
        summary: "Campaign-level Meta analytics are available. Recommendations were generated from the latest spend, reach, CTR, frequency, and ROAS signals.",
        wins: [],
        opportunities: ["Review the campaign recommendations panel for practical optimization actions."],
        nextExperiments: ["Test a stronger headline", "Broaden audience targeting", "Refresh creative direction"],
        sourceSnapshotCount: campaignAnalytics.length,
      },
    });
  }
  const result = await learnFromAnalytics(snapshots);
  return prisma.aIRecommendation.create({
    data: {
      campaignId,
      workspaceId: campaign.workspaceId,
      summary: result.output.summary,
      wins: result.output.wins,
      opportunities: result.output.opportunities,
      nextExperiments: result.output.nextExperiments,
      sourceSnapshotCount: snapshots.length,
    },
  });
}

async function createCampaignRecommendations(campaignId: string, latest?: {
  ctr?: number | null;
  cpc: unknown;
  cpm: unknown;
  frequency?: number | null;
  roas?: number | null;
  reach: number;
  spend: unknown;
  impressions: number;
}) {
  if (!latest) return;
  const recommendations: Array<{ summary: string; recommendation: string; metric: string; severity: string }> = [];
  if ((latest.ctr || 0) < 0.01) recommendations.push({ summary: "CTR is below average.", recommendation: "Improve the headline and first sentence. Make the offer more specific and action-oriented.", metric: "ctr", severity: "warning" });
  if (Number(latest.spend || 0) < 300) recommendations.push({ summary: "Budget utilization is low.", recommendation: "Increase budget by ₹300/day once tracking and targeting are confirmed.", metric: "spend", severity: "info" });
  if (latest.reach < 1000 && latest.impressions > 0) recommendations.push({ summary: "Audience may be too narrow.", recommendation: "Expand the audience age/location range and test a broader interest stack.", metric: "reach", severity: "warning" });
  if ((latest.frequency || 0) > 3.5) recommendations.push({ summary: "Frequency is high.", recommendation: "Create new copy or creative variants before fatigue reduces CTR.", metric: "frequency", severity: "warning" });
  if (latest.roas !== null && latest.roas !== undefined && latest.roas < 1.5) recommendations.push({ summary: "ROAS is decreasing or weak.", recommendation: "Pause underperforming ads and move budget to stronger ad sets.", metric: "roas", severity: "critical" });

  if (!recommendations.length) recommendations.push({ summary: "Performance is stable.", recommendation: "Keep monitoring CTR, CPC, and frequency before scaling budget.", metric: "overall", severity: "info" });

  await prisma.campaignRecommendation.createMany({
    data: recommendations.map((item) => ({ campaignId, ...item })),
  });
}

function numeric(value: unknown) {
  const parsed = typeof value === "string" ? Number.parseFloat(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : undefined;
}
