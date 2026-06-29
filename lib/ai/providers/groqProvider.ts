import Groq from "groq-sdk";

const GROQ_MODELS = {
  brandAnalysis: "llama-3.3-70b-versatile",
  competitorAnalysis: "llama-3.3-70b-versatile",
  campaignStrategy: "llama-3.3-70b-versatile",
  copywriting: "mixtral-8x7b-32768",
  creativeGeneration: "llama-3.3-70b-versatile",
  publishing: "llama3-8b-8192",
  analytics: "llama-3.3-70b-versatile",
  learning: "llama-3.3-70b-versatile",
  default: "llama-3.3-70b-versatile",
};

export async function callGroq(agentName: string, prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API || process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API is required.");
  const groq = new Groq({ apiKey });
  const model = GROQ_MODELS[agentName as keyof typeof GROQ_MODELS] || GROQ_MODELS.default;
  const response = await groq.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 2000,
  });
  return response.choices[0]?.message?.content || "";
}
