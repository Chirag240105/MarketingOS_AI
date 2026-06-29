import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SocialConnectForm } from "@/components/social-connect-form";
import { PLATFORM_LIST } from "@/config/platforms";
import { prisma } from "@/lib/db";
import { requireWorkspaceBySlug } from "@/lib/utils/workspace";

export default async function SocialAccountsPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params;
  const { workspace } = await requireWorkspaceBySlug(workspaceSlug, "ADMIN");
  const accounts = await prisma.socialAccount.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { platform: "asc" },
    select: { id: true, platform: true, accountName: true, handle: true, isConnected: true, metadata: true },
  });
  const accountByPlatform = new Map(accounts.map((account) => [account.platform, account]));
  const metaAccount = accounts.find((account) => account.platform === "INSTAGRAM" || account.platform === "FACEBOOK");
  const metaScopes = metaAccount?.metadata && typeof metaAccount.metadata === "object" && "scope" in metaAccount.metadata ? String((metaAccount.metadata as { scope?: unknown }).scope || "") : "";
  const hasAdsManagement = metaScopes.includes("ads_management");

  return (
    <section>
      <p className="text-sm font-medium text-indigo-200">Distribution layer</p>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-white">Connect the places your audience lives.</h1>
      <p className="mt-2 text-sm text-slate-400">Connections use each platform's OAuth flow. Your platform app must be approved for publishing and insights scopes.</p>
      <div className="mt-8"><SocialConnectForm workspaceId={workspace.id} /></div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PLATFORM_LIST.map((platform) => {
          const account = accountByPlatform.get(platform.id);
          const Icon = platform.icon;
          return (
            <Card key={platform.id} className="p-5">
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-lg bg-bg-elevated"><Icon className="size-5 text-indigo-300" /></span>
                <Badge tone={account?.isConnected ? "emerald" : "slate"}>{account?.isConnected ? "Connected" : "Disconnected"}</Badge>
              </div>
              <p className="mt-5 font-medium text-white">{platform.label}</p>
              <p className="mt-1 min-h-5 text-sm text-slate-500">{platform.publishingSupported ? account?.isConnected ? account.accountName : "No account connected" : "Coming soon"}</p>
              {platform.publishingSupported ? account?.isConnected ? <Button className="mt-5 w-full" variant="ghost" size="sm">Disconnect</Button> : <a className="mt-5 block" href={`/api/social/${platform.id.toLowerCase()}/connect?workspaceId=${encodeURIComponent(workspace.id)}`}><Button className="w-full" size="sm">Connect {platform.label}</Button></a> : <Button className="mt-5 w-full" variant="secondary" size="sm" disabled>Coming soon</Button>}
            </Card>
          );
        })}
      </div>
      <Card className="mt-5 p-5">
        <div className="flex items-center gap-2">
          {hasAdsManagement ? <CheckCircle2 className="size-5 text-emerald-400" /> : <AlertTriangle className="size-5 text-amber-400" />}
          <h2 className="font-medium text-white">Meta ad permissions</h2>
        </div>
        <p className="mt-2 text-sm text-slate-500">Current scopes: {metaScopes || "Not available from provider response"}</p>
        {!hasAdsManagement ? <div className="mt-4 rounded-lg border border-amber-700 bg-amber-900/30 p-3 text-sm text-amber-400">Ad publishing requires ads_management permission. Reconnect your Meta account to enable.</div> : null}
      </Card>
    </section>
  );
}
