import { prisma } from "@/lib/db";
import type { AIAgentType } from "@/lib/generated/prisma/client";

export async function trackAiUsage(input: {
  userId: string;
  workspaceId: string;
  agentType: AIAgentType;
  tokensUsed?: number;
  cost?: number;
}) {
  return prisma.aIUsage.create({
    data: {
      userId: input.userId,
      workspaceId: input.workspaceId,
      agentType: input.agentType,
      tokensUsed: input.tokensUsed ?? 0,
      cost: input.cost,
      model: process.env.OPENROUTER_MODEL || process.env.OPENAI_MODEL || ((process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY) ? "gpt-4.1-mini" : "mock"),
    },
  });
}
