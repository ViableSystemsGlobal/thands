-- Create admin_users table for admin panel user management
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'editor', 'viewer')),
    password_hash VARCHAR(255), -- For future password authentication
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users (email);

-- Add trigger for updated_at
CREATE OR REPLACE TRIGGER update_admin_users_updated_at
BEFORE UPDATE ON admin_users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert a default admin user
INSERT INTO admin_users (email, full_name, role)
VALUES ('admin@tailoredhands.africa', 'System Administrator', 'admin')
ON CONFLICT (email) DO NOTHING;
