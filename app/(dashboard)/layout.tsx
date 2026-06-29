import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const membership = await prisma.membership.findFirst({ where: { userId: session.user.id }, include: { workspace: true }, orderBy: { joinedAt: "asc" } });
  const pendingCount = membership ? await prisma.generatedPost.count({ where: { campaign: { workspaceId: membership.workspaceId }, status: "PENDING_APPROVAL" } }) : 0;
  return (
    <div className="min-h-screen bg-bg-base md:flex">
      <Sidebar workspaceSlug={membership?.workspace.slug} workspaceName={membership?.workspace.name} userName={session.user.name} pendingCount={pendingCount} />
      <div className="min-w-0 flex-1 md:pl-60">
        <Header workspaceName={membership?.workspace.name} workspaceSlug={membership?.workspace.slug} userName={session.user.name} />
        <main className="mx-auto max-w-[1600px] p-4 pb-24 sm:p-7 md:pb-7">{children}</main>
      </div>
    </div>
  );
}
