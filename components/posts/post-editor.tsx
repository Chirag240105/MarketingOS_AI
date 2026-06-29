"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PostEditor({ body, caption, disabled = true }: { body: string; caption?: string | null; disabled?: boolean }) {
  const [draft, setDraft] = useState(caption || body);
  return (
    <div className="rounded-lg border border-border bg-bg-base p-4">
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        disabled={disabled}
        className="min-h-32 w-full resize-y rounded-lg border border-border bg-bg-surface p-3 text-sm text-slate-100 outline-none disabled:opacity-70"
      />
      <div className="mt-3 flex justify-end">
        <Button size="sm" variant="secondary" disabled>
          Save draft
        </Button>
      </div>
    </div>
  );
}
