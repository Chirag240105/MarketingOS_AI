import { NextResponse } from 'next/server';
import { runCampaignPipeline } from '@/lib/ai/marketing-os/pipeline';
import { prisma } from '@/lib/db';

export async function GET() {
  const campaignId = "cmqwa4uy000000sufov132rj7"; // "Sweet Moments Birthday Celebration Campaign"
  
  try {
    // Reset campaign status back to DRAFT or BRAND_ANALYZED so we can re-run it
    // Wait, the pipeline has `getOrRunBrandAnalysis` which retrieves existing brand analysis if already present.
    // If we want to clean up/re-run from scratch, we should delete existing agent runs/analyses.
    // Let's delete existing brandAnalysis, competitorAnalysis, campaignStrategy, campaignCopy, creativeBrief, publishingPlan, generatedAssets, and agentRuns for this campaign so it runs fresh!
    
    await prisma.brandAnalysis.deleteMany({ where: { campaignId } });
    await prisma.competitorAnalysis.deleteMany({ where: { campaignId } });
    await prisma.campaignStrategy.deleteMany({ where: { campaignId } });
    await prisma.campaignCopy.deleteMany({ where: { campaignId } });
    await prisma.creativeBrief.deleteMany({ where: { campaignId } });
    await prisma.publishingPlan.deleteMany({ where: { campaignId } });
    await prisma.generatedAsset.deleteMany({ where: { campaignId } });
    await prisma.agentRun.deleteMany({ where: { campaignId } });
    
    // Set status to DRAFT
    await prisma.campaign.update({ where: { id: campaignId }, data: { status: "DRAFT" } });
    
    console.log("Triggering runCampaignPipeline for campaign:", campaignId);
    const result = await runCampaignPipeline(campaignId);
    
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Pipeline run failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
