import { z } from "zod";
import { runStructuredAgent } from "@/lib/ai/agent-utils";
import { videoScriptPrompt } from "@/lib/ai/prompts/video-script";
import type { CampaignBrief } from "@/types/ai";

const schema = z.object({
  hook: z.string(),
  scenes: z.array(z.string()).min(2),
  voiceover: z.string(),
  caption: z.string(),
  callToAction: z.string(),
});

export function writeVideoScript(brief: CampaignBrief) {
  return runStructuredAgent({
    system: videoScriptPrompt,
    input: brief,
    schema,
    fallback: () => ({
      hook: "What if your next campaign started with clarity instead of a blank page?",
      scenes: ["Open on scattered campaign tabs.", "Reveal a single, focused campaign workspace.", "Show approved posts moving onto a calendar."],
      voiceover: brief.brand.companyName + " turns the work of modern marketing into one calm, connected flow.",
      caption: "Less scramble. More signal.",
      callToAction: "Build your next campaign.",
    }),
  });
}
