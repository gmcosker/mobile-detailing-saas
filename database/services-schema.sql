-- Services table for mobile detailing SaaS
-- Each detailer can manage their own service offerings

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    detailer_id UUID NOT NULL REFERENCES detailers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration INTEGER NOT NULL, -- Duration in minutes
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0, -- For custom ordering
    category VARCHAR(100) DEFAULT 'General', -- Exterior, Interior, Packages, etc.
    created_by UUID REFERENCES detailers(id),
    updated_by UUID REFERENCES detailers(id)
);

-- Add indexes for better performance
CREATE INDEX idx_services_detailer_id ON services(detailer_id);
CREATE INDEX idx_services_active ON services(is_active);
CREATE INDEX idx_services_display_order ON services(display_order);

-- Add RLS (Row Level Security) policies
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Policy: Detailers can only see their own services
CREATE POLICY "Detailers can view own services" ON services
    FOR SELECT USING (detailer_id = auth.uid()::uuid);

-- Policy: Detailers can insert their own services
CREATE POLICY "Detailers can insert own services" ON services
    FOR INSERT WITH CHECK (detailer_id = auth.uid()::uuid);

-- Policy: Detailers can update their own services
CREATE POLICY "Detailers can update own services" ON services
    FOR UPDATE USING (detailer_id = auth.uid()::uuid);

-- Policy: Detailers can delete their own services
CREATE POLICY "Detailers can delete own services" ON services
    FOR DELETE USING (detailer_id = auth.uid()::uuid);

-- Insert sample services for the demo detailer
INSERT INTO services (detailer_id, name, description, price, duration, display_order, category) VALUES
(
    (SELECT id FROM detailers WHERE detailer_id = 'test-detailer' LIMIT 1),
    'Basic Wash',
    'Exterior wash with premium soap and rinse',
    25.00,
    30,
    1,
    'Exterior'
),
(
    (SELECT id FROM detailers WHERE detailer_id = 'test-detailer' LIMIT 1),
    'Wash & Wax',
    'Complete exterior wash with hand wax application',
    45.00,
    60,
    2,
    'Exterior'
),
(
    (SELECT id FROM detailers WHERE detailer_id = 'test-detailer' LIMIT 1),
    'Full Detail',
    'Complete interior and exterior detailing package',
    150.00,
    180,
    3,
    'Complete'
),
(
    (SELECT id FROM detailers WHERE detailer_id = 'test-detailer' LIMIT 1),
    'Interior Detail',
    'Deep interior cleaning and protection',
    75.00,
    120,
    4,
    'Interior'
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_services_updated_at();
