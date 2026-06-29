"use client";

import { Button } from "@/components/ui/button";

export function SocialConnectForm({ workspaceId }: { workspaceId: string }) {
  const connect = (platform: "instagram" | "facebook" | "linkedin" | "x") => {
    window.location.assign(`/api/social/${platform}/connect?workspaceId=${encodeURIComponent(workspaceId)}`);
  };
  return <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4"><div className="grid gap-3 sm:grid-cols-2"><Button type="button" onClick={() => connect("instagram")}>Connect Instagram Business</Button><Button type="button" variant="secondary" onClick={() => connect("facebook")}>Connect Facebook Page</Button><Button type="button" variant="secondary" onClick={() => connect("linkedin")}>Connect LinkedIn Page</Button><Button type="button" variant="secondary" onClick={() => connect("x")}>Connect X</Button></div><p className="mt-3 text-xs leading-5 text-slate-500">For ad publishing, your Meta app must have ads_management approved. Until App Review is complete, only app developers/testers can use this feature.</p></div>;
}
