"use server";

import { compare } from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type LoginState = {
  error?: string;
};

export async function authenticateAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const invalidCredentials = "Sign in failed - check your email and password";

  if (!email || !password) return { error: invalidCredentials };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.password) return { error: invalidCredentials };

  const isValid = await compare(password, user.password);
  if (!isValid) return { error: invalidCredentials };

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/onboarding",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) return { error: invalidCredentials };
    throw error;
  }
}

export async function authenticateWithGoogleAction() {
  await signIn("google", { redirectTo: "/onboarding" });
}
