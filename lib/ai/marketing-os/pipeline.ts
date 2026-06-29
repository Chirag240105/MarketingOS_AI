import { prisma } from "@/lib/db";
import { z } from "zod";
import { callAI } from "@/lib/ai/providers/callAI";
import { isDemoMode } from "@/lib/env";
import { generateImageWithHuggingFace } from "@/lib/ai/marketing-os/huggingface";
import { generateVideoWithKling } from "@/lib/ai/marketing-os/kling";
import { analyticsSystemPrompt } from "@/lib/ai/marketing-os/prompts/analytics";
import { brandAnalysisSystemPrompt } from "@/lib/ai/marketing-os/prompts/brand-analysis";
import { campaignStrategySystemPrompt } from "@/lib/ai/marketing-os/prompts/campaign-strategy";
import { competitorAnalysisSystemPrompt } from "@/lib/ai/marketing-os/prompts/competitor-analysis";
import { copywritingSystemPrompt } from "@/lib/ai/marketing-os/prompts/copywriting";
import { creativeGenerationSystemPrompt } from "@/lib/ai/marketing-os/prompts/creative-generation";
import { learningSystemPrompt } from "@/lib/ai/marketing-os/prompts/learning";
import { publishingSystemPrompt } from "@/lib/ai/marketing-os/prompts/publishing";
import {
  analyticsAgentSchema,
  brandAnalysisSchema,
  campaignCopySchema,
  campaignStrategySchema,
  competitorAnalysisSchema,
  creativeBriefSchema,
  learningInsightSchema,
  publishingPlanSchema,
  type AnalyticsAgentOutput,
  type BrandAnalysisOutput,
  type CampaignCopyOutput,
  type CampaignStrategyOutput,
  type CompetitorAnalysisOutput,
  type CreativeBriefOutput,
  type LearningInsightOutput,
  type PublishingPlanOutput,
} from "@/lib/ai/marketing-os/schemas";

// Agent model routing is handled by lib/ai/providers/callAI.ts.

export async function runCampaignPipeline(campaignId: string) {
  const campaign = await loadCampaign(campaignId);

  try {
    const brand = await getOrRunBrandAnalysis(campaign.id, buildCampaignInput(campaign));
    const competitors = await getOrRunCompetitorAnalysis(campaign.id, { campaign: buildCampaignInput(campaign), brand });
    const strategy = await getOrRunCampaignStrategy(campaign.id, { campaign: buildCampaignInput(campaign), brand, competitors });
    const copy = await getOrRunCampaignCopy(campaign.id, { campaign: buildCampaignInput(campaign), strategy });
    const creative = await getOrRunCreativeBrief(campaign.id, { campaign: buildCampaignInput(campaign), strategy, copy });

    const image = await getOrGenerateImage(campaign.id, creative);
    const video = await getOrGenerateVideo(campaign.id, creative, image.url || image.base64Ref || undefined);

    const publishing = await getOrRunPublishingPlan(campaign.id, {
      campaign: buildCampaignInput(campaign),
      copy,
      creative,
      assets: { image, video },
    });

    await prisma.campaign.update({ where: { id: campaign.id }, data: { status: "READY_TO_PUBLISH" } });
    return { brand, competitors, strategy, copy, creative, image, video, publishing };
  } catch (error) {
    await prisma.campaign.update({ where: { id: campaign.id }, data: { status: "FAILED" } });
    throw error;
  }
}

export async function runCampaignAnalyticsAgent(campaignId: string) {
  const campaign = await loadCampaign(campaignId);
  await ensureMockAnalytics(campaign.id);
  const analytics = await prisma.campaignAnalytics.findMany({
    where: { campaignId: campaign.id },
    orderBy: { snapshotDate: "desc" },
    take: 5,
  });

  const output = await runAgent<AnalyticsAgentOutput>({
    campaignId: campaign.id,
    agentName: "Analytics Agent",
    agentKey: "analytics",
    systemPrompt: analyticsSystemPrompt,
    input: { campaign: buildCampaignInput(campaign), analytics },
    schema: analyticsAgentSchema,
  });

  await prisma.campaign.update({ where: { id: campaign.id }, data: { status: "ANALYZED" } });
  return output;
}

