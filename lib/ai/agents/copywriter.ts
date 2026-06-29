import { z } from "zod";
import { runStructuredAgent } from "@/lib/ai/agent-utils";
import { copywriterPrompt } from "@/lib/ai/prompts/copywriter";
import { aiConfidence, aiEnum, aiOptionalString, aiString, aiStringArray } from "@/lib/ai/schema-utils";
import type { CampaignBrief, CampaignStrategy, GeneratedContent } from "@/types/ai";

const postSchema = z.object({
  platform: aiEnum(["INSTAGRAM", "FACEBOOK", "X", "LINKEDIN", "TIKTOK", "YOUTUBE", "PINTEREST"], { TWITTER: "X" }),
  contentType: aiEnum(["FEED_POST", "STORY", "REEL", "CAROUSEL", "VIDEO", "AD_BANNER", "AD_COPY", "CAPTION_ONLY", "THREAD", "ARTICLE"], {
    POST: "FEED_POST",
    IMAGE_POST: "FEED_POST",
    SOCIAL_POST: "FEED_POST",
    BANNER: "AD_BANNER",
    AD: "AD_COPY",
    COPY: "AD_COPY",
  }),
  title: aiOptionalString(),
  body: aiString,
  caption: aiOptionalString(),
  hashtags: aiStringArray(),
  mentions: aiStringArray(),
  callToAction: aiOptionalString(),
  mediaType: aiEnum(["IMAGE", "VIDEO", "CAROUSEL", "TEXT"]).optional(),
  aiConfidence,
  aiReasoning: aiOptionalString(),
});

const schema = z.object({ posts: z.array(postSchema).min(1) });

export async function writeCampaignPosts(brief: CampaignBrief, strategy: CampaignStrategy) {
  return runStructuredAgent<{ posts: GeneratedContent[] }>({
    agentName: "Copywriter Agent",
    modelProfile: "copywriting",
    system: copywriterPrompt,
    input: { brief, strategy },
    schema,
    rootArrayKey: "posts",
  });
}
