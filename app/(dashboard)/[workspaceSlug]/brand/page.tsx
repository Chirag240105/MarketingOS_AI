import { BrandProfileForm } from "@/components/brand/brand-profile-form";
import { requireWorkspaceBySlug } from "@/lib/utils/workspace";

export default async function BrandPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params;
  const { workspace } = await requireWorkspaceBySlug(workspaceSlug, "EDITOR");
  const brand = await (await import("@/lib/db")).prisma.brandProfile.findUnique({ where: { workspaceId: workspace.id } });
  return <section><p className="text-sm font-medium text-indigo-200">Brand intelligence</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Teach the agents how you sound.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">This profile becomes the source of truth for strategy, messaging, visual direction, and safety reviews.</p><div className="mt-8"><BrandProfileForm workspaceId={workspace.id} initial={brand ? { companyName: brand.companyName, website: brand.website || "", description: brand.description || "", mission: brand.mission || "", toneOfVoice: brand.toneOfVoice || "", industry: brand.industry || "", primaryGoal: brand.primaryGoal || "", budget: brand.budget?.toString() || "", location: brand.location || "", productsServices: brand.productsServices.join(", "), values: brand.values.join(", "), competitors: brand.competitors.join(", "), hashtags: brand.hashtags.join(", ") } : undefined} /></div></section>;
}
