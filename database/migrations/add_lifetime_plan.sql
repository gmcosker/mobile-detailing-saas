-- Add 'lifetime' to subscription_plan CHECK constraint
-- This allows the Lifetime Deal plan to be stored in the database

-- First, drop the existing constraint
ALTER TABLE detailers 
DROP CONSTRAINT IF EXISTS detailers_subscription_plan_check;

-- Add the constraint with 'lifetime' included
ALTER TABLE detailers 
ADD CONSTRAINT detailers_subscription_plan_check 
CHECK (subscription_plan IN ('starter', 'professional', 'business', 'lifetime'));

