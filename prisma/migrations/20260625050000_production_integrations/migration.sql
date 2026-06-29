-- Persist real AI image generation details and provider analytics responses.
ALTER TABLE "campaign_assets"
  ADD COLUMN "prompt" TEXT,
  ADD COLUMN "generation_model" TEXT,
  ADD COLUMN "generation_cost" DECIMAL(10, 6),
  ADD COLUMN "provider_response" JSONB;

ALTER TABLE "analytics_snapshots"
  ADD COLUMN "provider_response" JSONB;

-- Store the learning agent's recommendations against the real campaign data it analyzed.
CREATE TABLE "ai_recommendations" (
  "id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "wins" TEXT[],
  "opportunities" TEXT[],
  "next_experiments" TEXT[],
  "source_snapshot_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ai_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_recommendations_campaign_id_created_at_idx" ON "ai_recommendations"("campaign_id", "created_at");
CREATE INDEX "ai_recommendations_workspace_id_created_at_idx" ON "ai_recommendations"("workspace_id", "created_at");

ALTER TABLE "ai_recommendations"
  ADD CONSTRAINT "ai_recommendations_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_recommendations"
  ADD CONSTRAINT "ai_recommendations_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
