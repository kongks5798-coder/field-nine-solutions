-- ============================================
-- Add LemonSqueezy fields to subscriptions table
-- ============================================

-- Add LemonSqueezy columns if they don't exist
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS lemonsqueezy_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS lemonsqueezy_subscription_id TEXT;

-- Create index for LemonSqueezy customer ID
CREATE INDEX IF NOT EXISTS idx_subscriptions_lemonsqueezy_customer
  ON subscriptions(lemonsqueezy_customer_id);

-- Create index for LemonSqueezy subscription ID
CREATE INDEX IF NOT EXISTS idx_subscriptions_lemonsqueezy_subscription
  ON subscriptions(lemonsqueezy_subscription_id);
