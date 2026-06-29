import type { SocialAccount } from "@/lib/generated/prisma/client";
import type { PublishPayload, PublishResult, SocialPublisher } from "./provider";

export const metaPublisher: SocialPublisher = {
  async publish(account: SocialAccount, payload: PublishPayload): Promise<PublishResult> {
    const version = process.env.META_GRAPH_API_VERSION;
    if (!version || !account.accessToken) throw new Error("Meta publishing is not configured for this account.");
    const metadata = (account.metadata || {}) as Record<string, unknown>;
    const graph = `https://graph.facebook.com/${version}`;
    const request = async (path: string, body: URLSearchParams) => {
      body.set("access_token", account.accessToken!);
      const response = await fetch(`${graph}/${path}`, { method: "POST", body });
      const json = await response.json() as Record<string, unknown>;
      if (!response.ok) throw new Error(`Meta API: ${String(json.error instanceof Object ? JSON.stringify(json.error) : json.error || response.statusText)}`);
      return json;
    };

    if (account.platform === "INSTAGRAM") {
      const instagramAccountId = typeof metadata.instagramBusinessAccountId === "string" ? metadata.instagramBusinessAccountId : undefined;
      const imageUrl = payload.mediaUrls[0];
      if (!instagramAccountId || !imageUrl) throw new Error("Instagram publishing requires an Instagram Business account and a public image URL.");
      const container = await request(`${instagramAccountId}/media`, new URLSearchParams({ image_url: imageUrl, caption: payload.caption || payload.body }));
      const creationId = String(container.id || "");
      if (!creationId) throw new Error("Meta did not return an Instagram media container ID.");
      const published = await request(`${instagramAccountId}/media_publish`, new URLSearchParams({ creation_id: creationId }));
      const externalId = String(published.id || "");
      if (!externalId) throw new Error("Meta did not return an Instagram post ID.");
      return { externalId, externalUrl: `https://www.instagram.com/p/${externalId}/`, response: { container, published } };
    }

    const pageId = typeof metadata.pageId === "string" ? metadata.pageId : undefined;
    if (!pageId) throw new Error("Facebook publishing requires a connected Page.");
    const published = await request(`${pageId}/feed`, new URLSearchParams({ message: payload.caption || payload.body }));
    const externalId = String(published.id || "");
    if (!externalId) throw new Error("Meta did not return a Facebook post ID.");
    return { externalId, externalUrl: `https://www.facebook.com/${externalId}`, response: published };
  },
};
