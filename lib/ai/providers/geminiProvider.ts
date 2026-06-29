import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_MODELS = {
  competitorAnalysis: "gemini-1.5-pro",
  analytics: "gemini-1.5-pro",
  brandAnalysis: "gemini-1.5-pro",
  campaignStrategy: "gemini-1.5-pro",
  creativeGeneration: "gemini-1.5-flash",
  copywriting: "gemini-1.5-flash",
  publishing: "gemini-1.5-flash",
  learning: "gemini-1.5-pro",
  default: "gemini-1.5-flash",
};

export async function callGemini(agentName: string, prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API is required.");
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = GEMINI_MODELS[agentName as keyof typeof GEMINI_MODELS] || GEMINI_MODELS.default;
  const model = genAI.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  return result.response.text();
}
