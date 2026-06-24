import { z } from "zod";
import { runStructuredAgent } from "@/lib/ai/agent-utils";
import { brandSafetyPrompt } from "@/lib/ai/prompts/brand-safety";
import type { BrandContext, GeneratedContent } from "@/types/ai";

const schema = z.object({
  approved: z.boolean(),
  issues: z.array(z.string()),
  suggestedEdits: z.array(z.string()),
});

export async function reviewBrandSafety(brand: BrandContext, posts: GeneratedContent[]) {
  const result = await runStructuredAgent({
    system: brandSafetyPrompt,
    input: { brand, posts },
    schema,
    fallback: () => ({
      approved: !posts.some((post) => /guarantee|instant results/i.test(post.body)),
      issues: posts.some((post) => /guarantee|instant results/i.test(post.body)) ? ["Avoid unsupported outcome claims."] : [],
      suggestedEdits: [],
    }),
  });
  return result;
}
