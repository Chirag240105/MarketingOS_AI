import { analyzeBusiness, type BusinessAnalysis } from "@/lib/ai/agents/business-analyzer";
import { reviewBrandSafety } from "@/lib/ai/agents/brand-safety";
import { writeCampaignTextPost } from "@/lib/ai/agents/campaign-copywriter";
import { analyzeCompetitors } from "@/lib/ai/agents/competitor-analyzer";
import { createCreativePrompts } from "@/lib/ai/agents/creative-prompt";
import { planCampaign } from "@/lib/ai/agents/campaign-planner";
import { writeVideoScript } from "@/lib/ai/agents/video-script";
import { createKlingVideoTask } from "@/lib/ai/kling-video-service";
import { generateMarketingImage, getImageTypeForPlatform } from "@/lib/ai/image-service";
import { recordCampaignHistory } from "@/lib/campaign-history";
import { trackAiUsage } from "@/lib/ai/usage-tracker";
import { prisma } from "@/lib/db";
import type { AIAgentType, MediaType, SocialPlatform } from "@/lib/generated/prisma/client";
import type { StructuredAIResult } from "@/lib/ai/service";
import type {
  AgentActivity,
  BrandContext,
  CampaignBrief,
  CampaignGenerationStatus,
  CampaignTextPostOutput,
  CompetitorAnalyzerOutput,
  CreativePromptOutput,
  GeneratedContent,
} from "@/types/ai";

