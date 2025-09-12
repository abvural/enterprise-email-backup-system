-- Run this script to apply the incremental sync migration
-- Database: email_backup_mvp
-- Connection: 172.25.1.148:5432

\echo 'Applying incremental sync migration...'

-- Connect to the database
\c email_backup_mvp

-- Add last_sync_date column to email_accounts table
ALTER TABLE email_accounts 
ADD COLUMN last_sync_date TIMESTAMP;

-- Add index for better performance on last_sync_date queries
CREATE INDEX idx_email_accounts_last_sync_date ON email_accounts(last_sync_date);

-- Add comments for documentation
COMMENT ON COLUMN email_accounts.last_sync_date IS 'Timestamp of the last successful email sync completion';
COMMENT ON INDEX idx_email_accounts_last_sync_date IS 'Index to optimize incremental sync date queries';

\echo 'Migration completed successfully!'
\echo 'EmailAccount table now includes last_sync_date field for incremental sync optimization.'