import { prisma } from "@/lib/db";
import type { AIAgentType } from "@/lib/generated/prisma/client";

export async function trackAiUsage(input: {
  userId: string;
  workspaceId: string;
  agentType: AIAgentType;
  tokensUsed?: number;
  cost?: number;
  model?: string;
}) {
  return prisma.aIUsage.create({
    data: {
      userId: input.userId,
      workspaceId: input.workspaceId,
      agentType: input.agentType,
      tokensUsed: input.tokensUsed ?? 0,
      cost: input.cost,
      model: input.model || process.env.GROQ_MODEL || process.env.GEMINI_MODEL || process.env.MISTRAL_MODEL || "unknown",
    },
  });
}