async function runJob<T>(
  agentType: AIAgentType,
  campaignId: string,
  workspaceId: string,
  userId: string,
  input: unknown,
  work: () => Promise<StructuredAIResult<T>>,
) {
  const job = await prisma.aIJob.create({
    data: { campaignId, agentType, status: "RUNNING", input: input as never, startedAt: new Date() },
  });
  const startedAt = Date.now();
  try {
    const result = await work();
    const duration = Date.now() - startedAt;
    await prisma.aIJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        output: { status: result.status, data: result.output, errors: result.errors } as never,
        tokensUsed: result.usage.inputTokens + result.usage.outputTokens,
        completedAt: new Date(),
        duration,
      },
    });
    await trackAiUsage({
      userId,
      workspaceId,
      agentType,
      tokensUsed: result.usage.inputTokens + result.usage.outputTokens,
      cost: 0,
      model: result.usage.model,
    });
    return result;
  } catch (error) {
    await prisma.aIJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        error: error instanceof Error ? error.message : "Agent failed",
        completedAt: new Date(),
        duration: Date.now() - startedAt,
      },
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
    primaryGoal: profile?.primaryGoal,
    budget: profile?.budget?.toString(),
    location: profile?.location,
    productsServices: profile?.productsServices || [],
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
    offer: campaign.offer,
    notes: campaign.notes,
    brand,
  };

  await prisma.campaign.update({ where: { id: campaign.id }, data: { status: "GENERATING" } });
  const activities: AgentActivity[] = [];
  const mark = (agent: AIAgentType, label: string, detail?: string) => {
    activities.push({ agent, label, detail, status: "completed", timestamp: new Date().toISOString() });
  };

  const business = await getBusinessAnalysis(campaign.id, campaign.workspaceId, userId, profile?.id, brand);
  mark("BUSINESS_ANALYZER", "Analyzed brand positioning", business.status === "fallback" ? "Used fallback brand analysis." : undefined);

  const competitor = await runJob("COMPETITOR_ANALYZER", campaign.id, campaign.workspaceId, userId, { brand, brief }, () => analyzeCompetitors(brand, brief));
  mark("COMPETITOR_ANALYZER", "Mapped competitor positioning", competitor.output.sourceNote);

  const strategyInput = { ...brief, businessAnalysis: business.output, competitorAnalysis: competitor.output, pastLearning: await workspaceLearning(campaign.workspaceId) };
  const planner = await runJob("CAMPAIGN_STRATEGIST", campaign.id, campaign.workspaceId, userId, strategyInput, () => planCampaign(strategyInput));
  mark("CAMPAIGN_STRATEGIST", "Built competitor-aware campaign strategy", planner.status === "fallback" ? "Used fallback strategy." : undefined);

  const copyInput = { ...brief, strategy: planner.output.strategy, competitorAnalysis: competitor.output };
  const copy = await runJob("COPYWRITER", campaign.id, campaign.workspaceId, userId, copyInput, () => writeCampaignTextPost(copyInput));
  mark("COPYWRITER", "Wrote platform-ready campaign copy", copy.status === "fallback" ? "Used fallback copy." : undefined);

  const creative = await runJob("VISUAL_CREATIVE", campaign.id, campaign.workspaceId, userId, { brief, planner: planner.output, copy: copy.output }, () => createCreativePrompts(brief, planner.output, copy.output));
  mark("VISUAL_CREATIVE", "Created image and video prompts");

  const mediaEnabled = process.env.AI_GENERATE_MEDIA !== "false";
  const imageUrls = mediaEnabled ? await generateImages(campaign.id, campaign.platforms, brand, creative.output) : new Map<SocialPlatform, string>();
  if (mediaEnabled) mark("VISUAL_CREATIVE", "Generated image creatives", `${imageUrls.size} image assets attached.`);

  let videoUrl: string | undefined;
  if (mediaEnabled && campaign.generateVideo) {
    const video = await runJob("VIDEO_SCRIPT", campaign.id, campaign.workspaceId, userId, { brief, creative: creative.output }, () => writeVideoScript(brief));
    mark("VIDEO_SCRIPT", "Wrote video storyboard");
    videoUrl = await generateVideoAsset(campaign.id, creative.output.videoPromptIdeas[0] || video.output.voiceover || video.output.caption);
    if (videoUrl) mark("VIDEO_SCRIPT", "Generated Kling video asset");
  }

  const posts = buildDrafts(campaign.id, campaign.platforms, copy.output, imageUrls, videoUrl);
  const safety = await runJob("BRAND_SAFETY", campaign.id, campaign.workspaceId, userId, { brand, posts }, () => reviewBrandSafety(brand, posts));
  mark("BRAND_SAFETY", safety.output.approved ? "Approved content for review" : "Flagged content for manual review", safety.output.issues.join("; "));

  const generationStatus: CampaignGenerationStatus = copy.status === "fallback" || planner.status === "fallback" || creative.status === "fallback" ? "fallback" : "generated";
  const postStatus = safety.output.approved ? "GENERATED" : "PENDING_APPROVAL";

  await prisma.$transaction([
    prisma.campaignDraft.create({
      data: {
        campaignId: campaign.id,
        name: copy.output.campaignName,
        primaryText: copy.output.primaryText,
        headline: copy.output.headline,
        description: copy.output.description,
        callToAction: copy.output.callToAction,
        instagramCaption: copy.output.instagramCaption,
        facebookCaption: copy.output.facebookCaption,
        hashtags: copy.output.hashtags,
        pinterestTitle: copy.output.pinterestTitle,
        pinterestDescription: copy.output.pinterestDescription,
        altText: copy.output.altText,
        creativeDirection: copy.output.creativeDirection,
        status: postStatus,
      },
    }),
    prisma.generatedPost.createMany({
      data: posts.map((post) => ({ ...post, status: postStatus })),
    }),
    prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: "REVIEW",
        aiStrategyPlan: {
          businessAnalysis: business.output,
          competitorAnalysis: competitor.output,
          planner: planner.output,
          creative: creative.output,
          brandSafety: safety.output,
          generatedAt: new Date().toISOString(),
        } as never,
        aiStrategy: {
          mediaEnabled,
          campaignName: copy.output.campaignName,
          primaryText: copy.output.primaryText,
          headline: copy.output.headline,
          description: copy.output.description,
          callToAction: copy.output.callToAction,
          instagramCaption: copy.output.instagramCaption,
          facebookCaption: copy.output.facebookCaption,
          pinterestTitle: copy.output.pinterestTitle,
          pinterestDescription: copy.output.pinterestDescription,
          hashtags: copy.output.hashtags,
          altText: copy.output.altText,
          creativeDirection: copy.output.creativeDirection,
          contentType: copy.output.contentType,
          status: generationStatus,
          generatedAt: new Date().toISOString(),
        } as never,
      },
    }),
  ]);
  await recordCampaignHistory({
    campaignId: campaign.id,
    userId,
    action: "AI_CAMPAIGN_GENERATED",
    details: { status: generationStatus, mediaEnabled, generateVideo: campaign.generateVideo, brandSafetyApproved: safety.output.approved },
  });

  return {
    campaignId: campaign.id,
    activities,
    postCount: campaign.platforms.length,
    status: generationStatus,
    warning: generationStatus === "fallback" ? "One or more AI providers returned fallback output; review the drafts before publishing." : undefined,
  };
}

