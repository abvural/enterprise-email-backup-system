-- Migration: Add Organization Structure
-- Date: 2025-01-13
-- Description: Add 5-tier organization hierarchy (Admin -> Distributor -> Dealer -> Client -> End User)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL, -- 'admin', 'distributor', 'dealer', 'client', 'end_user'
    display_name VARCHAR(100) NOT NULL,
    permissions JSONB DEFAULT '[]'::jsonb, -- Array of permission strings
    description TEXT,
    level INTEGER NOT NULL, -- Hierarchy level: 1=admin, 2=distributor, 3=dealer, 4=client, 5=end_user
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('system', 'distributor', 'dealer', 'client')), -- org type
    parent_org_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- hierarchical structure
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Organization settings
    settings JSONB DEFAULT '{}'::jsonb,
    
    -- Quota limits
    max_users INTEGER DEFAULT NULL, -- NULL means unlimited
    max_storage_gb INTEGER DEFAULT NULL, -- NULL means unlimited
    max_email_accounts INTEGER DEFAULT NULL, -- NULL means unlimited
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(name, parent_org_id) -- Unique name within parent
);

-- 3. Create user_organizations table (many-to-many with roles)
CREATE TABLE IF NOT EXISTS user_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    is_primary BOOLEAN DEFAULT false, -- Primary organization for user
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, organization_id) -- User can have only one role per organization
);

-- 4. Create organization_settings table for detailed configurations
CREATE TABLE IF NOT EXISTS organization_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    max_users INTEGER DEFAULT NULL,
    max_storage_gb INTEGER DEFAULT NULL,
    max_email_accounts INTEGER DEFAULT NULL,
    
    -- Feature flags
    features JSONB DEFAULT '{
        "email_backup": true,
        "storage_analytics": true,
        "user_management": true,
        "api_access": false
    }'::jsonb,
    
    -- Email retention policy
    email_retention_days INTEGER DEFAULT NULL, -- NULL means no limit
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(org_id)
);

-- 5. Add role_id to users table for backward compatibility
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_org_id UUID REFERENCES organizations(id);

-- 6. Create sync_histories table if it doesn't exist (for existing functionality)
CREATE TABLE IF NOT EXISTS sync_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
    sync_type VARCHAR(20) NOT NULL CHECK (sync_type IN ('full', 'incremental')),
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    emails_processed INTEGER DEFAULT 0,
    emails_added INTEGER DEFAULT 0,
    emails_updated INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (name, display_name, permissions, description, level) VALUES 
('admin', 'System Administrator', '[
    "system.manage",
    "users.create", "users.read", "users.update", "users.delete",
    "organizations.create", "organizations.read", "organizations.update", "organizations.delete",
    "distributors.create", "distributors.read", "distributors.update", "distributors.delete",
    "dealers.create", "dealers.read", "dealers.update", "dealers.delete",
    "clients.create", "clients.read", "clients.update", "clients.delete",
    "emails.read", "emails.manage",
    "reports.view", "settings.manage"
]'::jsonb, 'System administrator with full access', 1),

('distributor', 'Distributor', '[
    "dealers.create", "dealers.read", "dealers.update", "dealers.delete",
    "clients.create", "clients.read", "clients.update", "clients.delete", 
    "users.create", "users.read", "users.update", "users.delete",
    "organizations.read", "organizations.update",
    "reports.view"
]'::jsonb, 'Manages multiple dealers and their clients', 2),

('dealer', 'Dealer', '[
    "clients.create", "clients.read", "clients.update", "clients.delete",
    "users.create", "users.read", "users.update", "users.delete",
    "organizations.read", "organizations.update",
    "reports.view"
]'::jsonb, 'Manages multiple clients and their users', 3),

('client', 'Client Administrator', '[
    "users.create", "users.read", "users.update", "users.delete",
    "emails.read", "emails.manage",
    "organizations.read", "organizations.update",
    "reports.view"
]'::jsonb, 'Manages end users within their organization', 4),

('end_user', 'End User', '[
    "emails.read", "emails.manage", "accounts.create", "accounts.read", "accounts.update", "accounts.delete"
]'::jsonb, 'Regular user with email backup functionality', 5)
ON CONFLICT (name) DO NOTHING;

-- Create system organization
INSERT INTO organizations (name, type, parent_org_id, created_by, is_active) VALUES 
('System Organization', 'system', NULL, NULL, true)
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_parent_id ON organizations(parent_org_id);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_org_id ON user_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_role_id ON user_organizations(role_id);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_primary_org_id ON users(primary_org_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to new tables
CREATE TRIGGER update_roles_updated_at 
    BEFORE UPDATE ON roles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at 
    BEFORE UPDATE ON organizations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_organizations_updated_at 
    BEFORE UPDATE ON user_organizations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_settings_updated_at 
    BEFORE UPDATE ON organization_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify the migration
SELECT 
    'roles' as table_name, 
    COUNT(*) as row_count 
FROM roles
UNION ALL
SELECT 
    'organizations', 
    COUNT(*) 
FROM organizations
UNION ALL
SELECT 
    'user_organizations', 
    COUNT(*) 
FROM user_organizations
UNION ALL
SELECT 
    'organization_settings', 
    COUNT(*) 
FROM organization_settings;

-- Success message
SELECT 'Organization structure migration completed successfully!' as status;