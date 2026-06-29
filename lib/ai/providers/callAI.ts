import { callGemini } from "./geminiProvider";
import { callGroq } from "./groqProvider";
import { callMistral } from "./mistralProvider";

const PROVIDER_TIMEOUT_MS = 30_000;

export async function callAI(agentName: string, prompt: string): Promise<string> {
  const normalizedAgentName = normalizeAgentName(agentName);
  const providers = [
    { name: "Groq", fn: () => callGroq(normalizedAgentName, prompt) },
    { name: "Gemini", fn: () => callGemini(normalizedAgentName, prompt) },
    { name: "Mistral", fn: () => callMistral(normalizedAgentName, prompt) },
  ];

  for (const provider of providers) {
    try {
      console.log(`[AI] Trying ${provider.name} for agent: ${normalizedAgentName}`);
      const result = await Promise.race([
        provider.fn(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), PROVIDER_TIMEOUT_MS)),
      ]);
      if (!result.trim()) throw new Error("Provider returned an empty response.");
      console.log(`[AI] ${provider.name} succeeded for: ${normalizedAgentName}`);
      return result;
    } catch (err) {
      console.warn(`[AI] ${provider.name} failed for ${normalizedAgentName}:`, err);
    }
  }

  throw new Error(`All AI providers failed for agent: ${normalizedAgentName}`);
}

export async function callAIJson<T>(agentName: string, prompt: string): Promise<T> {
  const normalizedAgentName = normalizeAgentName(agentName);
  const jsonPrompt = `${prompt}

CRITICAL INSTRUCTION:
- You MUST respond with ONLY a valid JSON object
- Do NOT include any text before or after the JSON
- Do NOT use markdown code blocks or backticks
- Do NOT add comments inside JSON
- Ensure ALL string values are properly closed with quotes
- Ensure ALL arrays are properly closed with ]
- Ensure ALL objects are properly closed with }
- Your entire response must be parseable by JSON.parse()`;

  const providers = [
    { name: "Groq", fn: () => callGroq(normalizedAgentName, jsonPrompt) },
    { name: "Gemini", fn: () => callGemini(normalizedAgentName, jsonPrompt) },
    { name: "Mistral", fn: () => callMistral(normalizedAgentName, jsonPrompt) },
  ];

  for (const provider of providers) {
    try {
      const raw = await Promise.race([
        provider.fn(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), PROVIDER_TIMEOUT_MS)),
      ]);
      const parsed = JSON.parse(extractJsonObject(raw));
      console.log(`[AI] ${provider.name} returned valid JSON for: ${normalizedAgentName}`);
      return parsed as T;
    } catch (err) {
      console.warn(`[AI] ${provider.name} JSON failed for ${normalizedAgentName}:`, err);
    }
  }

  throw new Error(`All AI providers failed to return valid JSON for agent: ${normalizedAgentName}`);
}

function extractJsonObject(value: string) {
  const clean = value
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .replace(/^\s*[\r\n]/gm, "")
    .trim();
  const firstBrace = clean.indexOf("{");
  const lastBrace = clean.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("No JSON object found in response.");
  }

  return clean.substring(firstBrace, lastBrace + 1);
}

function normalizeAgentName(agentName: string) {
  const normalized = agentName.toLowerCase();
  if (normalized.includes("brand") || normalized.includes("business")) return "brandAnalysis";
  if (normalized.includes("competitor")) return "competitorAnalysis";
  if (normalized.includes("strategy") || normalized.includes("planner")) return "campaignStrategy";
  if (normalized.includes("copy")) return "copywriting";
  if (normalized.includes("creative") || normalized.includes("visual")) return "creativeGeneration";
  if (normalized.includes("publishing")) return "publishing";
  if (normalized.includes("analytics")) return "analytics";
  if (normalized.includes("learning")) return "learning";
  return agentName || "default";
}
