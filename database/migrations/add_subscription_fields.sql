-- Add subscription fields to detailers table
-- Migration: Add subscription and trial tracking fields

ALTER TABLE detailers 
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'trial' 
  CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled')),
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) 
  CHECK (subscription_plan IN ('starter', 'professional', 'business')),
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster subscription status queries
CREATE INDEX IF NOT EXISTS idx_detailers_subscription_status 
ON detailers(subscription_status);

CREATE INDEX IF NOT EXISTS idx_detailers_trial_ends_at 
ON detailers(trial_ends_at);

CREATE INDEX IF NOT EXISTS idx_detailers_subscription_ends_at 
ON detailers(subscription_ends_at);

