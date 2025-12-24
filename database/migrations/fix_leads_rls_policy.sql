-- Fix RLS policy for leads table to allow public inserts
-- This ensures the email capture form can save leads

-- Drop existing policy if it exists (to recreate it correctly)
DROP POLICY IF EXISTS "Allow public inserts for leads" ON leads;

-- Create the policy to allow public inserts
CREATE POLICY "Allow public inserts for leads" ON leads 
    FOR INSERT 
    TO public 
    WITH CHECK (true);

-- Verify RLS is enabled
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

