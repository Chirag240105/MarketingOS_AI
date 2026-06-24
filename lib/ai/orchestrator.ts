import { analyzeBusiness } from "@/lib/ai/agents/business-analyzer";
import { reviewBrandSafety } from "@/lib/ai/agents/brand-safety";
import { createCampaignStrategy } from "@/lib/ai/agents/campaign-strategist";
import { writeCampaignPosts } from "@/lib/ai/agents/copywriter";
import { writeVideoScript } from "@/lib/ai/agents/video-script";
import { createVisualConcepts } from "@/lib/ai/agents/visual-creative";
import { trackAiUsage } from "@/lib/ai/usage-tracker";
import { prisma } from "@/lib/db";
import type { AIAgentType } from "@/lib/generated/prisma/client";
import type { AgentActivity, BrandContext, CampaignBrief } from "@/types/ai";

async function runJob<T>(
  agentType: AIAgentType,
  campaignId: string,
  workspaceId: string,
  userId: string,
  input: unknown,
  work: () => Promise<{ output: T; mocked: boolean }>,
) {
  const job = await prisma.aIJob.create({
    data: { campaignId, agentType, status: "RUNNING", input: input as never },
  });
  const startedAt = Date.now();
  try {
    const result = await work();
    const duration = Date.now() - startedAt;
    await prisma.aIJob.update({
      where: { id: job.id },
      data: { status: "COMPLETED", output: result.output as never, completedAt: new Date(), duration },
    });
    await trackAiUsage({ userId, workspaceId, agentType, tokensUsed: result.mocked ? 0 : 700, cost: result.mocked ? 0 : 0.003 });
    return result.output;
  } catch (error) {
    await prisma.aIJob.update({
      where: { id: job.id },
      data: { status: "FAILED", error: error instanceof Error ? error.message : "Agent failed", completedAt: new Date(), duration: Date.now() - startedAt },
    });
    throw error;
  }
}

export async function generateCampaign(campaignId: string, userId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { workspace: { include: { brandProfile: true } } },
  });
  if (!campaign) throw new Error("Campaign not found.");

  const profile = campaign.workspace.brandProfile;
  const brand: BrandContext = {
    companyName: profile?.companyName || campaign.workspace.name,
    description: profile?.description,
    industry: profile?.industry,
    toneOfVoice: profile?.toneOfVoice,
    targetAudience: profile?.targetAudience,
    values: profile?.values || [],
    competitors: profile?.competitors || [],
  };
  const brief: CampaignBrief = {
    campaignId: campaign.id,
    name: campaign.name,
    description: campaign.description,
    goal: campaign.goal,
    platforms: campaign.platforms,
    targetAudience: campaign.targetAudience,
    brand,
  };

  await prisma.campaign.update({ where: { id: campaign.id }, data: { status: "GENERATING" } });
  const activities: AgentActivity[] = [];
  const mark = (agent: AIAgentType, label: string) => activities.push({ agent, label, status: "completed", timestamp: new Date().toISOString() });

  const analysis = await runJob("BUSINESS_ANALYZER", campaign.id, campaign.workspaceId, userId, brand, () => analyzeBusiness(brand));
  mark("BUSINESS_ANALYZER", "Mapped the business opportunity");

  const strategy = await runJob("CAMPAIGN_STRATEGIST", campaign.id, campaign.workspaceId, userId, { brief, analysis }, () => createCampaignStrategy(brief));
  mark("CAMPAIGN_STRATEGIST", "Built the campaign strategy");

  const postsResult = await runJob("COPYWRITER", campaign.id, campaign.workspaceId, userId, { brief, strategy }, () => writeCampaignPosts(brief, strategy));
  mark("COPYWRITER", "Wrote platform-native posts");

  const safety = await runJob("BRAND_SAFETY", campaign.id, campaign.workspaceId, userId, { brand, posts: postsResult.posts }, () => reviewBrandSafety(brand, postsResult.posts));
  mark("BRAND_SAFETY", safety.approved ? "Cleared brand safety review" : "Flagged content for review");

  const visuals = await runJob("VISUAL_CREATIVE", campaign.id, campaign.workspaceId, userId, { brief, strategy }, () => createVisualConcepts(brief, strategy));
  mark("VISUAL_CREATIVE", "Created visual directions");

  const video = await runJob("VIDEO_SCRIPT", campaign.id, campaign.workspaceId, userId, brief, () => writeVideoScript(brief));
  mark("VIDEO_SCRIPT", "Wrote a short-form video script");

  await prisma.$transaction([
    prisma.generatedPost.createMany({
      data: postsResult.posts.map((post) => ({
        campaignId: campaign.id,
        platform: post.platform,
        contentType: post.contentType,
        title: post.title,
        body: post.body,
        caption: post.caption,
        hashtags: post.hashtags,
        mentions: post.mentions,
        mediaType: post.mediaType,
        callToAction: post.callToAction,
        aiConfidence: post.aiConfidence,
        aiReasoning: post.aiReasoning,
        status: safety.approved ? "PENDING_APPROVAL" : "EDITING",
      })),
    }),
    prisma.campaignAsset.createMany({
      data: visuals.concepts.map((concept) => ({
        campaignId: campaign.id,
        name: concept.name,
        type: concept.type === "CAROUSEL" ? "CAROUSEL_SLIDE" : "IMAGE",
        url: "prompt://" + encodeURIComponent(concept.prompt),
        metadata: { prompt: concept.prompt, rationale: concept.rationale },
      })),
    }),
    prisma.campaignAsset.create({
      data: {
        campaignId: campaign.id,
        name: "Short-form video script",
        type: "REEL_SCRIPT",
        url: "inline://video-script",
        metadata: video,
      },
    }),
    prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: "REVIEW",
        aiStrategy: { ...strategy, analysis, safety, generatedAt: new Date().toISOString() },
      },
    }),
  ]);

  return { campaignId: campaign.id, activities, postCount: postsResult.posts.length, mocked: !(process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY) };
}
