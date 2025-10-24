-- Add consultations table to the database schema
-- This table stores customer consultation requests

CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    type VARCHAR(50) NOT NULL CHECK (type IN ('design', 'booking')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    consultation_type VARCHAR(50), -- Same as type, for backward compatibility
    preferred_date DATE,
    preferred_time VARCHAR(50),
    consultation_instructions TEXT,
    height VARCHAR(50),
    sizes JSONB,
    additional_instructions TEXT,
    design_urls JSONB,
    photo_urls JSONB,
    measurements_url TEXT,
    inspiration_url TEXT,
    photo_url TEXT,
    recaptcha_token TEXT,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_type ON consultations(type);
CREATE INDEX IF NOT EXISTS idx_consultations_email ON consultations(email);
CREATE INDEX IF NOT EXISTS idx_consultations_created_at ON consultations(created_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_consultations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_consultations_updated_at_trigger
    BEFORE UPDATE ON consultations
    FOR EACH ROW
    EXECUTE FUNCTION update_consultations_updated_at();
