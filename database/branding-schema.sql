-- Branding customization schema for detailers
-- This allows each detailer to customize their customer-facing booking experience

-- Branding table
CREATE TABLE branding (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    detailer_id UUID NOT NULL REFERENCES detailers(id) ON DELETE CASCADE,
    logo_url VARCHAR(500), -- URL to logo in Supabase storage
    logo_position VARCHAR(20) DEFAULT 'header' CHECK (logo_position IN ('header', 'footer', 'both')),
    primary_color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for primary elements
    secondary_color VARCHAR(7) DEFAULT '#F3F4F6', -- Hex color for secondary elements
    text_color VARCHAR(7) DEFAULT '#1F2937', -- Hex color for text
    font_family VARCHAR(50) DEFAULT 'Inter', -- Font family name
    custom_welcome_message TEXT, -- Custom message for customers
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_branding_detailer_id ON branding(detailer_id);

-- Updated_at trigger for branding table
CREATE TRIGGER update_branding_updated_at 
    BEFORE UPDATE ON branding 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security for branding
ALTER TABLE branding ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (we'll restrict this later when we add auth)
CREATE POLICY "Allow all for branding" ON branding FOR ALL USING (true);

-- Sample branding data for the existing detailer
INSERT INTO branding (detailer_id, primary_color, secondary_color, text_color, font_family) VALUES
(
    (SELECT id FROM detailers WHERE detailer_id = 'premium-auto'),
    '#3B82F6', -- Blue
    '#F3F4F6', -- Light gray
    '#1F2937', -- Dark gray
    'Inter'
);



