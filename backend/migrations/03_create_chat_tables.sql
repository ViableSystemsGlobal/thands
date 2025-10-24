-- Create chat system tables

-- Chat sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    user_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    is_processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'assistant')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat leads table
CREATE TABLE IF NOT EXISTS chat_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge base table
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_session_id ON chat_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_email ON chat_sessions(user_email);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_leads_session_id ON chat_leads(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_leads_status ON chat_leads(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_active ON knowledge_base(is_active);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_sessions_updated_at_trigger
    BEFORE UPDATE ON chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_sessions_updated_at();

CREATE OR REPLACE FUNCTION update_chat_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_leads_updated_at_trigger
    BEFORE UPDATE ON chat_leads
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_leads_updated_at();

CREATE OR REPLACE FUNCTION update_knowledge_base_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_knowledge_base_updated_at_trigger
    BEFORE UPDATE ON knowledge_base
    FOR EACH ROW
    EXECUTE FUNCTION update_knowledge_base_updated_at();

-- Insert sample knowledge base content
INSERT INTO knowledge_base (title, content, category) VALUES
('Bespoke Tailoring Services', 'We offer complete bespoke tailoring services for men and women. Our experienced tailors create custom-fitted garments from scratch, including suits, shirts, dresses, and more. Each piece is handcrafted to your exact measurements and preferences.', 'Services'),
('Measurement Process', 'Our measurement process involves taking 20+ precise measurements to ensure a perfect fit. We offer in-person fittings at our studio or can guide you through self-measurement with detailed instructions. All measurements are kept on file for future orders.', 'Process'),
('Fabric Selection', 'We work with premium fabrics from renowned mills worldwide. Our collection includes wool, cotton, linen, silk, and specialty fabrics. Each fabric is carefully selected for quality, durability, and comfort.', 'Materials'),
('Order Timeline', 'Typical bespoke orders take 4-6 weeks to complete. Rush orders (2-3 weeks) may be available for an additional fee. We provide regular updates throughout the process and schedule fittings as needed.', 'Timeline'),
('Pricing Information', 'Our bespoke tailoring starts at $800 for a basic suit. Prices vary based on fabric selection, complexity of design, and timeline requirements. We offer payment plans for larger orders.', 'Pricing'),
('Care Instructions', 'Proper care ensures your bespoke garments last for years. We recommend professional dry cleaning for most pieces, with specific care instructions provided for each garment.', 'Care'),
('Alterations and Repairs', 'We provide free alterations for the first 30 days after delivery. Ongoing alterations and repairs are available at reasonable rates to maintain your garments.', 'Services'),
('Consultation Process', 'We offer complimentary consultations to discuss your needs, style preferences, and budget. Consultations can be scheduled in-person or via video call.', 'Process')
ON CONFLICT DO NOTHING;
