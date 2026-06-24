import Link from "next/link";
import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ registered?: string }> }) {
  const query = await searchParams;
  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  async function authenticate(formData: FormData) {
    "use server";
    await signIn("credentials", {
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
      redirectTo: "/onboarding",
    });
  }
  async function authenticateWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: "/onboarding" });
  }
  return (
    <div className="w-full max-w-md">
      <p className="text-sm font-medium text-indigo-200">Welcome back</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Sign in to MarketingOS</h1>
      <p className="mt-2 text-sm text-slate-400">Pick up your campaigns exactly where you left them.</p>
      {query.registered ? <p className="mt-5 rounded-xl bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">Account created. Sign in to continue.</p> : null}
      <form action={authenticate} className="mt-8 space-y-4">
        <label className="block text-sm text-slate-300">Email<Input name="email" type="email" autoComplete="email" className="mt-2" required /></label>
        <label className="block text-sm text-slate-300">Password<Input name="password" type="password" autoComplete="current-password" className="mt-2" required /></label>
        <Button type="submit" className="w-full">Sign in</Button>
      </form>
      {googleEnabled ? <form action={authenticateWithGoogle} className="mt-3"><Button type="submit" variant="secondary" className="w-full">Continue with Google</Button></form> : null}
      <p className="mt-6 text-sm text-slate-400">New here? <Link className="text-indigo-300 hover:text-indigo-200" href="/register">Create a workspace</Link></p>
    </div>
  );
}
