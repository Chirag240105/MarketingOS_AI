import { NextResponse } from "next/server";
import { generateCampaign } from "@/lib/ai/orchestrator";
import { writeAuditLog } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { campaignGenerationSchema } from "@/lib/validations/campaign";
import { requireWorkspaceMembership } from "@/lib/utils/workspace";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = campaignGenerationSchema.parse(await request.json());
    const campaign = await prisma.campaign.findUnique({ where: { id: body.campaignId } });
    if (!campaign) return NextResponse.json({ ok: false, error: "Campaign not found" }, { status: 404 });

    await requireWorkspaceMembership(campaign.workspaceId, "EDITOR");
    const result = await generateCampaign(campaign.id, session.user.id);
    await writeAuditLog({
      action: "AI_GENERATE",
      entityType: "campaign",
      entityId: campaign.id,
      userId: session.user.id,
      workspaceId: campaign.workspaceId,
      details: { status: result.status } as never,
    });

    return NextResponse.json({
      ok: true,
      data: result,
      warning: result.warning,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Generation failed" }, { status: 400 });
  }
}
