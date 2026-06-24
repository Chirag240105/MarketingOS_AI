export type WorkspaceRole = "OWNER" | "ADMIN" | "EDITOR" | "MEMBER" | "VIEWER";

export const roleRank: Record<WorkspaceRole, number> = {
  OWNER: 5,
  ADMIN: 4,
  EDITOR: 3,
  MEMBER: 2,
  VIEWER: 1,
};
