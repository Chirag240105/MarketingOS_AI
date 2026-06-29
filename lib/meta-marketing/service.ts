import { prisma } from "@/lib/db";
import { getSafeAbsoluteUrl } from "@/lib/app-url";
import type { GeneratedPost, SocialAccount } from "@/lib/generated/prisma/client";

type MetaStatus = "ACTIVE" | "PAUSED" | "DELETED";

type MetaAccountContext = {
  account: SocialAccount;
  adAccountId: string;
  pageId?: string;
};

async function graphRequest<T>(path: string, token: string, body?: Record<string, string | number | boolean | undefined>) {
  const version = process.env.META_GRAPH_API_VERSION;
  if (!version) throw new Error("META_GRAPH_API_VERSION is not configured.");

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(body || {})) {
    if (value !== undefined) params.set(key, String(value));
  }
  params.set("access_token", token);

  const response = await fetch(`https://graph.facebook.com/${version}/${path}`, {
    method: body ? "POST" : "GET",
    body: body ? params : undefined,
  });
  const json = await response.json().catch(() => ({})) as T & { error?: unknown };
  if (!response.ok) throw new Error(`Meta Marketing API error: ${JSON.stringify(json.error || json)}`);
  return json;
}

function getMetaContext(accounts: SocialAccount[]): MetaAccountContext {
  const account = accounts.find((item) => item.platform === "FACEBOOK" && item.isConnected && item.accessToken) || accounts.find((item) => item.platform === "INSTAGRAM" && item.isConnected && item.accessToken);
  if (!account?.accessToken) throw new Error("Connect a Meta account before launching campaigns.");
  const metadata = (account.metadata || {}) as Record<string, unknown>;
  const adAccountId = String(metadata.adAccountId || process.env.META_AD_ACCOUNT_ID || "");
  if (!adAccountId) throw new Error("Meta ad account ID is missing. Set META_AD_ACCOUNT_ID or store adAccountId in the connected account metadata.");
  return {
    account,
    adAccountId: adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`,
    pageId: typeof metadata.pageId === "string" ? metadata.pageId : process.env.META_PAGE_ID,
  };
}

function mapObjective(goal: string) {
  const objectives: Record<string, string> = {
    BRAND_AWARENESS: "OUTCOME_AWARENESS",
    LEAD_GENERATION: "OUTCOME_LEADS",
    SALES_CONVERSION: "OUTCOME_SALES",
    ENGAGEMENT: "OUTCOME_ENGAGEMENT",
    TRAFFIC: "OUTCOME_TRAFFIC",
    VIDEO_VIEWS: "OUTCOME_ENGAGEMENT",
    RETARGETING: "OUTCOME_SALES",
  };
  return objectives[goal] || "OUTCOME_TRAFFIC";
}

export async function createMetaCampaign(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { workspace: { include: { socialAccounts: true } } },
  });
  if (!campaign) throw new Error("Campaign not found.");
  const context = getMetaContext(campaign.workspace.socialAccounts);
  const response = await graphRequest<{ id?: string }>(`${context.adAccountId}/campaigns`, context.account.accessToken!, {
    name: campaign.name,
    objective: mapObjective(campaign.goal),
    status: "PAUSED",
    special_ad_categories: "[]",
  });
  const externalId = response.id;
  if (!externalId) throw new Error("Meta did not return a campaign ID.");
  return prisma.metaCampaign.upsert({
    where: { campaignId: campaign.id },
    update: { externalId, objective: mapObjective(campaign.goal), status: "PAUSED", rawResponse: response as never },
    create: {
      campaignId: campaign.id,
      workspaceId: campaign.workspaceId,
      externalId,
      objective: mapObjective(campaign.goal),
      status: "PAUSED",
      budget: campaign.budget,
      rawResponse: response as never,
    },
  });
}

export async function createMetaAdSet(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { workspace: { include: { socialAccounts: true } }, metaCampaign: true },
  });
  if (!campaign) throw new Error("Campaign not found.");
  const metaCampaign = campaign.metaCampaign || await createMetaCampaign(campaign.id);
  if (!metaCampaign.externalId) throw new Error("Meta campaign ID is missing.");
  const context = getMetaContext(campaign.workspace.socialAccounts);
  const response = await graphRequest<{ id?: string }>(`${context.adAccountId}/adsets`, context.account.accessToken!, {
    name: `${campaign.name} Ad Set`,
    campaign_id: metaCampaign.externalId,
    billing_event: "IMPRESSIONS",
    optimization_goal: "LINK_CLICKS",
    daily_budget: campaign.budget ? Math.max(100, Math.round(Number(campaign.budget) * 100)) : undefined,
    status: "PAUSED",
    targeting: JSON.stringify({ geo_locations: { countries: ["IN"] }, age_min: 18, age_max: 45 }),
  });
  const externalId = response.id;
  if (!externalId) throw new Error("Meta did not return an ad set ID.");
  return prisma.metaAdSet.create({
    data: {
      metaCampaignId: metaCampaign.id,
      externalId,
      name: `${campaign.name} Ad Set`,
      status: "PAUSED",
      dailyBudget: campaign.budget,
      targeting: { geo_locations: { countries: ["IN"] }, age_min: 18, age_max: 45 },
      rawResponse: response as never,
    },
  });
}

export async function createMetaAd(campaignId: string, post?: GeneratedPost) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { workspace: { include: { socialAccounts: true } }, metaCampaign: { include: { adSets: true } }, generatedPosts: true },
  });
  if (!campaign) throw new Error("Campaign not found.");
  const metaCampaign = campaign.metaCampaign || await createMetaCampaign(campaign.id);
  const adSet = campaign.metaCampaign?.adSets[0] || await createMetaAdSet(campaign.id);
  const selectedPost = post || campaign.generatedPosts[0];
  if (!selectedPost) throw new Error("Generate campaign copy before creating a Meta ad.");
  const context = getMetaContext(campaign.workspace.socialAccounts);
  if (!context.pageId) throw new Error("Meta Page ID is missing. Store pageId in account metadata or set META_PAGE_ID.");
  const destinationUrl = getSafeAbsoluteUrl(process.env.META_DEFAULT_DESTINATION_URL);

  const creative = await graphRequest<{ id?: string }>(`${context.adAccountId}/adcreatives`, context.account.accessToken!, {
    name: `${campaign.name} Creative`,
    object_story_spec: JSON.stringify({
      page_id: context.pageId,
      link_data: {
        message: selectedPost.caption || selectedPost.body,
        name: selectedPost.title || campaign.name,
        description: selectedPost.body,
        link: destinationUrl,
        call_to_action: { type: "LEARN_MORE", value: { link: destinationUrl } },
      },
    }),
  });
  if (!creative.id) throw new Error("Meta did not return a creative ID.");

  const response = await graphRequest<{ id?: string }>(`${context.adAccountId}/ads`, context.account.accessToken!, {
    name: `${campaign.name} Ad`,
    adset_id: adSet.externalId || undefined,
    creative: JSON.stringify({ creative_id: creative.id }),
    status: "PAUSED",
  });
  if (!response.id) throw new Error("Meta did not return an ad ID.");
  return prisma.metaAd.create({
    data: {
      metaCampaignId: metaCampaign.id,
      metaAdSetId: adSet.id,
      generatedPostId: selectedPost.id,
      externalId: response.id,
      creativeId: creative.id,
      name: `${campaign.name} Ad`,
      status: "PAUSED",
      rawResponse: { creative, ad: response } as never,
    },
  });
}

export async function setMetaCampaignStatus(campaignId: string, status: MetaStatus) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { workspace: { include: { socialAccounts: true } }, metaCampaign: true },
  });
  if (!campaign?.metaCampaign?.externalId) throw new Error("Create a Meta campaign before changing its status.");
  const context = getMetaContext(campaign.workspace.socialAccounts);
  const response = await graphRequest<{ success?: boolean }>(campaign.metaCampaign.externalId, context.account.accessToken!, { status });
  return prisma.metaCampaign.update({
    where: { id: campaign.metaCampaign.id },
    data: { status, rawResponse: response as never },
  });
}
