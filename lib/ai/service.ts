import { z } from "zod";
import { callAI } from "@/lib/ai/providers/callAI";

export type AIModelProfile =
  | "campaignPlanner"
  | "competitorAnalysis"
  | "copywriting"
  | "jsonGeneration"
  | "orchestration";

type StructuredAIOptions<T> = {
  agentName: string;
  modelProfile?: AIModelProfile;
  // Custom model routing is ignored while using direct Groq/Gemini/Mistral fallback.
  customModels?: string[];
  system: string;
  input: unknown;
  schema: z.ZodType<T>;
  rootArrayKey?: string;
  fallback?: T;
};

export type AIUsage = {
  inputTokens: number;
  outputTokens: number;
  model: string;
};

export type StructuredAIResult<T> = {
  output: T;
  usage: AIUsage;
  status: "generated" | "fallback";
  errors: string[];
};

export async function runStructuredAI<T>({
  agentName,
  modelProfile = "orchestration",
  system,
  input,
  schema,
  rootArrayKey,
  fallback,
}: StructuredAIOptions<T>): Promise<StructuredAIResult<T>> {
  const prompt = buildStructuredPrompt(system, input, schema);

  try {
    const content = await callAI(agentTask(agentName, modelProfile), prompt);
    const parsed = parseJsonContent(content);
    const output = validateStructuredOutput(schema, parsed, rootArrayKey);
    return {
      output,
      usage: estimateUsage(prompt, content),
      status: "generated",
      errors: [],
    };
  } catch (error) {
    return fallbackResult(agentName, fallback, [getErrorMessage(error)]);
  }
}

function agentTask(agentName: string, profile: AIModelProfile) {
  const normalized = agentName.toLowerCase();
  if (normalized.includes("brand") || normalized.includes("business")) return "brandAnalysis";
  if (normalized.includes("competitor")) return "competitorAnalysis";
  if (normalized.includes("strategy") || normalized.includes("planner")) return "campaignStrategy";
  if (normalized.includes("copy")) return "copywriting";
  if (normalized.includes("creative") || normalized.includes("visual")) return "creativeGeneration";
  if (normalized.includes("publishing")) return "publishing";
  if (normalized.includes("analytics")) return "analytics";
  if (normalized.includes("learning")) return "learning";
  if (profile === "campaignPlanner") return "campaignStrategy";
  if (profile === "competitorAnalysis") return "competitorAnalysis";
  if (profile === "copywriting") return "copywriting";
  return "default";
}

function buildStructuredPrompt(system: string, input: unknown, schema?: z.ZodTypeAny) {
  let contract = `${system}

Return exactly one valid JSON object and nothing else. Do not return markdown, prose, comments, or escaped JSON text.`;

  if (schema) {
    try {
      contract += `\n\nThe JSON must conform to this schema shape:\n${JSON.stringify(zodToJsonSchema(schema), null, 2)}`;
    } catch (error) {
      console.warn("Failed to serialize schema for AI prompt:", error);
    }
  }

  return `${contract}\n\nInput:\n${JSON.stringify(input, null, 2)}`;
}

function parseJsonContent(content: string): unknown {
  const trimmed = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const parsed = JSON.parse(trimmed);
  return typeof parsed === "string" ? JSON.parse(parsed) : parsed;
}

function validateStructuredOutput<T>(schema: z.ZodType<T>, parsed: unknown, rootArrayKey?: string): T {
  const candidates = [parsed];
  if (rootArrayKey && Array.isArray(parsed)) candidates.push({ [rootArrayKey]: parsed });
  if (Array.isArray(parsed) && parsed.length === 1) candidates.push(parsed[0]);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const value = parsed as Record<string, unknown>;
    for (const key of ["output", "result", "data"]) {
      if (key in value) candidates.push(value[key]);
    }
  }

  let lastError: z.ZodError | undefined;
  for (const candidate of candidates) {
    const result = schema.safeParse(candidate);
    if (result.success) return result.data;
    lastError = result.error;
  }
  throw lastError || new Error("Structured response did not match the expected schema.");
}

function zodToJsonSchema(schema: any): any {
  if (!schema) return { type: "string" };
  if (schema._def?.schema) return zodToJsonSchema(schema._def.schema);
  if (schema.innerType && typeof schema.innerType === "function") return zodToJsonSchema(schema.innerType());

  const typeName = schema._def?.typeName;
  switch (typeName) {
    case "ZodObject": {
      const shape = schema.shape;
      const properties: Record<string, unknown> = {};
      const required: string[] = [];
      for (const key of Object.keys(shape)) {
        properties[key] = zodToJsonSchema(shape[key]);
        if (!isSchemaOptional(shape[key])) required.push(key);
      }
      return { type: "object", properties, ...(required.length ? { required } : {}) };
    }
    case "ZodArray":
      return { type: "array", items: zodToJsonSchema(schema.element || schema._def.type) };
    case "ZodString":
      return { type: "string" };
    case "ZodNumber":
      return { type: "number" };
    case "ZodBoolean":
      return { type: "boolean" };
    case "ZodEnum":
      return { type: "string", enum: schema._def.values };
    case "ZodOptional":
    case "ZodNullable":
      return zodToJsonSchema(schema._def.innerType);
    default:
      return { type: "string" };
  }
}

function isSchemaOptional(schema: any): boolean {
  if (!schema) return false;
  if (schema._def?.typeName === "ZodOptional") return true;
  if (schema.isOptional && typeof schema.isOptional === "function" && schema.isOptional()) return true;
  if (schema._def?.schema) return isSchemaOptional(schema._def.schema);
  if (schema.innerType && typeof schema.innerType === "function") return isSchemaOptional(schema.innerType());
  return false;
}

function estimateUsage(prompt: string, content: string): AIUsage {
  return {
    inputTokens: estimateTokens(prompt),
    outputTokens: estimateTokens(content),
    model: "callAI:groq-gemini-mistral",
  };
}

function estimateTokens(value: string) {
  return Math.ceil(value.length / 4);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown provider error";
}

function fallbackResult<T>(agentName: string, fallback: T | undefined, errors: string[]): StructuredAIResult<T> {
  if (fallback === undefined) {
    throw new Error(`AI generation failed for ${agentName}: ${errors.at(-1) || "No fallback was configured."}`);
  }
  console.warn(`[AI:${agentName}] using static fallback response.`);
  return {
    output: fallback,
    usage: { inputTokens: 0, outputTokens: 0, model: "fallback" },
    status: "fallback",
    errors,
  };
}