export async function runCampaignLearningAgent(campaignId: string) {
  const campaign = await loadCampaign(campaignId);
  const analyticsRuns = await prisma.agentRun.findMany({
    where: { campaignId: campaign.id, agentName: "Analytics Agent", status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    take: 3,
  });
  const agentOutputs = await prisma.agentRun.findMany({
    where: { campaignId: campaign.id, status: "COMPLETED" },
    orderBy: { completedAt: "asc" },
  });

  const output = await runAgent<LearningInsightOutput>({
    campaignId: campaign.id,
    agentName: "Learning Agent",
    agentKey: "learning",
    systemPrompt: learningSystemPrompt,
    input: { campaign: buildCampaignInput(campaign), analyticsRuns, agentOutputs },
    schema: learningInsightSchema,
  });

  await prisma.learningInsight.create({
    data: {
      campaignId: campaign.id,
      summary: output.summary,
      recommendations: output.recommendations,
      output: output as never,
    },
  });
  await prisma.campaign.update({ where: { id: campaign.id }, data: { status: "LEARNING_UPDATED" } });
  return output;
}

async function getOrRunBrandAnalysis(campaignId: string, input: unknown) {
  const existing = await prisma.brandAnalysis.findUnique({ where: { campaignId } });
  if (existing) return existing.profile as BrandAnalysisOutput;

  const output = await runAgent<BrandAnalysisOutput>({
    campaignId,
    agentName: "Brand Analysis Agent",
    agentKey: "brandAnalysis",
    systemPrompt: brandAnalysisSystemPrompt,
    input,
    schema: brandAnalysisSchema,
  });
  await prisma.brandAnalysis.create({ data: { campaignId, profile: output as never, summary: output.summary } });
  await prisma.campaign.update({ where: { id: campaignId }, data: { status: "BRAND_ANALYZED" } });
  return output;
}

async function getOrRunCompetitorAnalysis(campaignId: string, input: unknown) {
  const existing = await prisma.competitorAnalysis.findUnique({ where: { campaignId } });
  if (existing) return { summary: existing.summary || "", competitors: existing.competitors, opportunities: existing.opportunities, differentiationAngles: [] } as unknown as CompetitorAnalysisOutput;

  const output = await runAgent<CompetitorAnalysisOutput>({
    campaignId,
    agentName: "Competitor Analysis Agent",
    agentKey: "competitorAnalysis",
    systemPrompt: competitorAnalysisSystemPrompt,
    input,
    schema: competitorAnalysisSchema,
  });
  await prisma.competitorAnalysis.create({
    data: { campaignId, competitors: output.competitors as never, opportunities: output.opportunities, summary: output.summary },
  });
  await prisma.campaign.update({ where: { id: campaignId }, data: { status: "COMPETITOR_ANALYZED" } });
  return output;
}

async function getOrRunCampaignStrategy(campaignId: string, input: unknown) {
  const existing = await prisma.campaignStrategy.findUnique({ where: { campaignId } });
  if (existing) return existing.strategy as CampaignStrategyOutput;

  const output = await runAgent<CampaignStrategyOutput>({
    campaignId,
    agentName: "Campaign Strategy Agent",
    agentKey: "campaignStrategy",
    systemPrompt: campaignStrategySystemPrompt,
    input,
    schema: campaignStrategySchema,
  });
  await prisma.campaignStrategy.create({
    data: {
      campaignId,
      strategy: output as never,
      contentCalendar: output.contentCalendar as never,
      budgetAllocation: output.budgetAllocation as never,
      summary: output.summary,
    },
  });
  await prisma.campaign.update({ where: { id: campaignId }, data: { status: "STRATEGY_READY" } });
  return output;
}

async function getOrRunCampaignCopy(campaignId: string, input: unknown) {
  const existing = await prisma.campaignCopy.findUnique({ where: { campaignId } });
  if (existing) return existing.copy as CampaignCopyOutput;

  const output = await runAgent<CampaignCopyOutput>({
    campaignId,
    agentName: "Copywriting Agent",
    agentKey: "copywriting",
    systemPrompt: copywritingSystemPrompt,
    input,
    schema: campaignCopySchema,
  });
  await prisma.campaignCopy.create({ data: { campaignId, copy: output as never } });
  await prisma.campaign.update({ where: { id: campaignId }, data: { status: "COPY_READY" } });
  return output;
}

async function getOrRunCreativeBrief(campaignId: string, input: unknown) {
  const existing = await prisma.creativeBrief.findUnique({ where: { campaignId } });
  if (existing) return existing.brief as CreativeBriefOutput;

  const output = await runAgent<CreativeBriefOutput>({
    campaignId,
    agentName: "Creative Generation Agent",
    agentKey: "creativeGeneration",
    systemPrompt: creativeGenerationSystemPrompt,
    input,
    schema: creativeBriefSchema,
  });
  await prisma.creativeBrief.create({
    data: { campaignId, brief: output as never, imagePrompt: output.imagePrompt, videoPrompt: output.videoPrompt },
  });
  await prisma.campaign.update({ where: { id: campaignId }, data: { status: "CREATIVE_READY" } });
  return output;
}

async function getOrRunPublishingPlan(campaignId: string, input: unknown) {
  const existing = await prisma.publishingPlan.findUnique({ where: { campaignId } });
  if (existing) return existing.plan as PublishingPlanOutput;

  const output = await runAgent<PublishingPlanOutput>({
    campaignId,
    agentName: "Publishing Agent",
    agentKey: "publishing",
    systemPrompt: publishingSystemPrompt,
    input,
    schema: publishingPlanSchema,
  });
  await prisma.publishingPlan.create({ data: { campaignId, plan: output as never } });
  return output;
}

async function getOrGenerateImage(campaignId: string, creative: CreativeBriefOutput) {
  const existing = await prisma.generatedAsset.findFirst({
    where: { campaignId, type: "IMAGE", status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing;
  if (isDemoMode()) return createDemoGeneratedAsset(campaignId, "IMAGE", creative.imagePrompt);
  return generateImageWithHuggingFace({
    campaignId,
    prompt: creative.imagePrompt,
    negativePrompt: creative.imageNegativePrompt,
    aspectRatio: creative.aspectRatio,
  });
}

async function getOrGenerateVideo(campaignId: string, creative: CreativeBriefOutput, imageUrl?: string) {
  const existing = await prisma.generatedAsset.findFirst({
    where: { campaignId, type: "VIDEO", status: { in: ["COMPLETED", "PROCESSING"] } },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing;
  if (isDemoMode()) return createDemoGeneratedAsset(campaignId, "VIDEO", creative.videoPrompt);
  return generateVideoWithKling({
    campaignId,
    prompt: creative.videoPrompt,
    imageUrl,
    duration: creative.duration,
    aspectRatio: creative.aspectRatio,
  });
}

async function runAgent<T>(input: {
  campaignId: string;
  agentName: string;
  agentKey: string;
  systemPrompt: string;
  input: unknown;
  schema: z.ZodType<T>;
}) {
  const startedAt = new Date();
  const agentRun = await prisma.agentRun.create({
    data: {
      campaignId: input.campaignId,
      agentName: input.agentName,
      modelUsed: `callAI:${input.agentKey}`,
      input: jsonSafe(input.input) as never,
      status: "RUNNING",
      retryCount: 2,
      startedAt,
    },
  });

  try {
    const output = await callValidatedAgent(input);

    await prisma.agentRun.update({
      where: { id: agentRun.id },
      data: { output: output as never, status: "COMPLETED", completedAt: new Date() },
    });
    return output;
  } catch (error) {
    await prisma.agentRun.update({
      where: { id: agentRun.id },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Agent failed.",
        completedAt: new Date(),
      },
    });
    throw error;
  }
}

async function callValidatedAgent<T>(input: {
  agentName: string;
  agentKey: string;
  systemPrompt: string;
  input: unknown;
  schema: z.ZodType<T>;
}) {
  if (isDemoMode()) return input.schema.parse(demoAgentOutput(input.agentKey, input.input));

  let prompt = buildAgentPrompt(input.agentKey, input.systemPrompt, input.input);
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await callAI(input.agentKey, prompt);
    try {
      return parseAgentJson(input.schema, raw);
    } catch (error) {
      lastError = error;
      prompt = buildRepairPrompt(input.agentKey, input.systemPrompt, input.input, raw, error);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`${input.agentName} returned invalid output.`);
}

function parseAgentJson<T>(schema: z.ZodType<T>, raw: string) {
  const parsed = parseJsonContent(raw);
  const candidates = [parsed];

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const value = parsed as Record<string, unknown>;
    for (const key of ["output", "result", "data", "response"]) {
      if (key in value) candidates.push(value[key]);
    }
  }

  let lastError: z.ZodError | undefined;
  for (const candidate of candidates) {
    const result = schema.safeParse(candidate);
    if (result.success) return result.data;
    lastError = result.error;
  }

  throw lastError || new Error("Agent response did not match the expected schema.");
}

function parseJsonContent(raw: string): unknown {
  const clean = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .replace(/^\s*[\r\n]/gm, "")
    .trim();
  const firstBrace = clean.indexOf("{");
  const lastBrace = clean.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("No JSON object found in agent response.");
  }
  const parsed = JSON.parse(clean.substring(firstBrace, lastBrace + 1));
  return typeof parsed === "string" ? JSON.parse(parsed) : parsed;
}

async function loadCampaign(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      workspace: { include: { brandProfile: true } },
      campaignPlatforms: true,
    },
  });
  if (!campaign) throw new Error("Campaign not found.");
  return campaign;
}

