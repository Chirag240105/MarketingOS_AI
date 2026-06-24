import { CampaignWizard } from "@/components/campaign/campaign-wizard";
import { requireWorkspaceBySlug } from "@/lib/utils/workspace";

export default async function NewCampaignPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params;
  const { workspace } = await requireWorkspaceBySlug(workspaceSlug, "EDITOR");
  return <section><p className="text-sm font-medium text-indigo-200">New campaign</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Start from a sharp brief.</h1><p className="mt-2 text-sm text-slate-400">The campaign strategy, copy, visual direction, and safety review will all inherit this intent.</p><div className="mt-8"><CampaignWizard workspaceId={workspace.id} workspaceSlug={workspace.slug} /></div></section>;
}
