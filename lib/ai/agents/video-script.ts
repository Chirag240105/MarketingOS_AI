import { z } from "zod";
import { runStructuredAgent } from "@/lib/ai/agent-utils";
import { videoScriptPrompt } from "@/lib/ai/prompts/video-script";
import { aiString, aiStringArray } from "@/lib/ai/schema-utils";
import type { CampaignBrief } from "@/types/ai";

const schema = z.object({
  hook: aiString,
  scenes: aiStringArray(2),
  voiceover: aiString,
  caption: aiString,
  callToAction: aiString,
});

export function writeVideoScript(brief: CampaignBrief) {
  return runStructuredAgent({
    agentName: "Video Script Agent",
    modelProfile: "copywriting",
    system: videoScriptPrompt,
    input: brief,
    schema,
    fallback: {
      hook: `Meet ${brief.brand.companyName}.`,
      scenes: ["Open on the customer problem.", "Show the offer or product in action.", "Close with a simple call to action."],
      voiceover: `${brief.brand.companyName} helps customers act with more confidence. ${brief.offer || "Learn more today."}`,
      caption: brief.name,
      callToAction: "Learn More",
    },
  });
}
