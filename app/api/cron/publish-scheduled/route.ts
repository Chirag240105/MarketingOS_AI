import { NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/env";
import { publishDuePosts } from "@/lib/publishing/service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = requireCronSecret();
  if (request.headers.get("authorization") !== "Bearer " + secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, data: await publishDuePosts() });
}