function buildCampaignInput(campaign: Awaited<ReturnType<typeof loadCampaign>>) {
  return jsonSafe({
    id: campaign.id,
    name: campaign.name,
    description: campaign.description,
    goal: campaign.goal,
    status: campaign.status,
    budget: campaign.budget,
    offer: campaign.offer,
    notes: campaign.notes,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    targetAudience: campaign.targetAudience,
    platforms: campaign.campaignPlatforms.length ? campaign.campaignPlatforms.map((item) => item.platform) : campaign.platforms,
    workspace: {
      name: campaign.workspace.name,
      brandProfile: campaign.workspace.brandProfile,
    },
  });
}

function jsonSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function buildAgentPrompt(agentKey: string, systemPrompt: string, input: unknown) {
  return `${systemPrompt}

Return exactly one valid JSON object and nothing else. Do not include markdown or prose.
Use exactly this output shape, with every field present and with the listed value types:
${expectedOutputShape(agentKey)}

Input:
${JSON.stringify(jsonSafe(input), null, 2)}`;
}

function buildRepairPrompt(agentKey: string, systemPrompt: string, input: unknown, rawOutput: string, error: unknown) {
  return `${systemPrompt}

Your previous response failed validation.

Validation errors:
${formatValidationError(error)}

Return a corrected JSON object only. Use exactly this output shape, with every field present and with the listed value types:
${expectedOutputShape(agentKey)}

Original input:
${JSON.stringify(jsonSafe(input), null, 2)}

Invalid previous response:
${rawOutput}`;
}

