-- Manual Database Migration for Incremental Email Sync
-- Execute this in your PostgreSQL client or pgAdmin

-- Connect to the email_backup_mvp database
\c email_backup_mvp;

-- Add last_sync_date column to email_accounts table
ALTER TABLE email_accounts 
ADD COLUMN IF NOT EXISTS last_sync_date TIMESTAMP;

-- Add index for better performance on last_sync_date queries
CREATE INDEX IF NOT EXISTS idx_email_accounts_last_sync_date ON email_accounts(last_sync_date);

-- Add comments for documentation
COMMENT ON COLUMN email_accounts.last_sync_date IS 'Timestamp of the last successful email sync completion';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'email_accounts' AND column_name = 'last_sync_date';

-- Check current email accounts (should now show last_sync_date column)
SELECT id, email, provider, last_sync_date, created_at
FROM email_accounts
ORDER BY created_at DESC;

-- Success message
SELECT 'Migration completed successfully! Incremental sync is now enabled.' as status;