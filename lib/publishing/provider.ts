import type { SocialPlatform } from "@/lib/generated/prisma/client";

export type PublishPayload = {
  body: string;
  caption?: string | null;
  mediaUrls: string[];
};

export type PublishResult = {
  externalId: string;
  externalUrl: string;
};

export interface SocialPublisher {
  publish(platform: SocialPlatform, accountName: string, payload: PublishPayload): Promise<PublishResult>;
}

export const mockPublisher: SocialPublisher = {
  async publish(platform, accountName) {
    await new Promise((resolve) => setTimeout(resolve, 120));
    const externalId = platform.toLowerCase() + "_" + crypto.randomUUID().slice(0, 12);
    return {
      externalId,
      externalUrl: "https://social.example.com/" + accountName + "/posts/" + externalId,
    };
  },
};
