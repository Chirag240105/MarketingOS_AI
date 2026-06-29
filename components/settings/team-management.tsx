"use client";

import { useState, useTransition } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { inviteMember, removeMember, updateMemberRole } from "@/actions/membership";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MembershipRole } from "@/lib/generated/prisma/client";
import { notify } from "@/lib/toast";

type Member = {
  id: string;
  role: MembershipRole;
  user: { name: string | null; email: string };
};

const roles: MembershipRole[] = ["OWNER", "ADMIN", "EDITOR", "MEMBER", "VIEWER"];

export function TeamManagement({
  workspaceId,
  members,
  canManage,
  viewerRole,
}: {
  workspaceId: string;
  members: Member[];
  canManage: boolean;
  viewerRole: MembershipRole;
}) {
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<MembershipRole, "OWNER">>("MEMBER");
  const ownerCount = members.filter((member) => member.role === "OWNER").length;

  function invite() {
    startTransition(async () => {
      await notify.promise(inviteMember({ workspaceId, email, role }), {
        loading: "Adding teammate...",
        success: "Teammate added",
        error: "Could not add teammate",
      });
      setEmail("");
      setRole("MEMBER");
    });
  }

  function changeRole(membershipId: string, nextRole: MembershipRole) {
    startTransition(async () => {
      await notify.promise(updateMemberRole({ workspaceId, membershipId, role: nextRole }), {
        loading: "Updating role...",
        success: "Role updated",
        error: "Could not update role",
      });
    });
  }

  function remove(membershipId: string) {
    startTransition(async () => {
      await notify.promise(removeMember({ workspaceId, membershipId }), {
        loading: "Removing teammate...",
        success: "Teammate removed",
        error: "Could not remove teammate",
      });
    });
  }

  return (
    <div className="space-y-4">
      {canManage ? (
        <div className="grid gap-2 rounded-lg border border-border bg-bg-base p-4 sm:grid-cols-[1fr_150px_auto]">
          <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="teammate@company.com" />
          <select value={role} onChange={(event) => setRole(event.target.value as Exclude<MembershipRole, "OWNER">)} className="h-10 rounded-lg border border-border bg-bg-surface px-3 text-sm text-white">
            {roles.filter((item) => item !== "OWNER").map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <Button onClick={invite} disabled={pending || !email}>
            <UserPlus className="size-4" />
            Invite
          </Button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border">
        {members.map((member) => {
          const lockedOwner = member.role === "OWNER" && ownerCount <= 1;
          const cannotGrantOwner = viewerRole !== "OWNER";
          return (
            <div key={member.id} className="grid gap-3 border-b border-border bg-bg-base p-4 last:border-0 sm:grid-cols-[1fr_180px_auto] sm:items-center">
              <div>
                <p className="text-sm font-medium text-white">{member.user.name || member.user.email}</p>
                <p className="mt-1 text-xs text-slate-500">{member.user.email}</p>
              </div>
              {canManage ? (
                <select
                  value={member.role}
                  disabled={pending || lockedOwner}
                  onChange={(event) => changeRole(member.id, event.target.value as MembershipRole)}
                  className="h-10 rounded-lg border border-border bg-bg-surface px-3 text-sm text-white disabled:opacity-50"
                >
                  {roles.map((item) => <option key={item} value={item} disabled={item === "OWNER" && cannotGrantOwner}>{item}</option>)}
                </select>
              ) : (
                <Badge tone={member.role === "OWNER" ? "indigo" : "slate"}>{member.role}</Badge>
              )}
              {canManage ? (
                <Button variant="ghost" size="sm" onClick={() => remove(member.id)} disabled={pending || lockedOwner}>
                  <Trash2 className="size-4" />
                  Remove
                </Button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
