"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import type { MembershipRole } from "@/lib/generated/prisma/client";

export type ClientWorkspaceContext = {
  workspaceSlug?: string;
  workspaceId?: string;
  role?: MembershipRole;
};

export function useWorkspace(initial?: ClientWorkspaceContext) {
  const params = useParams<{ workspaceSlug?: string }>();
  return useMemo<ClientWorkspaceContext>(() => ({
    workspaceSlug: initial?.workspaceSlug || params?.workspaceSlug,
    workspaceId: initial?.workspaceId,
    role: initial?.role,
  }), [initial?.role, initial?.workspaceId, initial?.workspaceSlug, params?.workspaceSlug]);
}