function formatValidationError(error: unknown) {
  if (error instanceof z.ZodError) {
    return JSON.stringify(error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    })), null, 2);
  }
  return error instanceof Error ? error.message : "Invalid JSON output.";
}

function expectedOutputShape(agentKey: string) {
  const shapes: Record<string, string> = {
    brandAnalysis: `{
  "summary": "string",
  "brandProfile": {
    "businessModel": "string",
    "audienceSegments": ["string"],
    "positioning": "string",
    "toneOfVoice": "string",
    "corePromise": "string",
    "proofPoints": ["string"],
    "risks": ["string"]
  },
  "messagingPillars": [
    { "pillar": "string", "rationale": "string" }
  ]
}`,
    competitorAnalysis: `{
  "summary": "string",
  "competitors": [
    { "name": "string", "rank": 1, "positioning": "string", "strengths": ["string"], "weaknesses": ["string"] }
  ],
  "opportunities": ["string"],
  "differentiationAngles": ["string"]
}`,
    campaignStrategy: `{
  "summary": "string",
  "campaignIdea": "string",
  "funnel": [{ "stage": "string", "message": "string", "primaryMetric": "string" }],
  "platformStrategy": [{ "platform": "string", "role": "string", "contentTypes": ["string"] }],
  "contentCalendar": [{ "day": "string", "platform": "string", "theme": "string", "assetType": "string" }],
  "budgetAllocation": [{ "channel": "string", "percentage": 50, "rationale": "string" }]
}`,
    copywriting: `{
  "hooks": ["string"],
  "captions": [{ "platform": "string", "caption": "string", "hashtags": ["string"] }],
  "adCopy": [{ "platform": "string", "primaryText": "string", "headline": "string", "description": "string", "cta": "string" }],
  "landingPageCopy": { "headline": "string", "subheadline": "string", "bullets": ["string"], "cta": "string" }
}`,
    creativeGeneration: `{
  "concept": "string",
  "visualDirection": "string",
  "imagePrompt": "string",
  "imageNegativePrompt": "string",
  "videoPrompt": "string",
  "aspectRatio": "9:16",
  "duration": 5,
  "shotList": ["string"]
}`,
    publishing: `{
  "summary": "string",
  "posts": [{ "platform": "string", "format": "string", "scheduledFor": "ISO date string", "captionRef": "string", "assetType": "string", "status": "string" }],
  "approvalChecklist": ["string"],
  "tracking": { "utmSource": "string", "utmCampaign": "string", "primaryKpi": "string" }
}`,
    analytics: `{
  "summary": "string",
  "metricReadout": [{ "metric": "string", "value": "string", "interpretation": "string" }],
  "insights": ["string"],
  "recommendations": ["string"]
}`,
    learning: `{
  "summary": "string",
  "wins": ["string"],
  "losses": ["string"],
  "recommendations": ["string"],
  "futureExperiments": ["string"]
}`,
  };

  return shapes[agentKey] || "{ \"summary\": \"string\" }";
}

