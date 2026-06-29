"use server";

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { brandProfileSchema } from "@/lib/validations/brand";
import { requireWorkspaceMembership } from "@/lib/utils/workspace";

export async function saveBrandProfile(input: unknown) {
  const data = brandProfileSchema.parse(input);
  const { user, workspace } = await requireWorkspaceMembership(data.workspaceId, "EDITOR");
  const profile = await prisma.brandProfile.upsert({
    where: { workspaceId: data.workspaceId },
    update: {
      companyName: data.companyName,
      website: data.website || null,
      description: data.description || null,
      mission: data.mission || null,
      vision: data.vision || null,
      values: data.values,
      toneOfVoice: data.toneOfVoice || null,
      industry: data.industry || null,
      primaryGoal: data.primaryGoal || null,
      budget: data.budget,
      location: data.location || null,
      productsServices: data.productsServices,
      competitors: data.competitors,
      hashtags: data.hashtags,
      targetAudience: data.targetAudience as never,
      brandColors: data.brandColors as never,
    },
    create: {
      workspaceId: data.workspaceId,
      companyName: data.companyName,
      website: data.website || null,
      description: data.description || null,
      mission: data.mission || null,
      vision: data.vision || null,
      values: data.values,
      toneOfVoice: data.toneOfVoice || null,
      industry: data.industry || null,
      primaryGoal: data.primaryGoal || null,
      budget: data.budget,
      location: data.location || null,
      productsServices: data.productsServices,
      competitors: data.competitors,
      hashtags: data.hashtags,
      targetAudience: data.targetAudience as never,
      brandColors: data.brandColors as never,
    },
  });
  await writeAuditLog({ action: "UPDATE", entityType: "brand_profile", entityId: profile.id, userId: user.id, workspaceId: workspace.id });
  revalidatePath("/" + workspace.slug + "/brand");
  return profile;
}
