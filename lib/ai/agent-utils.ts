import OpenAI from "openai";
import type { z } from "zod";

type StructuredAgentOptions<T> = {
  system: string;
  input: unknown;
  schema: z.ZodType<T>;
  fallback: () => T;
};

export async function runStructuredAgent<T>({
  system,
  input,
  schema,
  fallback,
}: StructuredAgentOptions<T>): Promise<{ output: T; mocked: boolean }> {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return { output: fallback(), mocked: true };

  try {
    const usingOpenRouter = Boolean(process.env.OPENROUTER_API_KEY);
    const client = new OpenAI({
      apiKey,
      ...(usingOpenRouter
        ? {
            baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
            defaultHeaders: {
              "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER || "http://localhost:3000",
              "X-Title": process.env.OPENROUTER_APP_TITLE || "MarketingOS AI",
            },
          }
        : {}),
    });
    const completion = await client.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || process.env.OPENAI_MODEL || (usingOpenRouter ? "openai/gpt-4.1-mini" : "gpt-4.1-mini"),
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(input) },
      ],
    });
    const content = completion.choices[0]?.message.content;
    if (!content) throw new Error("Empty model response");
    return { output: schema.parse(JSON.parse(content)), mocked: false };
  } catch {
    return { output: fallback(), mocked: true };
  }
}
