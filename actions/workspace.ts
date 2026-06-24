"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/utils/workspace";

const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2).max(100),
});

export async function createWorkspace(input: z.infer<typeof createWorkspaceSchema>) {
  const user = await getCurrentUser();
  const data = createWorkspaceSchema.parse(input);
  const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + crypto.randomUUID().slice(0, 6);
  const workspace = await prisma.workspace.create({
    data: {
      name: data.name,
      slug,
      ownerId: user.id,
      memberships: { create: { userId: user.id, role: "OWNER" } },
    },
  });
  await writeAuditLog({ action: "CREATE", entityType: "workspace", entityId: workspace.id, userId: user.id, workspaceId: workspace.id });
  revalidatePath("/");
  return workspace;
}
