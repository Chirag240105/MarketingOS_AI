import { z } from "zod";
import { runStructuredAgent } from "@/lib/ai/agent-utils";
import { analyticsLearningPrompt } from "@/lib/ai/prompts/analytics-learning";

const schema = z.object({
  summary: z.string(),
  wins: z.array(z.string()),
  opportunities: z.array(z.string()),
  nextExperiments: z.array(z.string()),
});

export function learnFromAnalytics(input: unknown) {
  return runStructuredAgent({
    system: analyticsLearningPrompt,
    input,
    schema,
    fallback: () => ({
      summary: "Carousels are driving the most meaningful engagement in this sample.",
      wins: ["Strong saves on educational content", "Consistent reach from the campaign cadence"],
      opportunities: ["Test sharper first-slide hooks", "Add one proof point to each CTA"],
      nextExperiments: ["Compare founder-led versus product-led openings", "Test a shorter caption variant"],
    }),
  });
}
