-- Complete MarketingOS product-vision fields for the existing AIJob orchestrator.

ALTER TYPE "ai_agent_types" ADD VALUE IF NOT EXISTS 'COMPETITOR_ANALYZER';

ALTER TABLE "brand_profiles"
ADD COLUMN IF NOT EXISTS "last_analyzed_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "analysis_summary" JSONB;

ALTER TABLE "campaigns"
ADD COLUMN IF NOT EXISTS "ai_strategy_plan" JSONB,
ADD COLUMN IF NOT EXISTS "generate_video" BOOLEAN NOT NULL DEFAULT false;
