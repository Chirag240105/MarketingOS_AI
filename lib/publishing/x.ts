import type { PublishPayload, PublishResult, SocialPublisher } from "./provider";

export const xPublisher: SocialPublisher = {
  async publish(_platform: "X", _accountName: string, _payload: PublishPayload): Promise<PublishResult> {
    // TODO: Implement OAuth 2.0 PKCE and the X create-post endpoint.
    throw new Error("X publishing is not configured. Use a mock social account for this MVP.");
  },
};
