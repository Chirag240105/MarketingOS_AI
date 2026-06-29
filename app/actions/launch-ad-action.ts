"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSafeAbsoluteUrl } from "@/lib/app-url";
import { generateMarketingImage, getImageTypeForPlatform } from "@/lib/ai/image-service";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { publishInstagramAdBundle } from "@/lib/publishing/meta-ads";
import { toReadableErrorMessage } from "@/lib/utils/error-message";
import { requireWorkspaceMembership } from "@/lib/utils/workspace";

const launchAdSchema = z.object({
  postId: z.string().min(1),
  linkUrl: z.string().url(),
  adMessage: z.string().trim().min(1).max(2200),
  dailyBudgetDollars: z.number().min(1),
  campaignName: z.string().trim().min(1).max(120),
});

type LaunchAdInput = z.infer<typeof launchAdSchema>;

function firstString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function parseBrandColors(value: unknown) {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (value && typeof value === "object" && "colors" in value) {
    const colors = (value as { colors?: unknown }).colors;
    if (Array.isArray(colors)) return colors.filter((item): item is string => typeof item === "string");
  }
  return [];
}

function positiveNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  if (value && typeof value === "object" && "toNumber" in value && typeof value.toNumber === "function") {
    const parsed = value.toNumber();
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return undefined;
}

async function getPostContext(postId: string) {
  const post = await prisma.generatedPost.findUnique({
    where: { id: postId },
    include: {
      campaign: {
        include: {
          workspace: {
            include: {
              brandProfile: true,
              socialAccounts: true,
            },
          },
        },
      },
    },
  });
  if (!post) throw new Error("Post not found.");
  await requireWorkspaceMembership(post.campaign.workspaceId, "EDITOR");
  return post;
}

async function generateImageForPost(postId: string) {
  const post = await getPostContext(postId);
  const brandProfile = post.campaign.workspace.brandProfile;
  const imageType = getImageTypeForPlatform(post.platform);
  const imageUrl = await generateMarketingImage({
    prompt: post.caption || post.body,
    type: imageType,
    brandColors: parseBrandColors(brandProfile?.brandColors),
    brandName: brandProfile?.companyName || post.campaign.workspace.name,
    campaignId: post.campaignId,
  });

  await prisma.generatedPost.update({
    where: { id: post.id },
    data: {
      mediaUrls: Array.from(new Set([imageUrl, ...post.mediaUrls])),
      mediaType: "IMAGE",
    },
  });

  revalidatePath(`/${post.campaign.workspace.slug}/approvals`);
  revalidatePath(`/${post.campaign.workspace.slug}/campaigns/${post.campaignId}/posts`);
  return { post, imageUrl, imageType };
}

/**
 * Generates an ad preview image for a generated post and stores the image URL on the post.
 *
 * @param postId GeneratedPost ID.
 * @returns Generated image URL and image type.
 */
export async function generateAdPreviewImage(postId: string) {
  const result = await generateImageForPost(postId);
  return { imageUrl: result.imageUrl, imageType: result.imageType };
}

/**
 * Creates a paused Instagram ad bundle from a generated post.
 *
 * @param input GeneratedPost ID or launch form values containing destination URL, message, budget, and campaign name.
 * @returns Success result with Meta ad ID, or a failure result with an error message.
 */
export async function launchAdFromPost(input: string | LaunchAdInput) {
  try {
    const post = await getPostContext(typeof input === "string" ? input : input.postId);
    const brandProfile = post.campaign.workspace.brandProfile;
    const data = typeof input === "string"
      ? launchAdSchema.parse({
        postId: input,
        linkUrl: getSafeAbsoluteUrl(brandProfile?.website),
        adMessage: post.caption || post.body || "Learn more about this offer.",
        dailyBudgetDollars: positiveNumber(brandProfile?.budget) || 1,
        campaignName: post.campaign.name || post.title || "MarketingOS AI Campaign",
      })
      : launchAdSchema.parse(input);

    const { user, workspace } = await requireWorkspaceMembership(post.campaign.workspaceId, "EDITOR");
    const socialAccount = post.campaign.workspace.socialAccounts.find((account) => (
      (account.platform === "INSTAGRAM" || account.platform === "FACEBOOK") && account.isConnected && account.accessToken
    ));
    if (!socialAccount?.accessToken) throw new Error("Connect an Instagram or Facebook account before launching an ad.");

    const metadata = (socialAccount.metadata || {}) as Record<string, unknown>;
    const instagramAccountId = firstString(metadata.instagramBusinessAccountId);
    const pageId = firstString(metadata.pageId) || process.env.META_PAGE_ID;
    const metadataAdAccountId = firstString(metadata.adAccountId);
    if (!metadataAdAccountId && Array.isArray(metadata.adAccounts)) {
      throw new Error("Connect a Meta account that has an ad account, or ask the account owner to create one.");
    }
    const adAccountId = metadataAdAccountId || process.env.META_AD_ACCOUNT_ID;
    if (!instagramAccountId) throw new Error("The connected Meta account is missing an Instagram Business account ID.");
    if (!pageId) throw new Error("META_PAGE_ID is required for Instagram ad publishing.");
    if (!adAccountId) throw new Error("Connect a Meta account that has an ad account, or ask the account owner to create one.");

    const imageUrl = post.mediaUrls[0] || (await generateImageForPost(post.id)).imageUrl;
    const dailyBudgetCents = Math.round(data.dailyBudgetDollars * 100);
    const bundle = await publishInstagramAdBundle({
      accessToken: socialAccount.accessToken,
      adAccountId,
      instagramAccountId,
      pageId,
      imageUrl,
      linkUrl: data.linkUrl,
      adMessage: data.adMessage,
      campaignName: data.campaignName,
      dailyBudgetCents,
    });

    await prisma.generatedPost.update({
      where: { id: post.id },
      data: {
        mediaUrls: Array.from(new Set([imageUrl, ...post.mediaUrls])),
        mediaType: "IMAGE",
        adCampaignId: bundle.campaignId,
        adSetId: bundle.adSetId,
        adCreativeId: bundle.creativeId,
        adId: bundle.adId,
        adStatus: "LIVE",
      },
    });
    await writeAuditLog({
      action: "PUBLISH",
      entityType: "meta_ad",
      entityId: bundle.adId,
      userId: user.id,
      workspaceId: workspace.id,
      details: { postId: post.id, campaignId: bundle.campaignId, status: "PAUSED" },
    });
    revalidatePath(`/${workspace.slug}/approvals`);
    revalidatePath(`/${workspace.slug}/campaigns/${post.campaignId}/posts`);
    return { success: true, adId: bundle.adId };
  } catch (error) {
    return { success: false, error: toReadableErrorMessage(error) || "Could not launch ad." };
  }
}
