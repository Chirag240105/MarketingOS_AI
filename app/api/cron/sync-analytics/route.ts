import { NextResponse } from "next/server";
import { syncAnalytics } from "@/lib/analytics";
import { requireCronSecret } from "@/lib/env";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = requireCronSecret();
  if (request.headers.get("authorization") !== "Bearer " + secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, data: await syncAnalytics() });
}
