import type { PublishPayload, PublishResult, SocialPublisher } from "./provider";

export const metaPublisher: SocialPublisher = {
  async publish(_platform: "INSTAGRAM" | "FACEBOOK", _accountName: string, _payload: PublishPayload): Promise<PublishResult> {
    // TODO: Exchange the stored OAuth token and call the Meta Graph API here.
    throw new Error("Meta publishing is not configured. Use a mock social account for this MVP.");
  },
};
