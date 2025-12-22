-- Create leads table for email capture from free guide
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email VARCHAR(255) NOT NULL UNIQUE,
    source VARCHAR(100) DEFAULT 'free_guide',
    subscribed BOOLEAN DEFAULT true,
    notes TEXT
);

-- Create index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for lead capture form)
CREATE POLICY "Allow public inserts for leads" ON leads 
    FOR INSERT 
    TO public 
    WITH CHECK (true);

-- Allow authenticated reads (for admin/dashboard access)
CREATE POLICY "Allow authenticated reads for leads" ON leads 
    FOR SELECT 
    TO authenticated 
    USING (true);













