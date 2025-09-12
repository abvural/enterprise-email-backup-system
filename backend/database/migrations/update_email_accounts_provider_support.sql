-- Migration: Update email_accounts table for comprehensive provider support
-- Date: 2025-01-12

-- Add new columns for IMAP configuration
ALTER TABLE email_accounts 
ADD COLUMN IF NOT EXISTS imap_server VARCHAR(255),
ADD COLUMN IF NOT EXISTS imap_port INTEGER,
ADD COLUMN IF NOT EXISTS imap_security VARCHAR(50),
ADD COLUMN IF NOT EXISTS auth_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS provider_settings JSONB;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_accounts_provider ON email_accounts(provider);
CREATE INDEX IF NOT EXISTS idx_email_accounts_auth_method ON email_accounts(auth_method);
CREATE INDEX IF NOT EXISTS idx_email_accounts_imap_server ON email_accounts(imap_server);

-- Update provider column to support new values if needed
-- This is safe because it only expands the possible values

-- Add constraint to ensure valid provider types
ALTER TABLE email_accounts 
ADD CONSTRAINT IF NOT EXISTS chk_provider_type 
CHECK (provider IN ('gmail', 'exchange', 'office365', 'yahoo', 'outlook', 'custom_imap'));

-- Add constraint for auth methods
ALTER TABLE email_accounts 
ADD CONSTRAINT IF NOT EXISTS chk_auth_method 
CHECK (auth_method IS NULL OR auth_method IN ('password', 'oauth2', 'xoauth2', 'app_password', 'ntlm'));

-- Add constraint for IMAP security
ALTER TABLE email_accounts 
ADD CONSTRAINT IF NOT EXISTS chk_imap_security 
CHECK (imap_security IS NULL OR imap_security IN ('SSL', 'TLS', 'STARTTLS', 'NONE'));

-- Comments for documentation
COMMENT ON COLUMN email_accounts.provider IS 'Email provider type: gmail, exchange, office365, yahoo, outlook, custom_imap';
COMMENT ON COLUMN email_accounts.auth_method IS 'Authentication method: password, oauth2, xoauth2, app_password, ntlm';
COMMENT ON COLUMN email_accounts.imap_server IS 'IMAP server hostname for IMAP-based providers';
COMMENT ON COLUMN email_accounts.imap_port IS 'IMAP server port number';
COMMENT ON COLUMN email_accounts.imap_security IS 'IMAP connection security: SSL, TLS, STARTTLS, NONE';
COMMENT ON COLUMN email_accounts.provider_settings IS 'JSON field for provider-specific configuration';