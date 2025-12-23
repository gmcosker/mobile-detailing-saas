-- Add first_name column to leads table for email personalization
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);

-- Create index on first_name for faster queries
CREATE INDEX IF NOT EXISTS idx_leads_first_name ON leads(first_name);