async function getBusinessAnalysis(campaignId: string, workspaceId: string, userId: string, brandProfileId: string | undefined, brand: BrandContext) {
  if (brandProfileId) {
    const profile = await prisma.brandProfile.findUnique({ where: { id: brandProfileId }, select: { lastAnalyzedAt: true, analysisSummary: true } });
    const fresh = profile?.lastAnalyzedAt && Date.now() - profile.lastAnalyzedAt.getTime() < 7 * 24 * 60 * 60 * 1000;
    if (fresh && profile?.analysisSummary) {
      return {
        output: profile.analysisSummary as BusinessAnalysis,
        usage: { inputTokens: 0, outputTokens: 0, model: "cached" },
        status: "generated" as const,
        errors: [],
      };
    }
  }

  const result = await runJob("BUSINESS_ANALYZER", campaignId, workspaceId, userId, brand, () => analyzeBusiness(brand));
  if (brandProfileId) {
    await prisma.brandProfile.update({
      where: { id: brandProfileId },
      data: { lastAnalyzedAt: new Date(), analysisSummary: result.output as never },
    });
  }
  return result;
}

async function workspaceLearning(workspaceId: string) {
  return prisma.aIRecommendation.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { summary: true, wins: true, opportunities: true, nextExperiments: true },
  });
}

async function generateImages(campaignId: string, platforms: SocialPlatform[], brand: BrandContext, creative: CreativePromptOutput) {
  const urls = new Map<SocialPlatform, string>();
  for (const platform of platforms) {
    if (platform === "YOUTUBE" || platform === "TIKTOK" || platform === "PINTEREST") continue;
    const prompt = creative.imagePrompts[platforms.indexOf(platform)] || creative.posterPrompt;
    const url = await generateMarketingImage({
      campaignId,
      prompt,
      type: getImageTypeForPlatform(platform),
      brandName: brand.companyName,
    });
    urls.set(platform, url);
    await prisma.campaignAsset.create({
      data: {
        campaignId,
        name: `${platform} generated image`,
        type: "IMAGE",
        url,
        prompt,
        generationModel: "configured-image-provider",
        providerResponse: { source: "orchestrator" } as never,
      },
    });
  }
  return urls;
}

async function generateVideoAsset(campaignId: string, prompt: string) {
  try {
    const result = await createKlingVideoTask({ prompt, aspectRatio: "9:16", duration: 5 });
    if (result.videoUrl) {
      await prisma.campaignAsset.create({
        data: {
          campaignId,
          name: "Generated video",
          type: "VIDEO",
          url: result.videoUrl,
          prompt,
          generationModel: result.model,
          providerResponse: result.providerResponse as never,
        },
      });
    }
    return result.videoUrl;
  } catch (error) {
    await prisma.campaignAsset.create({
      data: {
        campaignId,
        name: "Video generation failed",
        type: "VIDEO_PROMPT",
        url: "#",
        prompt,
        providerResponse: { error: error instanceof Error ? error.message : "Kling generation failed" } as never,
      },
    });
    return undefined;
  }
}

function buildDrafts(campaignId: string, platforms: SocialPlatform[], copy: CampaignTextPostOutput, images: Map<SocialPlatform, string>, videoUrl?: string) {
  return platforms.map((platform) => {
    const isPinterest = platform === "PINTEREST";
    const isFacebook = platform === "FACEBOOK";
    const imageUrl = images.get(platform);
    const mediaUrls = videoUrl && platform === "INSTAGRAM" ? [videoUrl] : imageUrl ? [imageUrl] : [];
    const mediaType: MediaType = videoUrl && platform === "INSTAGRAM" ? "VIDEO" : imageUrl ? "IMAGE" : "TEXT";
    const body = isPinterest ? copy.pinterestDescription : `${isFacebook ? copy.facebookCaption : copy.instagramCaption}\n\n${copy.callToAction}`;

    return {
      campaignId,
      platform,
      contentType: mediaType === "VIDEO" ? "VIDEO" as const : imageUrl ? "FEED_POST" as const : "CAPTION_ONLY" as const,
      title: isPinterest ? copy.pinterestTitle : copy.headline,
      body,
      caption: isPinterest ? copy.pinterestDescription : isFacebook ? copy.facebookCaption : copy.instagramCaption,
      hashtags: copy.hashtags,
      mentions: [],
      mediaUrls,
      mediaType,
      callToAction: copy.callToAction,
      aiConfidence: 0.86,
      aiReasoning: JSON.stringify({
        altText: copy.altText,
        primaryText: copy.primaryText,
        description: copy.description,
        creativeDirection: copy.creativeDirection,
        mediaGenerated: mediaUrls.length > 0,
      }),
    };
  });
}
