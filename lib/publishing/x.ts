import type { SocialAccount } from "@/lib/generated/prisma/client";
import type { PublishPayload, PublishResult, SocialPublisher } from "./provider";

export const xPublisher: SocialPublisher = {
  async publish(account: SocialAccount, payload: PublishPayload): Promise<PublishResult> {
    if (!account.accessToken) throw new Error("X publishing is not configured for this account.");
    const mediaIds = payload.mediaUrls.length ? await uploadXMedia(account.accessToken, payload.mediaUrls) : [];
    const response = await fetch("https://api.x.com/2/tweets", {
      method: "POST",
      headers: { Authorization: `Bearer ${account.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text: payload.caption || payload.body, ...(mediaIds.length ? { media: { media_ids: mediaIds } } : {}) }),
    });
    const body = await response.json().catch(() => ({})) as { data?: { id?: string }; [key: string]: unknown };
    if (!response.ok) throw new Error(`X API: ${JSON.stringify(body) || response.statusText}`);
    const externalId = body.data?.id;
    if (!externalId) throw new Error("X did not return a post ID.");
    const handle = account.handle?.replace(/^@/, "") || "i";
    return { externalId, externalUrl: `https://x.com/${handle}/status/${externalId}`, response: body };
  },
};

async function uploadXMedia(accessToken: string, mediaUrls: string[]) {
  const ids: string[] = [];
  for (const mediaUrl of mediaUrls.slice(0, 4)) {
    const media = await fetch(mediaUrl);
    if (!media.ok) throw new Error("Could not fetch generated media for X upload.");
    const bytes = Buffer.from(await media.arrayBuffer());
    const body = new URLSearchParams({
      media_data: bytes.toString("base64"),
    });
    const response = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const json = await response.json().catch(() => ({})) as { media_id_string?: string; errors?: unknown };
    if (!response.ok || !json.media_id_string) throw new Error(`X media upload failed: ${JSON.stringify(json.errors || json)}`);
    ids.push(json.media_id_string);
  }
  return ids;
}
