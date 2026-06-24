import type { PublishPayload, PublishResult, SocialPublisher } from "./provider";

export const linkedInPublisher: SocialPublisher = {
  async publish(_platform: "LINKEDIN", _accountName: string, _payload: PublishPayload): Promise<PublishResult> {
    // TODO: Implement LinkedIn OAuth and the UGC Posts API.
    throw new Error("LinkedIn publishing is not configured. Use a mock social account for this MVP.");
  },
};
