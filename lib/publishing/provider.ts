import type { SocialAccount } from "@/lib/generated/prisma/client";

export type PublishPayload = {
  body: string;
  caption?: string | null;
  mediaUrls: string[];
};

export type PublishResult = {
  externalId: string;
  externalUrl: string;
  response: unknown;
};

export interface SocialPublisher {
  publish(account: SocialAccount, payload: PublishPayload): Promise<PublishResult>;
}
