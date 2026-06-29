import { createHmac, timingSafeEqual } from "crypto";
import { getAppUrl } from "@/lib/app-url";

export type SocialOAuthPlatform = "instagram" | "facebook" | "linkedin" | "x";

type State = { workspaceId: string; userId: string; platform: SocialOAuthPlatform; issuedAt: number };

function secret() {
  if (!process.env.AUTH_SECRET) throw new Error("AUTH_SECRET is required for social OAuth.");
  return process.env.AUTH_SECRET;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function createSocialOAuthState(state: Omit<State, "issuedAt">) {
  const payload = Buffer.from(JSON.stringify({ ...state, issuedAt: Date.now() })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySocialOAuthState(value: string | null): State {
  if (!value) throw new Error("Missing OAuth state.");
  const [payload, signature] = value.split(".");
  if (!payload || !signature) throw new Error("Invalid OAuth state.");
  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) throw new Error("Invalid OAuth state signature.");
  const state = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as State;
  if (Date.now() - state.issuedAt > 10 * 60_000) throw new Error("OAuth state has expired.");
  return state;
}

export function appUrl() {
  return getAppUrl();
}
