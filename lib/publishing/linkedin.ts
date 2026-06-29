import type { SocialAccount } from "@/lib/generated/prisma/client";
import type { PublishPayload, PublishResult, SocialPublisher } from "./provider";

export const linkedInPublisher: SocialPublisher = {
  async publish(account: SocialAccount, payload: PublishPayload): Promise<PublishResult> {
    const version = process.env.LINKEDIN_API_VERSION;
    if (!version || !account.accessToken) throw new Error("LinkedIn publishing is not configured for this account.");
    const metadata = (account.metadata || {}) as Record<string, unknown>;
    const author = typeof metadata.organizationUrn === "string" ? metadata.organizationUrn : undefined;
    if (!author) throw new Error("LinkedIn publishing requires a connected organization page.");
    const imageUrn = payload.mediaUrls[0] ? await uploadLinkedInImage(account.accessToken, version, author, payload.mediaUrls[0]) : undefined;
    const response = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
        "Content-Type": "application/json",
        "Linkedin-Version": version,
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author,
        commentary: payload.caption || payload.body,
        visibility: "PUBLIC",
        distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
        ...(imageUrn ? { content: { media: { id: imageUrn } } } : {}),
      }),
    });
    const body = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) throw new Error(`LinkedIn API: ${JSON.stringify(body) || response.statusText}`);
    const externalId = response.headers.get("x-restli-id") || String(body.id || "");
    if (!externalId) throw new Error("LinkedIn did not return a post ID.");
    return { externalId, externalUrl: `https://www.linkedin.com/feed/update/${externalId}`, response: body };
  },
};

async function uploadLinkedInImage(accessToken: string, version: string, owner: string, imageUrl: string) {
  const initialize = await fetch("https://api.linkedin.com/rest/images?action=initializeUpload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Linkedin-Version": version,
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({ initializeUploadRequest: { owner } }),
  });
  const initBody = await initialize.json().catch(() => ({})) as { value?: { uploadUrl?: string; image?: string }; message?: string };
  if (!initialize.ok || !initBody.value?.uploadUrl || !initBody.value.image) throw new Error(`LinkedIn image upload init failed: ${initBody.message || initialize.statusText}`);

  const image = await fetch(imageUrl);
  if (!image.ok) throw new Error("Could not fetch generated image for LinkedIn upload.");
  const upload = await fetch(initBody.value.uploadUrl, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": image.headers.get("content-type") || "image/png" },
    body: await image.arrayBuffer(),
  });
  if (!upload.ok) throw new Error(`LinkedIn image upload failed: ${upload.statusText}`);
  return initBody.value.image;
}
