"use client";

import { useState, useTransition } from "react";
import { connectMockSocialAccount } from "@/actions/social";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SocialConnectForm({ workspaceId }: { workspaceId: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  function connect(formData: FormData) {
    startTransition(async () => {
      try {
        const account = await connectMockSocialAccount({ workspaceId, platform: formData.get("platform"), accountName: formData.get("accountName"), handle: formData.get("handle") || undefined });
        setMessage(account.platform + " mock account connected.");
      } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Could not connect account."); }
    });
  }
  return <form action={connect} className="grid gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4 sm:grid-cols-[150px_1fr_1fr_auto]"><select name="platform" className="h-10 rounded-xl border border-white/10 bg-slate-950/50 px-3 text-sm text-slate-200"><option value="INSTAGRAM">Instagram</option><option value="LINKEDIN">LinkedIn</option><option value="X">X</option><option value="FACEBOOK">Facebook</option></select><Input name="accountName" placeholder="Account name" required /><Input name="handle" placeholder="@handle (optional)" /><Button size="sm" type="submit" disabled={pending}>{pending ? "Connecting..." : "Connect mock"}</Button>{message ? <p className="sm:col-span-4 text-xs text-slate-400">{message}</p> : null}</form>;
}
