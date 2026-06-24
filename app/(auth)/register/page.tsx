import Link from "next/link";
import { registerAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md">
      <p className="text-sm font-medium text-indigo-200">Start with your foundation</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Create your workspace</h1>
      <p className="mt-2 text-sm text-slate-400">Your first workspace is ready in under a minute.</p>
      <form action={registerAction} className="mt-8 space-y-4">
        <label className="block text-sm text-slate-300">Name<Input name="name" autoComplete="name" className="mt-2" required /></label>
        <label className="block text-sm text-slate-300">Work email<Input name="email" type="email" autoComplete="email" className="mt-2" required /></label>
        <label className="block text-sm text-slate-300">Password<Input name="password" type="password" autoComplete="new-password" minLength={8} className="mt-2" required /></label>
        <Button type="submit" className="w-full">Create workspace</Button>
      </form>
      <p className="mt-6 text-sm text-slate-400">Already have an account? <Link className="text-indigo-300 hover:text-indigo-200" href="/login">Sign in</Link></p>
    </div>
  );
}
