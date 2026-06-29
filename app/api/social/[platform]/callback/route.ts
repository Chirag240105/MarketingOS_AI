import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { appUrl, verifySocialOAuthState, type SocialOAuthPlatform } from "@/lib/social-oauth";
import { requireWorkspaceMembership } from "@/lib/utils/workspace";

export const runtime = "nodejs";

type TokenResponse = { access_token?: string; refresh_token?: string; expires_in?: number; error?: unknown };
type MetaPermissionsResponse = { data?: Array<{ permission?: string; status?: "granted" | "declined" | string }> };
type MetaAdAccount = { id?: string; name?: string; account_status?: number | string };

function platformFrom(value: string): SocialOAuthPlatform {
  if (value === "instagram" || value === "facebook" || value === "linkedin" || value === "x") return value;
  throw new Error("Unsupported social platform.");
}

async function token(url: string, body: URLSearchParams, headers?: HeadersInit) {
  const response = await fetch(url, { method: "POST", headers, body });
  const data = await response.json().catch(() => ({})) as TokenResponse;
  if (!response.ok || !data.access_token) throw new Error(`OAuth token exchange failed: ${JSON.stringify(data.error) || response.statusText}`);
  return data;
}

async function upsertAccount(input: {
  workspaceId: string;
  platform: "INSTAGRAM" | "FACEBOOK" | "LINKEDIN" | "X";
  accountName: string;
  handle?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  metadata: Record<string, unknown>;
}) {
  const existing = await prisma.socialAccount.findFirst({ where: { workspaceId: input.workspaceId, platform: input.platform } });
  const data = { accountName: input.accountName, handle: input.handle, accessToken: input.accessToken, refreshToken: input.refreshToken, tokenExpiresAt: input.expiresAt, isConnected: true, metadata: input.metadata as never };
  return existing ? prisma.socialAccount.update({ where: { id: existing.id }, data }) : prisma.socialAccount.create({ data: { workspaceId: input.workspaceId, platform: input.platform, ...data } });
}

function normalizeAdAccountId(id: string | undefined) {
  return id?.startsWith("act_") ? id.slice(4) : id;
}

async function completeMeta(platform: "instagram" | "facebook", code: string, redirectUri: string, workspaceId: string) {
  const version = process.env.META_GRAPH_API_VERSION;
  if (!version || !process.env.META_APP_ID || !process.env.META_APP_SECRET) throw new Error("Meta OAuth is not configured.");
  const exchange = new URLSearchParams({ client_id: process.env.META_APP_ID, client_secret: process.env.META_APP_SECRET, redirect_uri: redirectUri, code });
  const access = await token(`https://graph.facebook.com/${version}/oauth/access_token`, exchange);
  const scope = await getMetaGrantedScope(version, access.access_token!);
  const pagesResponse = await fetch(`https://graph.facebook.com/${version}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${encodeURIComponent(access.access_token!)}`);
  const pagesBody = await pagesResponse.json().catch(() => ({})) as { data?: Array<{ id?: string; name?: string; access_token?: string; instagram_business_account?: { id?: string; username?: string } }> };
  if (!pagesResponse.ok) throw new Error(`Meta Page lookup failed: ${JSON.stringify(pagesBody)}`);
  const adAccountsResponse = await fetch(`https://graph.facebook.com/${version}/me/adaccounts?fields=id,name,account_status&access_token=${encodeURIComponent(access.access_token!)}`);
  const adAccountsBody = await adAccountsResponse.json().catch(() => ({})) as { data?: MetaAdAccount[] };
  if (!adAccountsResponse.ok) throw new Error(`Meta ad account lookup failed: ${JSON.stringify(adAccountsBody)}`);
  const adAccounts = (adAccountsBody.data || []).map((account) => ({
    id: normalizeAdAccountId(account.id),
    name: account.name,
    account_status: account.account_status,
  }));
  const adAccountId = normalizeAdAccountId(adAccountsBody.data?.find((account) => Number(account.account_status) === 1)?.id);
  const adAccountMetadata = {
    ...(adAccountId ? { adAccountId } : {}),
    adAccounts,
  };
  const page = platform === "instagram" ? pagesBody.data?.find((item) => item.instagram_business_account?.id) : pagesBody.data?.[0];
  if (!page?.id || !page.access_token) throw new Error(platform === "instagram" ? "No Instagram Business account was found on the authorized Meta Pages." : "No Facebook Page was found for the authorized Meta account.");
  if (platform === "instagram") {
    const instagram = page.instagram_business_account!;
    return upsertAccount({ workspaceId, platform: "INSTAGRAM", accountName: instagram.username || page.name || "Instagram Business", handle: instagram.username ? `@${instagram.username}` : undefined, accessToken: page.access_token, expiresAt: access.expires_in ? new Date(Date.now() + access.expires_in * 1000) : undefined, metadata: { pageId: page.id, instagramBusinessAccountId: instagram.id, ...adAccountMetadata, scope } });
  }
  return upsertAccount({ workspaceId, platform: "FACEBOOK", accountName: page.name || "Facebook Page", accessToken: page.access_token, expiresAt: access.expires_in ? new Date(Date.now() + access.expires_in * 1000) : undefined, metadata: { pageId: page.id, ...adAccountMetadata, scope } });
}

