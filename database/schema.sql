-- Mobile Detailing SaaS Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret-here';

-- Detailers table
CREATE TABLE detailers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    business_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50) NOT NULL,
    detailer_id VARCHAR(50) NOT NULL UNIQUE, -- For booking links like /book/detailer-id
    stripe_account_id VARCHAR(255), -- Stripe Connect account
    is_active BOOLEAN DEFAULT true
);

-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    address TEXT,
    notes TEXT
);

-- Appointments table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    detailer_id UUID NOT NULL REFERENCES detailers(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    service_type VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    total_amount DECIMAL(10,2),
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    payment_status VARCHAR(50) CHECK (payment_status IN ('pending', 'paid', 'failed')),
    stripe_payment_intent_id VARCHAR(255)
);

-- Photos table
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL, -- Supabase storage path
    file_name VARCHAR(255) NOT NULL,
    photo_type VARCHAR(50) NOT NULL CHECK (photo_type IN ('before', 'after', 'during')),
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_detailers_detailer_id ON detailers(detailer_id);
CREATE INDEX idx_detailers_email ON detailers(email);
CREATE INDEX idx_appointments_detailer_id ON appointments(detailer_id);
CREATE INDEX idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX idx_appointments_scheduled_date ON appointments(scheduled_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_photos_appointment_id ON photos(appointment_id);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_detailers_updated_at BEFORE UPDATE ON detailers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security policies (for future multi-tenant support)
ALTER TABLE detailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (we'll restrict this later when we add auth)
CREATE POLICY "Allow all for detailers" ON detailers FOR ALL USING (true);
CREATE POLICY "Allow all for customers" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all for appointments" ON appointments FOR ALL USING (true);
CREATE POLICY "Allow all for photos" ON photos FOR ALL USING (true);

-- Sample data for development
INSERT INTO detailers (business_name, contact_name, email, phone, detailer_id) VALUES
('Premium Auto Detailing', 'John Smith', 'john@premiumauto.com', '555-0123', 'premium-auto');

INSERT INTO customers (name, email, phone, address) VALUES
('Jane Doe', 'jane@example.com', '555-0456', '123 Main St, City, State 12345'),
('Bob Johnson', 'bob@example.com', '555-0789', '456 Oak Ave, City, State 12345');

-- Sample appointment
INSERT INTO appointments (detailer_id, customer_id, scheduled_date, scheduled_time, service_type, total_amount) VALUES
(
    (SELECT id FROM detailers WHERE detailer_id = 'premium-auto'),
    (SELECT id FROM customers WHERE name = 'Jane Doe'),
    CURRENT_DATE + INTERVAL '3 days',
    '10:00:00',
    'Full Detail',
    150.00
);

