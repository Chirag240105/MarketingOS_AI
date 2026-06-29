"use client";

import { hasPermission } from "@/lib/utils/permissions";
import type { MembershipRole } from "@/lib/generated/prisma/client";

export function usePermissions(role?: MembershipRole) {
  return {
    role,
    hasPermission: (permission: string) => Boolean(role && hasPermission(role, permission)),
  };
}
