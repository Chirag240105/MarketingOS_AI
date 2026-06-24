import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadAsset } from "@/lib/storage/upload";
import { requireWorkspaceMembership } from "@/lib/utils/workspace";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const formData = await request.formData();
    const file = formData.get("file");
    const workspaceId = formData.get("workspaceId");
    if (!(file instanceof File) || typeof workspaceId !== "string") {
      return NextResponse.json({ ok: false, error: "file and workspaceId are required" }, { status: 400 });
    }
    await requireWorkspaceMembership(workspaceId, "EDITOR");
    return NextResponse.json({ ok: true, data: await uploadAsset(file, workspaceId) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Upload failed" }, { status: 400 });
  }
}
