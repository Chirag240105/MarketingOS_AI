"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

export type LoginState = {
  error?: string;
};

export async function authenticateAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
      redirectTo: "/onboarding",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Sign in failed — check your email and password" };
    }
    throw error;
  }
}

export async function authenticateWithGoogleAction() {
  await signIn("google", { redirectTo: "/onboarding" });
}
