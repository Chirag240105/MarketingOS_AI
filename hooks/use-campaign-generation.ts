"use client";

import { useCallback, useState } from "react";

export function useCampaignGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generate = useCallback(async (campaignId: string) => {
    setIsGenerating(true); setError(null);
    try {
      const response = await fetch("/api/ai/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ campaignId }) });
      const result = await response.json() as { ok: boolean; error?: string };
      if (!result.ok) throw new Error(result.error);
      return result;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Generation failed");
      throw cause;
    } finally { setIsGenerating(false); }
  }, []);
  return { generate, isGenerating, error };
}