async function ensureMockAnalytics(campaignId: string) {
  const count = await prisma.campaignAnalytics.count({ where: { campaignId } });
  if (count) return;
  await prisma.campaignAnalytics.create({
    data: {
      campaignId,
      spend: 1250,
      reach: 42000,
      impressions: 68000,
      clicks: 1850,
      ctr: 0.027,
      cpm: 18.38,
      cpc: 0.68,
      frequency: 1.62,
      conversions: 94,
      roas: 2.8,
      engagement: 3100,
      comments: 126,
      shares: 284,
      likes: 2690,
      source: "mock",
      providerResponse: { note: "Mock analytics generated because platform analytics are not connected." },
    },
  });
}

function createDemoGeneratedAsset(campaignId: string, type: "IMAGE" | "VIDEO", prompt: string) {
  const isImage = type === "IMAGE";
  return prisma.generatedAsset.create({
    data: {
      campaignId,
      type,
      status: "COMPLETED",
      provider: "demo",
      model: "demo-mode",
      prompt,
      url: isImage ? "/globe.svg" : null,
      providerResponse: {
        demoMode: true,
        note: isImage
          ? "Demo image placeholder used to avoid Hugging Face or S3 spend."
          : "Demo video placeholder used to avoid Kling spend.",
      },
    },
  });
}

