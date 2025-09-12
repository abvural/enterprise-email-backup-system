-- Migration: Add last_sync_date column to email_accounts table
-- Purpose: Enable incremental email sync optimization
-- Date: 2025-01-14

-- Add last_sync_date column to email_accounts table
ALTER TABLE email_accounts 
ADD COLUMN last_sync_date TIMESTAMP;

-- Add index for better performance on last_sync_date queries
CREATE INDEX idx_email_accounts_last_sync_date ON email_accounts(last_sync_date);

-- Add comments for documentation
COMMENT ON COLUMN email_accounts.last_sync_date IS 'Timestamp of the last successful email sync completion';
COMMENT ON INDEX idx_email_accounts_last_sync_date IS 'Index to optimize incremental sync date queries';