import { z } from "zod";
import { runStructuredAgent } from "@/lib/ai/agent-utils";
import { visualCreativePrompt } from "@/lib/ai/prompts/visual-creative";
import { aiEnum, aiString } from "@/lib/ai/schema-utils";
import type { CampaignBrief, CampaignStrategy } from "@/types/ai";

const schema = z.object({
  concepts: z.array(z.object({ name: aiString, prompt: aiString, type: aiEnum(["IMAGE", "CAROUSEL"], { SLIDE: "CAROUSEL", CAROUSEL_SLIDE: "CAROUSEL" }), rationale: aiString })).min(1),
});

export function createVisualConcepts(brief: CampaignBrief, strategy: CampaignStrategy) {
  return runStructuredAgent({
    agentName: "Visual Creative Agent",
    modelProfile: "jsonGeneration",
    system: visualCreativePrompt,
    input: { brief, strategy },
    schema,
    rootArrayKey: "concepts",
    fallback: {
      concepts: [{
        name: "Proof-led campaign visual",
        prompt: `Clean marketing visual for ${brief.brand.companyName} with product-first composition, clear offer space, and brand-safe lighting.`,
        type: "IMAGE",
        rationale: "Fallback concept focused on a clear offer and reviewable brand presentation.",
      }],
    },
  });
}
