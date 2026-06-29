-- Phase 1 Marketing Platform extensions.
-- Existing content/image/video tables stay intact; these tables add campaign
-- draft, Meta campaign, analytics, recommendation, and history state.

ALTER TABLE "brand_profiles"
ADD COLUMN IF NOT EXISTS "primary_goal" TEXT,
ADD COLUMN IF NOT EXISTS "budget" DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS "location" TEXT,
ADD COLUMN IF NOT EXISTS "products_services" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "campaigns"
ADD COLUMN IF NOT EXISTS "offer" TEXT,
ADD COLUMN IF NOT EXISTS "notes" TEXT;

CREATE TABLE IF NOT EXISTS "campaign_drafts" (
  "id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "name" TEXT NOT NULL,
  "primary_text" TEXT NOT NULL,
  "headline" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "call_to_action" TEXT NOT NULL,
  "instagram_caption" TEXT NOT NULL,
  "facebook_caption" TEXT NOT NULL,
  "hashtags" TEXT[] NOT NULL,
  "pinterest_title" TEXT NOT NULL,
  "pinterest_description" TEXT NOT NULL,
  "alt_text" TEXT NOT NULL,
  "creative_direction" TEXT NOT NULL,
  "status" "post_statuses" NOT NULL DEFAULT 'GENERATED',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "campaign_drafts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "meta_campaigns" (
  "id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "external_id" TEXT,
  "objective" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PAUSED',
  "budget" DECIMAL(10, 2),
  "raw_response" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "meta_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "meta_ad_sets" (
  "id" TEXT NOT NULL,
  "meta_campaign_id" TEXT NOT NULL,
  "external_id" TEXT,
  "name" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PAUSED',
  "daily_budget" DECIMAL(10, 2),
  "targeting" JSONB,
  "raw_response" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "meta_ad_sets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "meta_ads" (
  "id" TEXT NOT NULL,
  "meta_campaign_id" TEXT NOT NULL,
  "meta_ad_set_id" TEXT,
  "generated_post_id" TEXT,
  "external_id" TEXT,
  "creative_id" TEXT,
  "name" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PAUSED',
  "raw_response" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "meta_ads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "campaign_analytics" (
  "id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "spend" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "reach" INTEGER NOT NULL DEFAULT 0,
  "impressions" INTEGER NOT NULL DEFAULT 0,
  "clicks" INTEGER NOT NULL DEFAULT 0,
  "ctr" DOUBLE PRECISION,
  "cpm" DECIMAL(10, 4),
  "cpc" DECIMAL(10, 4),
  "frequency" DOUBLE PRECISION,
  "conversions" INTEGER NOT NULL DEFAULT 0,
  "roas" DOUBLE PRECISION,
  "engagement" INTEGER NOT NULL DEFAULT 0,
  "comments" INTEGER NOT NULL DEFAULT 0,
  "shares" INTEGER NOT NULL DEFAULT 0,
  "likes" INTEGER NOT NULL DEFAULT 0,
  "source" TEXT NOT NULL DEFAULT 'meta',
  "provider_response" JSONB,
  "snapshot_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "campaign_analytics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "campaign_recommendations" (
  "id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "recommendation" TEXT NOT NULL,
  "metric" TEXT,
  "severity" TEXT NOT NULL DEFAULT 'info',
  "status" TEXT NOT NULL DEFAULT 'open',
  "source" TEXT NOT NULL DEFAULT 'rule_based',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "campaign_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "campaign_history" (
  "id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "user_id" TEXT,
  "action" TEXT NOT NULL,
  "details" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "campaign_history_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "meta_campaigns_campaign_id_key" ON "meta_campaigns"("campaign_id");
CREATE UNIQUE INDEX IF NOT EXISTS "meta_campaigns_external_id_key" ON "meta_campaigns"("external_id");
CREATE UNIQUE INDEX IF NOT EXISTS "meta_ad_sets_external_id_key" ON "meta_ad_sets"("external_id");
CREATE UNIQUE INDEX IF NOT EXISTS "meta_ads_external_id_key" ON "meta_ads"("external_id");

CREATE INDEX IF NOT EXISTS "campaign_drafts_campaign_id_idx" ON "campaign_drafts"("campaign_id");
CREATE INDEX IF NOT EXISTS "campaign_drafts_status_idx" ON "campaign_drafts"("status");
CREATE INDEX IF NOT EXISTS "meta_campaigns_workspace_id_idx" ON "meta_campaigns"("workspace_id");
CREATE INDEX IF NOT EXISTS "meta_campaigns_status_idx" ON "meta_campaigns"("status");
CREATE INDEX IF NOT EXISTS "meta_ad_sets_meta_campaign_id_idx" ON "meta_ad_sets"("meta_campaign_id");
CREATE INDEX IF NOT EXISTS "meta_ad_sets_status_idx" ON "meta_ad_sets"("status");
CREATE INDEX IF NOT EXISTS "meta_ads_meta_campaign_id_idx" ON "meta_ads"("meta_campaign_id");
CREATE INDEX IF NOT EXISTS "meta_ads_meta_ad_set_id_idx" ON "meta_ads"("meta_ad_set_id");
CREATE INDEX IF NOT EXISTS "meta_ads_generated_post_id_idx" ON "meta_ads"("generated_post_id");
CREATE INDEX IF NOT EXISTS "meta_ads_status_idx" ON "meta_ads"("status");
CREATE INDEX IF NOT EXISTS "campaign_analytics_campaign_id_snapshot_date_idx" ON "campaign_analytics"("campaign_id", "snapshot_date");
CREATE INDEX IF NOT EXISTS "campaign_analytics_source_idx" ON "campaign_analytics"("source");
CREATE INDEX IF NOT EXISTS "campaign_recommendations_campaign_id_created_at_idx" ON "campaign_recommendations"("campaign_id", "created_at");
CREATE INDEX IF NOT EXISTS "campaign_recommendations_status_idx" ON "campaign_recommendations"("status");
CREATE INDEX IF NOT EXISTS "campaign_recommendations_severity_idx" ON "campaign_recommendations"("severity");
CREATE INDEX IF NOT EXISTS "campaign_history_campaign_id_created_at_idx" ON "campaign_history"("campaign_id", "created_at");
CREATE INDEX IF NOT EXISTS "campaign_history_user_id_idx" ON "campaign_history"("user_id");
CREATE INDEX IF NOT EXISTS "campaign_history_action_idx" ON "campaign_history"("action");

ALTER TABLE "campaign_drafts" ADD CONSTRAINT "campaign_drafts_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meta_campaigns" ADD CONSTRAINT "meta_campaigns_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meta_campaigns" ADD CONSTRAINT "meta_campaigns_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meta_ad_sets" ADD CONSTRAINT "meta_ad_sets_meta_campaign_id_fkey" FOREIGN KEY ("meta_campaign_id") REFERENCES "meta_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meta_ads" ADD CONSTRAINT "meta_ads_meta_campaign_id_fkey" FOREIGN KEY ("meta_campaign_id") REFERENCES "meta_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meta_ads" ADD CONSTRAINT "meta_ads_meta_ad_set_id_fkey" FOREIGN KEY ("meta_ad_set_id") REFERENCES "meta_ad_sets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "meta_ads" ADD CONSTRAINT "meta_ads_generated_post_id_fkey" FOREIGN KEY ("generated_post_id") REFERENCES "generated_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "campaign_analytics" ADD CONSTRAINT "campaign_analytics_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "campaign_recommendations" ADD CONSTRAINT "campaign_recommendations_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "campaign_history" ADD CONSTRAINT "campaign_history_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "campaign_history" ADD CONSTRAINT "campaign_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
