"use client";

import { useState, useTransition } from "react";
import { updateWorkspaceSettings } from "@/actions/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { notify } from "@/lib/toast";

export function GeneralSettingsForm({
  workspaceId,
  name,
  colors,
}: {
  workspaceId: string;
  name: string;
  colors: string[];
}) {
  const [pending, startTransition] = useTransition();
  const [workspaceName, setWorkspaceName] = useState(name);
  const [brandColors, setBrandColors] = useState(colors.length ? colors : ["#6366F1", "#10B981"]);

  function updateColor(index: number, value: string) {
    setBrandColors((current) => current.map((color, itemIndex) => itemIndex === index ? value : color));
  }

  function submit() {
    startTransition(async () => {
      await notify.promise(updateWorkspaceSettings({ workspaceId, name: workspaceName, brandColors }), {
        loading: "Saving settings...",
        success: "Settings saved",
        error: "Settings could not be saved",
      });
    });
  }

  return (
    <div className="mt-5 grid gap-4">
      <label className="text-sm text-slate-400">
        Workspace name
        <Input className="mt-2" value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} />
      </label>
      <div>
        <p className="text-sm text-slate-400">Brand colors</p>
        <div className="mt-2 flex gap-2">
          {brandColors.map((color, index) => (
            <input key={index} aria-label={`Brand color ${index + 1}`} className="size-10 rounded-lg border border-border bg-bg-base p-1" value={color} type="color" onChange={(event) => updateColor(index, event.target.value)} />
          ))}
        </div>
      </div>
      <Button className="w-fit" onClick={submit} disabled={pending || workspaceName.trim().length < 2}>Save general settings</Button>
    </div>
  );
}
