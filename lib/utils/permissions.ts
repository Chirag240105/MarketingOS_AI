import type { MembershipRole } from "@/lib/generated/prisma/client";

export const permissions: Record<MembershipRole, string[]> = {
  OWNER: ["workspace:manage", "campaign:create", "campaign:edit", "post:approve", "post:publish", "team:manage", "billing:manage"],
  ADMIN: ["workspace:manage", "campaign:create", "campaign:edit", "post:approve", "post:publish", "team:manage"],
  EDITOR: ["campaign:create", "campaign:edit", "post:approve"],
  MEMBER: ["campaign:create"],
  VIEWER: [],
};

export function hasPermission(role: MembershipRole, permission: string) {
  return permissions[role].includes(permission);
}
