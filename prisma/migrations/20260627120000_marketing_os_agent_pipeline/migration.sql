-- MarketingOS multi-agent workflow.
-- Adds resumable agent runs, normalized campaign platforms, agent artifacts,
-- generated assets, publishing plans, and learning insights.

ALTER TYPE "campaign_statuses" ADD VALUE IF NOT EXISTS 'BRAND_ANALYZED';
ALTER TYPE "campaign_statuses" ADD VALUE IF NOT EXISTS 'COMPETITOR_ANALYZED';
ALTER TYPE "campaign_statuses" ADD VALUE IF NOT EXISTS 'STRATEGY_READY';
ALTER TYPE "campaign_statuses" ADD VALUE IF NOT EXISTS 'COPY_READY';
ALTER TYPE "campaign_statuses" ADD VALUE IF NOT EXISTS 'CREATIVE_READY';
ALTER TYPE "campaign_statuses" ADD VALUE IF NOT EXISTS 'READY_TO_PUBLISH';
ALTER TYPE "campaign_statuses" ADD VALUE IF NOT EXISTS 'PUBLISHED';
ALTER TYPE "campaign_statuses" ADD VALUE IF NOT EXISTS 'ANALYZED';
ALTER TYPE "campaign_statuses" ADD VALUE IF NOT EXISTS 'LEARNING_UPDATED';
ALTER TYPE "campaign_statuses" ADD VALUE IF NOT EXISTS 'FAILED';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agent_run_statuses') THEN
    CREATE TYPE "agent_run_statuses" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'SKIPPED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'generated_asset_types') THEN
    CREATE TYPE "generated_asset_types" AS ENUM ('IMAGE', 'VIDEO');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'generated_asset_statuses') THEN
    CREATE TYPE "generated_asset_statuses" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "campaign_platforms" (
  "id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "platform" "social_platforms" NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "campaign_platforms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "agent_runs" (
  "id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "agent_name" TEXT NOT NULL,
  "model_used" TEXT NOT NULL,
  "input" JSONB NOT NULL,
  "output" JSONB,
  "status" "agent_run_statuses" NOT NULL DEFAULT 'PENDING',
  "error_message" TEXT,
  "retry_count" INTEGER NOT NULL DEFAULT 0,
  "started_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "agent_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "brand_analyses" (
  "id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "profile" JSONB NOT NULL,
  "summary" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "brand_analyses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "competitor_analyses" (
  "id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "competitors" JSONB NOT NULL,
  "opportunities" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "summary" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "competitor_analyses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "campaign_strategies" (
  "id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "strategy" JSONB NOT NULL,
  "content_calendar" JSONB,
  "budget_allocation" JSONB,
  "summary" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "campaign_strategies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "campaign_copies" (
  "id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "copy" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "campaign_copies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "creative_briefs" (
  "id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "brief" JSONB NOT NULL,
  "image_prompt" TEXT NOT NULL,
  "video_prompt" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "creative_briefs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "generated_assets" (
  "id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "type" "generated_asset_types" NOT NULL,
  "status" "generated_asset_statuses" NOT NULL DEFAULT 'PENDING',
  "provider" TEXT NOT NULL,
  "url" TEXT,
  "base64_ref" TEXT,
  "external_job_id" TEXT,
  "prompt" TEXT,
  "negative_prompt" TEXT,
  "model" TEXT,
  "metadata" JSONB,
  "provider_response" JSONB,
  "error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "generated_assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "publishing_plans" (
  "id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "plan" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "publishing_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "learning_insights" (
  "id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "recommendations" TEXT[] NOT NULL,
  "output" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "learning_insights_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "campaign_platforms_campaign_id_platform_key" ON "campaign_platforms"("campaign_id", "platform");
CREATE UNIQUE INDEX IF NOT EXISTS "brand_analyses_campaign_id_key" ON "brand_analyses"("campaign_id");
CREATE UNIQUE INDEX IF NOT EXISTS "competitor_analyses_campaign_id_key" ON "competitor_analyses"("campaign_id");
CREATE UNIQUE INDEX IF NOT EXISTS "campaign_strategies_campaign_id_key" ON "campaign_strategies"("campaign_id");
CREATE UNIQUE INDEX IF NOT EXISTS "campaign_copies_campaign_id_key" ON "campaign_copies"("campaign_id");
CREATE UNIQUE INDEX IF NOT EXISTS "creative_briefs_campaign_id_key" ON "creative_briefs"("campaign_id");
CREATE UNIQUE INDEX IF NOT EXISTS "publishing_plans_campaign_id_key" ON "publishing_plans"("campaign_id");

CREATE INDEX IF NOT EXISTS "campaign_platforms_campaign_id_idx" ON "campaign_platforms"("campaign_id");
CREATE INDEX IF NOT EXISTS "campaign_platforms_platform_idx" ON "campaign_platforms"("platform");
CREATE INDEX IF NOT EXISTS "agent_runs_campaign_id_idx" ON "agent_runs"("campaign_id");
CREATE INDEX IF NOT EXISTS "agent_runs_agent_name_idx" ON "agent_runs"("agent_name");
CREATE INDEX IF NOT EXISTS "agent_runs_status_idx" ON "agent_runs"("status");
CREATE INDEX IF NOT EXISTS "agent_runs_created_at_idx" ON "agent_runs"("created_at");
CREATE INDEX IF NOT EXISTS "brand_analyses_campaign_id_idx" ON "brand_analyses"("campaign_id");
CREATE INDEX IF NOT EXISTS "competitor_analyses_campaign_id_idx" ON "competitor_analyses"("campaign_id");
CREATE INDEX IF NOT EXISTS "campaign_strategies_campaign_id_idx" ON "campaign_strategies"("campaign_id");
CREATE INDEX IF NOT EXISTS "campaign_copies_campaign_id_idx" ON "campaign_copies"("campaign_id");
CREATE INDEX IF NOT EXISTS "creative_briefs_campaign_id_idx" ON "creative_briefs"("campaign_id");
CREATE INDEX IF NOT EXISTS "generated_assets_campaign_id_idx" ON "generated_assets"("campaign_id");
CREATE INDEX IF NOT EXISTS "generated_assets_type_idx" ON "generated_assets"("type");
CREATE INDEX IF NOT EXISTS "generated_assets_status_idx" ON "generated_assets"("status");
CREATE INDEX IF NOT EXISTS "generated_assets_external_job_id_idx" ON "generated_assets"("external_job_id");
CREATE INDEX IF NOT EXISTS "publishing_plans_campaign_id_idx" ON "publishing_plans"("campaign_id");
CREATE INDEX IF NOT EXISTS "learning_insights_campaign_id_created_at_idx" ON "learning_insights"("campaign_id", "created_at");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_platforms_campaign_id_fkey') THEN
    ALTER TABLE "campaign_platforms" ADD CONSTRAINT "campaign_platforms_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_runs_campaign_id_fkey') THEN
    ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'brand_analyses_campaign_id_fkey') THEN
    ALTER TABLE "brand_analyses" ADD CONSTRAINT "brand_analyses_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'competitor_analyses_campaign_id_fkey') THEN
    ALTER TABLE "competitor_analyses" ADD CONSTRAINT "competitor_analyses_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_strategies_campaign_id_fkey') THEN
    ALTER TABLE "campaign_strategies" ADD CONSTRAINT "campaign_strategies_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_copies_campaign_id_fkey') THEN
    ALTER TABLE "campaign_copies" ADD CONSTRAINT "campaign_copies_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'creative_briefs_campaign_id_fkey') THEN
    ALTER TABLE "creative_briefs" ADD CONSTRAINT "creative_briefs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'generated_assets_campaign_id_fkey') THEN
    ALTER TABLE "generated_assets" ADD CONSTRAINT "generated_assets_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'publishing_plans_campaign_id_fkey') THEN
    ALTER TABLE "publishing_plans" ADD CONSTRAINT "publishing_plans_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'learning_insights_campaign_id_fkey') THEN
    ALTER TABLE "learning_insights" ADD CONSTRAINT "learning_insights_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
