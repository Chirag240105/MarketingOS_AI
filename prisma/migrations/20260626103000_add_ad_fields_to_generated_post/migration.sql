ALTER TABLE "generated_posts"
ADD COLUMN IF NOT EXISTS "ad_campaign_id" TEXT,
ADD COLUMN IF NOT EXISTS "ad_set_id" TEXT,
ADD COLUMN IF NOT EXISTS "ad_creative_id" TEXT,
ADD COLUMN IF NOT EXISTS "ad_id" TEXT,
ADD COLUMN IF NOT EXISTS "ad_status" TEXT;

CREATE INDEX IF NOT EXISTS "generated_posts_ad_status_idx" ON "generated_posts"("ad_status");
