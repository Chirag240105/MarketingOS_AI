import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const password = await hash("demo123456", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@marketingos.ai" },
    update: { name: "Demo Marketer", password },
    create: { email: "demo@marketingos.ai", name: "Demo Marketer", password, role: "ADMIN" },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: "acme-growth-lab" },
    update: {},
    create: {
      name: "Acme Growth Lab",
      slug: "acme-growth-lab",
      description: "A demo workspace for MarketingOS AI.",
      plan: "PRO",
      ownerId: user.id,
      memberships: { create: { userId: user.id, role: "OWNER" } },
      brandProfile: {
        create: {
          companyName: "Acme Inc.",
          website: "https://acme.example.com",
          description: "Acme helps ambitious teams make their work visible and valuable.",
          mission: "Make great marketing feel clear, calm, and compounding.",
          values: ["Clarity", "Momentum", "Generosity"],
          toneOfVoice: "Clear, optimistic, practical, and never overhyped.",
          industry: "B2B SaaS",
          competitors: ["Notion", "Linear"],
          hashtags: ["#BuildInPublic", "#B2BMarketing"],
          targetAudience: { roles: ["Founder", "Marketing lead"], companySize: "10-200" },
          brandColors: { primary: "#818cf8", accent: "#67e8f9" },
        },
      },
      socialAccounts: {
        create: [
          { platform: "INSTAGRAM", accountName: "acme_growth", handle: "@acme_growth", isConnected: true, followerCount: 12400, metadata: { provider: "mock" } },
          { platform: "LINKEDIN", accountName: "Acme Inc.", handle: "acme-inc", isConnected: true, followerCount: 3400, metadata: { provider: "mock" } },
          { platform: "X", accountName: "acme", handle: "@acme", isConnected: true, followerCount: 8600, metadata: { provider: "mock" } },
        ],
      },
    },
  });

  await prisma.membership.upsert({
    where: { userId_workspaceId: { userId: user.id, workspaceId: workspace.id } },
    update: { role: "OWNER" },
    create: { userId: user.id, workspaceId: workspace.id, role: "OWNER" },
  });

  const campaign = await prisma.campaign.findFirst({ where: { workspaceId: workspace.id, name: "From scattered to strategic" } })
    ?? await prisma.campaign.create({
      data: {
        workspaceId: workspace.id,
        name: "From scattered to strategic",
        description: "A campaign that shows how focused teams turn marketing chaos into calm, measurable momentum.",
        goal: "LEAD_GENERATION",
        status: "REVIEW",
        budget: 5000,
        platforms: ["INSTAGRAM", "LINKEDIN", "X"],
        targetAudience: { roles: ["Founder", "Head of Marketing"], pain: "Too many disconnected marketing tasks" },
        createdBy: user.id,
      },
    });

  const post = await prisma.generatedPost.findFirst({ where: { campaignId: campaign.id } })
    ?? await prisma.generatedPost.create({
      data: {
        campaignId: campaign.id,
        platform: "INSTAGRAM",
        contentType: "CAROUSEL",
        title: "What a calm campaign looks like",
        body: "Your marketing doesn’t need more tabs. It needs a point of view, a plan, and a clean path to publish.",
        caption: "From scattered ideas to an approval-ready campaign in one calm workspace.",
        hashtags: ["#MarketingStrategy", "#BuildInPublic", "#GrowthMarketing"],
        mentions: [],
        mediaType: "CAROUSEL",
        callToAction: "Build your next campaign",
        aiConfidence: 0.91,
        aiReasoning: "Outcome-led educational carousel with a low-friction CTA.",
        status: "PENDING_APPROVAL",
      },
    });

  await prisma.approval.upsert({
    where: { postId_reviewerId: { postId: post.id, reviewerId: user.id } },
    update: {},
    create: { postId: post.id, reviewerId: user.id, status: "PENDING_REVIEW" },
  });

  console.log("Seeded demo account: demo@marketingos.ai / demo123456");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
