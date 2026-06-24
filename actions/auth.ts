"use server";

import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email().transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(128),
});

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid details.");

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) throw new Error("An account with that email already exists.");

  const baseSlug = slugify(parsed.data.name) || "workspace";
  const workspaceSlug = baseSlug + "-" + crypto.randomUUID().slice(0, 6);

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

  redirect("/login?registered=1");
}
