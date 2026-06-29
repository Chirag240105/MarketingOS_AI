"use server";

import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email().transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(128),
});

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export type RegisterState = {
  error?: string;
  errorId?: number;
};

const duplicateEmailMessage = "An account with that email already exists.";

function actionError(message: string): RegisterState {
  return { error: message, errorId: Date.now() };
}

export async function registerAction(_state: RegisterState, formData: FormData): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid details.");
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return actionError(duplicateEmailMessage);

  const baseSlug = slugify(parsed.data.name) || "workspace";
  const workspaceSlug = baseSlug + "-" + crypto.randomUUID().slice(0, 6);

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          password: await hash(parsed.data.password, 12),
        },
      });
      await tx.workspace.create({
        data: {
          name: parsed.data.name + "'s workspace",
          slug: workspaceSlug,
          ownerId: user.id,
          memberships: { create: { userId: user.id, role: "OWNER" } },
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return actionError(duplicateEmailMessage);
    }
    throw error;
  }

  redirect("/login?registered=1");
}