async function getMetaGrantedScope(version: string, accessToken: string) {
  try {
    const response = await fetch(`https://graph.facebook.com/${version}/me/permissions?access_token=${encodeURIComponent(accessToken)}`);
    const body = await response.json().catch(() => ({})) as MetaPermissionsResponse;
    if (!response.ok) return "";
    return (body.data || [])
      .filter((item) => item.status === "granted" && item.permission)
      .map((item) => item.permission)
      .join(",");
  } catch {
    return "";
  }
}

async function completeLinkedIn(code: string, redirectUri: string, workspaceId: string) {
  if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET || !process.env.LINKEDIN_ORGANIZATION_URN) throw new Error("LinkedIn OAuth requires LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, and LINKEDIN_ORGANIZATION_URN.");
  const access = await token("https://www.linkedin.com/oauth/v2/accessToken", new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri, client_id: process.env.LINKEDIN_CLIENT_ID, client_secret: process.env.LINKEDIN_CLIENT_SECRET }));
  const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", { headers: { Authorization: `Bearer ${access.access_token}` } });
  const profile = await profileResponse.json().catch(() => ({})) as { name?: string; email?: string };
  if (!profileResponse.ok) throw new Error(`LinkedIn profile lookup failed: ${JSON.stringify(profile)}`);
  return upsertAccount({ workspaceId, platform: "LINKEDIN", accountName: profile.name || "LinkedIn organization", handle: profile.email, accessToken: access.access_token!, refreshToken: access.refresh_token, expiresAt: access.expires_in ? new Date(Date.now() + access.expires_in * 1000) : undefined, metadata: { organizationUrn: process.env.LINKEDIN_ORGANIZATION_URN } });
}

async function completeX(code: string, redirectUri: string, workspaceId: string, verifier: string | undefined) {
  if (!process.env.X_CLIENT_ID || !verifier) throw new Error("X OAuth could not be verified. Start the connection again.");
  const access = await token("https://api.x.com/2/oauth2/token", new URLSearchParams({ code, grant_type: "authorization_code", client_id: process.env.X_CLIENT_ID, redirect_uri: redirectUri, code_verifier: verifier }));
  const response = await fetch("https://api.x.com/2/users/me", { headers: { Authorization: `Bearer ${access.access_token}` } });
  const profile = await response.json().catch(() => ({})) as { data?: { id?: string; name?: string; username?: string } };
  if (!response.ok || !profile.data?.id) throw new Error(`X profile lookup failed: ${JSON.stringify(profile)}`);
  return upsertAccount({ workspaceId, platform: "X", accountName: profile.data.name || profile.data.username || "X account", handle: profile.data.username ? `@${profile.data.username}` : undefined, accessToken: access.access_token!, refreshToken: access.refresh_token, expiresAt: access.expires_in ? new Date(Date.now() + access.expires_in * 1000) : undefined, metadata: { accountId: profile.data.id } });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ platform: string }> }) {
  try {
    const platform = platformFrom((await params).platform);
    const state = verifySocialOAuthState(request.nextUrl.searchParams.get("state"));
    if (state.platform !== platform) throw new Error("OAuth platform did not match the requested connection.");
    const session = await auth();
    if (!session?.user?.id || session.user.id !== state.userId) throw new Error("Your sign-in session changed while connecting the social account.");
    await requireWorkspaceMembership(state.workspaceId, "ADMIN");
    const code = request.nextUrl.searchParams.get("code");
    if (!code) throw new Error(request.nextUrl.searchParams.get("error_description") || "The provider did not return an authorization code.");
    const redirectUri = `${appUrl()}/api/social/${platform}/callback`;
    if (platform === "instagram" || platform === "facebook") await completeMeta(platform, code, redirectUri, state.workspaceId);
    if (platform === "linkedin") await completeLinkedIn(code, redirectUri, state.workspaceId);
    if (platform === "x") await completeX(code, redirectUri, state.workspaceId, request.cookies.get("marketingos_x_verifier")?.value);
    const response = NextResponse.redirect(new URL(`/${(await prisma.workspace.findUniqueOrThrow({ where: { id: state.workspaceId } })).slug}/social-accounts?connected=${platform}`, request.url));
    response.cookies.delete("marketingos_x_verifier");
    return response;
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Could not complete social OAuth." }, { status: 400 });
  }
}
