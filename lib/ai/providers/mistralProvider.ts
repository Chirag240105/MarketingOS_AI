import { Mistral } from "@mistralai/mistralai";

const MISTRAL_MODELS = {
  brandAnalysis: "mistral-large-latest",
  campaignStrategy: "mistral-large-latest",
  analytics: "mistral-large-latest",
  learning: "mistral-large-latest",
  copywriting: "mistral-small-latest",
  creativeGeneration: "mistral-small-latest",
  publishing: "mistral-small-latest",
  competitorAnalysis: "mistral-large-latest",
  default: "mistral-small-latest",
};

export async function callMistral(agentName: string, prompt: string): Promise<string> {
  const apiKey = process.env.MISTRAL_KEY;
  if (!apiKey) throw new Error("MISTRAL_KEY environment variable is not set.");
  const mistral = new Mistral({ apiKey });
  const model = MISTRAL_MODELS[agentName as keyof typeof MISTRAL_MODELS] || MISTRAL_MODELS.default;
  const response = await mistral.chat.complete({
    model,
    messages: [{ role: "user", content: prompt }],
  });
  const content = response.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((part) => "text" in part ? part.text : "").join("");
  return "";
}
