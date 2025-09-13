-- Migration: Add Storage Tracking System
-- This migration adds storage size tracking tables and columns
-- Created: 2025-01-13

BEGIN;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. Add size columns to email_indices table
ALTER TABLE email_indices 
ADD COLUMN IF NOT EXISTS email_size BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS content_size BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS attachment_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS attachment_size BIGINT DEFAULT 0;

-- Add index for performance on size queries
CREATE INDEX IF NOT EXISTS idx_email_indices_email_size ON email_indices(email_size DESC);
CREATE INDEX IF NOT EXISTS idx_email_indices_attachment_size ON email_indices(attachment_size DESC);

-- 2. Create account_storage_stats table
CREATE TABLE IF NOT EXISTS account_storage_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
    total_emails INTEGER DEFAULT 0 NOT NULL,
    total_size BIGINT DEFAULT 0 NOT NULL,
    content_size BIGINT DEFAULT 0 NOT NULL,
    attachment_size BIGINT DEFAULT 0 NOT NULL,
    attachment_count INTEGER DEFAULT 0 NOT NULL,
    last_calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(account_id)
);

-- Create indexes for account_storage_stats
CREATE INDEX IF NOT EXISTS idx_account_storage_stats_account_id ON account_storage_stats(account_id);
CREATE INDEX IF NOT EXISTS idx_account_storage_stats_total_size ON account_storage_stats(total_size DESC);

-- 3. Create folder_storage_stats table  
CREATE TABLE IF NOT EXISTS folder_storage_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
    folder_name VARCHAR(100) NOT NULL,
    total_emails INTEGER DEFAULT 0 NOT NULL,
    total_size BIGINT DEFAULT 0 NOT NULL,
    content_size BIGINT DEFAULT 0 NOT NULL,
    attachment_size BIGINT DEFAULT 0 NOT NULL,
    attachment_count INTEGER DEFAULT 0 NOT NULL,
    last_calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(account_id, folder_name)
);

-- Create indexes for folder_storage_stats
CREATE INDEX IF NOT EXISTS idx_folder_storage_stats_account_id ON folder_storage_stats(account_id);
CREATE INDEX IF NOT EXISTS idx_folder_storage_stats_folder_name ON folder_storage_stats(folder_name);
CREATE INDEX IF NOT EXISTS idx_folder_storage_stats_total_size ON folder_storage_stats(total_size DESC);

-- 4. Add update triggers for timestamp management
DROP TRIGGER IF EXISTS update_account_storage_stats_updated_at ON account_storage_stats;
CREATE TRIGGER update_account_storage_stats_updated_at 
    BEFORE UPDATE ON account_storage_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_folder_storage_stats_updated_at ON folder_storage_stats;
CREATE TRIGGER update_folder_storage_stats_updated_at 
    BEFORE UPDATE ON folder_storage_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Create function to automatically update storage stats when email_indices changes
CREATE OR REPLACE FUNCTION update_storage_stats_on_email_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Update account stats
    INSERT INTO account_storage_stats (account_id, total_emails, total_size, content_size, attachment_size, attachment_count)
    SELECT 
        account_id,
        COUNT(*) as total_emails,
        COALESCE(SUM(email_size), 0) as total_size,
        COALESCE(SUM(content_size), 0) as content_size,
        COALESCE(SUM(attachment_size), 0) as attachment_size,
        COALESCE(SUM(attachment_count), 0) as attachment_count
    FROM email_indices
    WHERE account_id = COALESCE(NEW.account_id, OLD.account_id)
    GROUP BY account_id
    ON CONFLICT (account_id) DO UPDATE SET
        total_emails = EXCLUDED.total_emails,
        total_size = EXCLUDED.total_size,
        content_size = EXCLUDED.content_size,
        attachment_size = EXCLUDED.attachment_size,
        attachment_count = EXCLUDED.attachment_count,
        last_calculated_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Update folder stats
    INSERT INTO folder_storage_stats (account_id, folder_name, total_emails, total_size, content_size, attachment_size, attachment_count)
    SELECT 
        account_id,
        folder,
        COUNT(*) as total_emails,
        COALESCE(SUM(email_size), 0) as total_size,
        COALESCE(SUM(content_size), 0) as content_size,
        COALESCE(SUM(attachment_size), 0) as attachment_size,
        COALESCE(SUM(attachment_count), 0) as attachment_count
    FROM email_indices
    WHERE account_id = COALESCE(NEW.account_id, OLD.account_id)
        AND folder = COALESCE(NEW.folder, OLD.folder)
    GROUP BY account_id, folder
    ON CONFLICT (account_id, folder_name) DO UPDATE SET
        total_emails = EXCLUDED.total_emails,
        total_size = EXCLUDED.total_size,
        content_size = EXCLUDED.content_size,
        attachment_size = EXCLUDED.attachment_size,
        attachment_count = EXCLUDED.attachment_count,
        last_calculated_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create triggers on email_indices for automatic stats updates
DROP TRIGGER IF EXISTS trigger_update_storage_stats_on_insert ON email_indices;
CREATE TRIGGER trigger_update_storage_stats_on_insert
    AFTER INSERT ON email_indices
    FOR EACH ROW EXECUTE FUNCTION update_storage_stats_on_email_change();

DROP TRIGGER IF EXISTS trigger_update_storage_stats_on_update ON email_indices;
CREATE TRIGGER trigger_update_storage_stats_on_update
    AFTER UPDATE ON email_indices
    FOR EACH ROW EXECUTE FUNCTION update_storage_stats_on_email_change();

DROP TRIGGER IF EXISTS trigger_update_storage_stats_on_delete ON email_indices;
CREATE TRIGGER trigger_update_storage_stats_on_delete
    AFTER DELETE ON email_indices
    FOR EACH ROW EXECUTE FUNCTION update_storage_stats_on_email_change();

-- 6. Add comments for documentation
COMMENT ON TABLE account_storage_stats IS 'Storage statistics per email account';
COMMENT ON TABLE folder_storage_stats IS 'Storage statistics per folder within each account';
COMMENT ON COLUMN email_indices.email_size IS 'Total size of the email in bytes (content + attachments)';
COMMENT ON COLUMN email_indices.content_size IS 'Size of email content only (no attachments) in bytes';
COMMENT ON COLUMN email_indices.attachment_count IS 'Number of attachments in the email';
COMMENT ON COLUMN email_indices.attachment_size IS 'Total size of all attachments in bytes';

COMMIT;

-- Success message
SELECT 'Storage tracking migration completed successfully!' as status;