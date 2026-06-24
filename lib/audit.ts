import { prisma } from "@/lib/db";
import type { AuditAction } from "@/lib/generated/prisma/client";

export async function writeAuditLog(input: {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  userId?: string;
  workspaceId?: string;
  details?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      userId: input.userId,
      workspaceId: input.workspaceId,
      details: input.details as never,
    },
  });
}
