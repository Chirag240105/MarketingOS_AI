import { z } from "zod";
import { runStructuredAgent } from "@/lib/ai/agent-utils";
import { visualCreativePrompt } from "@/lib/ai/prompts/visual-creative";
import type { CampaignBrief, CampaignStrategy } from "@/types/ai";

const schema = z.object({
  concepts: z.array(z.object({ name: z.string(), prompt: z.string(), type: z.enum(["IMAGE", "CAROUSEL"]), rationale: z.string() })).min(1),
});

export function createVisualConcepts(brief: CampaignBrief, strategy: CampaignStrategy) {
  return runStructuredAgent({
    system: visualCreativePrompt,
    input: { brief, strategy },
    schema,
    fallback: () => ({
      concepts: [{
        name: "From chaos to campaign clarity",
        type: "CAROUSEL",
        prompt: "Premium editorial SaaS carousel, dark indigo background, luminous product moments, crisp typography, visual metaphor of scattered notes resolving into a strategic campaign plan.",
        rationale: "Visualizes the campaign transformation while leaving room for a proof-driven narrative.",
      }],
    }),
  });
}
