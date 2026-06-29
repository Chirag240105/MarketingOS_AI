import { createHash, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { appUrl, createSocialOAuthState, type SocialOAuthPlatform } from "@/lib/social-oauth";
import { requireWorkspaceMembership } from "@/lib/utils/workspace";

export const runtime = "nodejs";

function platformFrom(value: string): SocialOAuthPlatform {
  if (value === "instagram" || value === "facebook" || value === "linkedin" || value === "x") return value;
  throw new Error("Unsupported social platform.");
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ platform: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.redirect(new URL("/login", request.url));
    const platform = platformFrom((await params).platform);
    const workspaceId = request.nextUrl.searchParams.get("workspaceId");
    if (!workspaceId) throw new Error("workspaceId is required.");
    await requireWorkspaceMembership(workspaceId, "ADMIN");
    const state = createSocialOAuthState({ workspaceId, userId: session.user.id, platform });
    const redirectUri = `${appUrl()}/api/social/${platform}/callback`;
    const url = new URL(platform === "linkedin" ? "https://www.linkedin.com/oauth/v2/authorization" : platform === "x" ? "https://twitter.com/i/oauth2/authorize" : `https://www.facebook.com/${process.env.META_GRAPH_API_VERSION || "v23.0"}/dialog/oauth`);
    let verifier: string | undefined;
    if (platform === "linkedin") {
      if (!process.env.LINKEDIN_CLIENT_ID) throw new Error("LINKEDIN_CLIENT_ID is not configured.");
      url.search = new URLSearchParams({ response_type: "code", client_id: process.env.LINKEDIN_CLIENT_ID, redirect_uri: redirectUri, state, scope: "openid profile email w_member_social rw_organization_admin r_organization_social" }).toString();
    } else if (platform === "x") {
      if (!process.env.X_CLIENT_ID) throw new Error("X_CLIENT_ID is not configured.");
      verifier = randomBytes(32).toString("base64url");
      const challenge = createHash("sha256").update(verifier).digest("base64url");
      url.search = new URLSearchParams({ response_type: "code", client_id: process.env.X_CLIENT_ID, redirect_uri: redirectUri, state, scope: "tweet.read tweet.write users.read offline.access", code_challenge: challenge, code_challenge_method: "S256" }).toString();
    } else {
      if (!process.env.META_APP_ID || !process.env.META_GRAPH_API_VERSION) throw new Error("META_APP_ID and META_GRAPH_API_VERSION are required.");
      const adScopes = "ads_management,ads_read,business_management";
      const scope = platform === "instagram"
        ? `pages_show_list,pages_read_engagement,instagram_basic,instagram_content_publish,instagram_manage_insights,${adScopes}`
        : `pages_show_list,pages_read_engagement,pages_manage_posts,read_insights,${adScopes}`;
      url.search = new URLSearchParams({ client_id: process.env.META_APP_ID, redirect_uri: redirectUri, state, response_type: "code", scope }).toString();
    }
    const response = NextResponse.redirect(url);
    if (verifier) response.cookies.set("marketingos_x_verifier", verifier, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 600, path: "/" });
    return response;
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Could not start social OAuth." }, { status: 400 });
  }
}