function demoAgentOutput(agentKey: string, input: unknown) {
  const campaign = extractCampaign(input);
  const name = campaign.name || "Demo Campaign";
  const platforms = campaign.platforms.length ? campaign.platforms : ["INSTAGRAM", "LINKEDIN"];

  const outputs: Record<string, unknown> = {
    brandAnalysis: {
      summary: `${name} has a clear demo-ready positioning opportunity: turn a business brief into a complete campaign system.`,
      brandProfile: {
        businessModel: "AI-assisted marketing operations for growing teams and agencies.",
        audienceSegments: ["Founders", "Small marketing teams", "Digital agencies"],
        positioning: "A single operating system for planning, creating, publishing, and learning from campaigns.",
        toneOfVoice: "Clear, confident, and practical.",
        corePromise: "Move from campaign idea to reviewable marketing assets in minutes.",
        proofPoints: ["Agent-by-agent workflow", "Human approval gates", "Mock analytics for demos"],
        risks: ["Over-automation without review", "Disconnected provider credentials during live demos"],
      },
      messagingPillars: [
        { pillar: "Speed with control", rationale: "Teams get drafts quickly while keeping approval ownership." },
        { pillar: "End-to-end workflow", rationale: "Strategy, copy, creative, publishing, analytics, and learning live together." },
      ],
    },
    competitorAnalysis: {
      summary: "Point solutions help with one stage, but MarketingOS AI connects the full agency workflow.",
      competitors: [
        { name: "Canva", rank: 1, positioning: "Design-first creative tool", strengths: ["Templates", "Fast editing"], weaknesses: ["Limited campaign intelligence", "No agentic marketing workflow"] },
        { name: "Meta Ads Manager", rank: 2, positioning: "Paid media execution platform", strengths: ["Ad delivery", "Audience controls"], weaknesses: ["Complex setup", "No cross-channel creative pipeline"] },
        { name: "Generic AI chat tools", rank: 3, positioning: "Flexible text generation", strengths: ["Open-ended ideation"], weaknesses: ["No persistent workflow", "No approval or analytics loop"] },
      ],
      opportunities: ["Show the complete pipeline visually", "Emphasize reusable brand context", "Make demo-mode outputs transparent"],
      differentiationAngles: ["Specialized agents", "Database-backed campaign memory", "Publishing and learning loop"],
    },
    campaignStrategy: {
      summary: "Launch a judge-friendly campaign that explains the workflow, then drives users into campaign creation.",
      campaignIdea: "Your AI marketing team in one dashboard.",
      funnel: [
        { stage: "Awareness", message: "Show the workflow pain of disconnected marketing tools.", primaryMetric: "Reach" },
        { stage: "Consideration", message: "Demonstrate agents producing strategy, copy, creative, and plans.", primaryMetric: "Demo starts" },
        { stage: "Conversion", message: "Invite users to create their first campaign.", primaryMetric: "Campaigns created" },
      ],
      platformStrategy: platforms.map((platform) => ({ platform, role: "Showcase the campaign workflow", contentTypes: ["Short post", "Carousel", "Product reel"] })),
      contentCalendar: platforms.map((platform, index) => ({ day: `Day ${index + 1}`, platform, theme: "AI marketing workflow", assetType: index === 0 ? "Reel" : "Carousel" })),
      budgetAllocation: [
        { channel: platforms[0] || "INSTAGRAM", percentage: 60, rationale: "Prioritize the strongest visual demo channel." },
        { channel: platforms[1] || "LINKEDIN", percentage: 40, rationale: "Use professional proof for judges and founders." },
      ],
    },
    copywriting: {
      hooks: ["Your campaign team just became an operating system.", "From brief to publish plan without tool chaos."],
      captions: platforms.map((platform) => ({ platform, caption: `${name} turns a campaign brief into strategy, copy, creative, publishing plans, analytics, and learning insights.`, hashtags: ["#MarketingOS", "#AIMarketing", "#Hackathon"] })),
      adCopy: platforms.map((platform) => ({ platform, primaryText: "Plan, create, publish, analyze, and improve campaigns with specialized AI agents.", headline: "Your AI-powered marketing team", description: "One dashboard for the full agency workflow.", cta: "Create Your First Campaign" })),
      landingPageCopy: {
        headline: "Your AI-powered marketing team in one dashboard.",
        subheadline: "MarketingOS AI helps businesses plan, create, publish, analyze, and improve campaigns using specialized AI agents.",
        bullets: ["Brand and competitor intelligence", "Campaign strategy and copywriting", "Creative generation and learning insights"],
        cta: "Create Your First Campaign",
      },
    },
    creativeGeneration: {
      concept: "Premium SaaS dashboard showing an AI campaign pipeline moving from brief to launch.",
      visualDirection: "Clean dark SaaS interface, clear agent stepper, polished commercial visuals, strong hierarchy.",
      imagePrompt: `Professional advertising poster for ${name}, showing an AI marketing dashboard and bold text: MarketingOS AI.`,
      imageNegativePrompt: "watermark, garbled text, distorted interface, cluttered background",
      videoPrompt: `A smooth 5 second vertical product reel showing ${name} moving through AI agents: brand, competitor, strategy, copy, creative, publishing, analytics.`,
      aspectRatio: "9:16",
      duration: 5,
      shotList: ["Open on campaign brief", "Agent cards complete in sequence", "Creative and analytics panels appear", "End on Create Your First Campaign CTA"],
    },
    publishing: {
      summary: "Publish the strongest demo assets in a short sequence, with human approval before each post.",
      posts: platforms.map((platform, index) => ({ platform, format: index === 0 ? "Reel" : "Carousel", scheduledFor: new Date(Date.now() + (index + 1) * 86400000).toISOString(), captionRef: `caption-${index + 1}`, assetType: index === 0 ? "VIDEO" : "IMAGE", status: "Needs approval" })),
      approvalChecklist: ["Claims are accurate", "Generated/mock labels are clear", "CTA points to campaign creation"],
      tracking: { utmSource: "demo", utmCampaign: name.toLowerCase().replace(/\s+/g, "-"), primaryKpi: "campaign_created" },
    },
    analytics: {
      summary: "Demo analytics show healthy engagement and clear next optimization steps.",
      metricReadout: [
        { metric: "Reach", value: "42,000", interpretation: "Strong awareness for a lightweight launch." },
        { metric: "CTR", value: "2.7%", interpretation: "Message is clear enough to earn clicks." },
        { metric: "ROAS", value: "2.8x", interpretation: "The campaign can justify a scaled test." },
      ],
      insights: ["Short-form product workflow content outperformed generic feature copy.", "Posts with clear agent names drove more saves."],
      recommendations: ["Lead with the workflow visual", "Retarget demo viewers with the campaign creation CTA"],
    },
    learning: {
      summary: "Future campaigns should keep the end-to-end workflow visible and make the human approval gate explicit.",
      wins: ["Clear campaign pipeline story", "Fast mock-backed demo execution"],
      losses: ["Provider setup can distract during live demos"],
      recommendations: ["Use demo mode for judging", "Switch to live providers only for final proof clips"],
      futureExperiments: ["Compare founder-led reel vs. dashboard walkthrough", "Test LinkedIn carousel against Instagram reel"],
    },
  };

  return outputs[agentKey] || { summary: "Demo output generated without external AI calls." };
}

function extractCampaign(input: unknown) {
  const root = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const campaign = root.campaign && typeof root.campaign === "object" ? root.campaign as Record<string, unknown> : root;
  const platforms = Array.isArray(campaign.platforms) ? campaign.platforms.filter((item): item is string => typeof item === "string") : [];
  return {
    name: typeof campaign.name === "string" && campaign.name.trim() ? campaign.name : "MarketingOS AI Demo",
    platforms,
  };
}
