import { z } from "zod";
import { runStructuredAgent } from "@/lib/ai/agent-utils";
import { copywriterPrompt } from "@/lib/ai/prompts/copywriter";
import type { CampaignBrief, CampaignStrategy, GeneratedContent } from "@/types/ai";

const postSchema = z.object({
  platform: z.enum(["INSTAGRAM", "FACEBOOK", "X", "LINKEDIN", "TIKTOK", "YOUTUBE", "PINTEREST"]),
  contentType: z.enum(["FEED_POST", "STORY", "REEL", "CAROUSEL", "VIDEO", "AD_BANNER", "AD_COPY", "CAPTION_ONLY", "THREAD", "ARTICLE"]),
  title: z.string().optional(),
  body: z.string(),
  caption: z.string().optional(),
  hashtags: z.array(z.string()),
  mentions: z.array(z.string()),
  callToAction: z.string().optional(),
  mediaType: z.enum(["IMAGE", "VIDEO", "CAROUSEL", "TEXT"]).optional(),
  aiConfidence: z.number().min(0).max(1),
  aiReasoning: z.string().optional(),
});

const schema = z.object({ posts: z.array(postSchema).min(1) });

function postForPlatform(platform: GeneratedContent["platform"], brief: CampaignBrief): GeneratedContent {
  const title = brief.name + ": the momentum your marketing has been waiting for";
  const body = "Your best campaigns should feel less like a scramble and more like a system. " + brief.brand.companyName + " turns a clear strategy into work your team can actually ship.";
  const contentType = platform === "X" ? "THREAD" : platform === "INSTAGRAM" ? "CAROUSEL" : "FEED_POST";
  return {
    platform,
    contentType,
    title,
    body,
    caption: body + " What would you create with a little more clarity?",
    hashtags: ["#MarketingStrategy", "#GrowthMarketing", "#BuildInPublic"],
    mentions: [],
    callToAction: "See the campaign plan",
    mediaType: platform === "X" ? "TEXT" : "CAROUSEL",
    aiConfidence: 0.84,
    aiReasoning: "Uses an outcome-led hook and a low-friction next step.",
  };
}

export async function writeCampaignPosts(brief: CampaignBrief, strategy: CampaignStrategy) {
  return runStructuredAgent<{ posts: GeneratedContent[] }>({
    system: copywriterPrompt,
    input: { brief, strategy },
    schema,
    fallback: () => ({ posts: brief.platforms.map((platform) => postForPlatform(platform, brief)) }),
  });
}
