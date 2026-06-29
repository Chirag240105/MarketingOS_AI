import { toReadableErrorMessage } from "@/lib/utils/error-message";

type GraphIdResponse = {
  id?: string;
  error?: unknown;
};

type CreateInstagramAdCreativeParams = {
  accessToken: string;
  adAccountId: string;
  instagramAccountId: string;
  pageId: string;
  imageUrl: string;
  linkUrl: string;
  message: string;
  name?: string;
};

type CreateMetaCampaignParams = {
  accessToken: string;
  adAccountId: string;
  name: string;
  objective?: string;
  status?: "ACTIVE" | "PAUSED";
};

type CreateMetaAdSetParams = {
  accessToken: string;
  adAccountId: string;
  name: string;
  campaignId: string;
  dailyBudgetCents: number;
  status?: "ACTIVE" | "PAUSED";
};

type CreateMetaAdParams = {
  accessToken: string;
  adAccountId: string;
  name: string;
  adSetId: string;
  creativeId: string;
  status?: "ACTIVE" | "PAUSED";
};

type PublishInstagramAdBundleParams = {
  accessToken: string;
  adAccountId: string;
  instagramAccountId: string;
  pageId: string;
  imageUrl: string;
  linkUrl: string;
  adMessage: string;
  campaignName: string;
  dailyBudgetCents: number;
};

const graphVersion = "v20.0";

function normalizeAdAccountId(adAccountId: string) {
  return adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
}

async function graphPost(path: string, body: URLSearchParams, context: string) {
  try {
    const response = await fetch(`https://graph.facebook.com/${graphVersion}/${path}`, {
      method: "POST",
      body,
    });
    const payload = await response.json().catch(() => ({})) as GraphIdResponse;
    if (!response.ok || !payload.id) {
      throw new Error(toReadableErrorMessage(payload.error || payload) || response.statusText);
    }
    return payload.id;
  } catch (error) {
    throw new Error(toReadableErrorMessage(error) || `${context} failed`);
  }
}

/**
 * Creates an Instagram ad creative in Meta Ads Manager.
 *
 * @param params Access token, ad account, Instagram actor, Page, image URL, click URL, and message.
 * @returns Meta ad creative ID.
 */
export async function createInstagramAdCreative(params: CreateInstagramAdCreativeParams) {
  const adAccountId = normalizeAdAccountId(params.adAccountId);
  const body = new URLSearchParams({
    access_token: params.accessToken,
    name: params.name || `${params.instagramAccountId} creative`,
    object_story_spec: JSON.stringify({
      instagram_actor_id: params.instagramAccountId,
      page_id: params.pageId,
      link_data: {
        image_url: params.imageUrl,
        link: params.linkUrl,
        message: params.message,
      },
    }),
  });
  return graphPost(`${adAccountId}/adcreatives`, body, "Create Instagram ad creative");
}

/**
 * Creates a paused Meta campaign for ad publishing.
 *
 * @param params Access token, ad account, campaign name, optional objective, and status.
 * @returns Meta campaign ID.
 */
export async function createMetaCampaign(params: CreateMetaCampaignParams) {
  const adAccountId = normalizeAdAccountId(params.adAccountId);
  const body = new URLSearchParams({
    access_token: params.accessToken,
    name: params.name,
    objective: params.objective || "OUTCOME_TRAFFIC",
    status: params.status || "PAUSED",
    special_ad_categories: JSON.stringify([]),
  });
  return graphPost(`${adAccountId}/campaigns`, body, "Create Meta campaign");
}

/**
 * Creates a paused Meta ad set with a daily budget in cents.
 *
 * @param params Access token, ad account, campaign ID, daily budget in cents, and optional status.
 * @returns Meta ad set ID.
 */
export async function createMetaAdSet(params: CreateMetaAdSetParams) {
  const adAccountId = normalizeAdAccountId(params.adAccountId);
  const body = new URLSearchParams({
    access_token: params.accessToken,
    name: params.name,
    campaign_id: params.campaignId,
    daily_budget: String(params.dailyBudgetCents),
    billing_event: "IMPRESSIONS",
    optimization_goal: "REACH",
    targeting: JSON.stringify({ geo_locations: { countries: ["US"] } }),
    status: params.status || "PAUSED",
  });
  return graphPost(`${adAccountId}/adsets`, body, "Create Meta ad set");
}

/**
 * Creates a paused Meta ad from an existing ad set and creative.
 *
 * @param params Access token, ad account, ad set ID, creative ID, name, and optional status.
 * @returns Meta ad ID.
 */
export async function createMetaAd(params: CreateMetaAdParams) {
  const adAccountId = normalizeAdAccountId(params.adAccountId);
  const body = new URLSearchParams({
    access_token: params.accessToken,
    name: params.name,
    adset_id: params.adSetId,
    creative: JSON.stringify({ creative_id: params.creativeId }),
    status: params.status || "PAUSED",
  });
  return graphPost(`${adAccountId}/ads`, body, "Create Meta ad");
}

/**
 * Publishes a complete paused Instagram ad bundle in Meta Ads Manager.
 *
 * @param params Access token, ad/page/account IDs, image URL, destination URL, ad copy, campaign name, and daily budget in cents.
 * @returns Created campaign, ad set, creative, and ad IDs.
 */
export async function publishInstagramAdBundle(params: PublishInstagramAdBundleParams) {
  try {
    const campaignId = await createMetaCampaign({
      accessToken: params.accessToken,
      adAccountId: params.adAccountId,
      name: params.campaignName,
      status: "PAUSED",
    });
    const adSetId = await createMetaAdSet({
      accessToken: params.accessToken,
      adAccountId: params.adAccountId,
      name: `${params.campaignName} Ad Set`,
      campaignId,
      dailyBudgetCents: params.dailyBudgetCents,
      status: "PAUSED",
    });
    const creativeId = await createInstagramAdCreative({
      accessToken: params.accessToken,
      adAccountId: params.adAccountId,
      instagramAccountId: params.instagramAccountId,
      pageId: params.pageId,
      imageUrl: params.imageUrl,
      linkUrl: params.linkUrl,
      message: params.adMessage,
      name: `${params.campaignName} Creative`,
    });
    const adId = await createMetaAd({
      accessToken: params.accessToken,
      adAccountId: params.adAccountId,
      name: `${params.campaignName} Ad`,
      adSetId,
      creativeId,
      status: "PAUSED",
    });
    return { campaignId, adSetId, creativeId, adId };
  } catch (error) {
    const message = toReadableErrorMessage(error);
    console.error("Meta Instagram ad bundle creation failed.", {
      error: message,
      adAccountId: params.adAccountId,
      campaignName: params.campaignName,
    });
    throw new Error(message);
  }
}
