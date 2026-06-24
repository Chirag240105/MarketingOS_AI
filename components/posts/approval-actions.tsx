"use client";

import { useTransition } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import { reviewPost } from "@/actions/approval";
import { Button } from "@/components/ui/button";

export function ApprovalActions({ postId }: { postId: string }) {
  const [pending, startTransition] = useTransition();
  function review(status: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED") {
    startTransition(async () => { await reviewPost({ postId, status }); });
  }
  return <div className="flex gap-2"><Button size="sm" onClick={() => review("APPROVED")} disabled={pending}><Check className="size-3.5" />Approve</Button><Button size="sm" variant="secondary" onClick={() => review("CHANGES_REQUESTED")} disabled={pending}><RotateCcw className="size-3.5" />Changes</Button><Button size="sm" variant="ghost" onClick={() => review("REJECTED")} disabled={pending}><X className="size-3.5" />Reject</Button></div>;
}
