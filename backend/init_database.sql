-- Email Backup MVP Database Schema
-- PostgreSQL 15+

-- Create database (run this as postgres user)
-- CREATE DATABASE email_backup_mvp;

-- Connect to email_backup_mvp database
-- \c email_backup_mvp

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if exists (for clean setup)
DROP TABLE IF EXISTS email_index CASCADE;
DROP TABLE IF EXISTS email_accounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users table (minimal)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Email accounts table (Gmail + Exchange)
CREATE TABLE email_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('gmail', 'exchange', 'imap')),
    
    -- Gmail OAuth2 fields
    access_token TEXT,
    refresh_token TEXT,
    token_expiry TIMESTAMP,
    
    -- Exchange EWS fields
    server_url VARCHAR(500),
    domain VARCHAR(100),
    username VARCHAR(255),
    password TEXT, -- encrypted
    
    -- Common fields
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, email)
);

-- 3. Email index table (minimal for fast search)
CREATE TABLE email_index (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
    message_id VARCHAR(500) NOT NULL,
    subject TEXT,
    sender_email VARCHAR(255),
    sender_name VARCHAR(255),
    recipient_emails TEXT[], -- PostgreSQL array
    email_date TIMESTAMP,
    folder VARCHAR(50) DEFAULT 'INBOX',
    has_attachments BOOLEAN DEFAULT false,
    minio_path VARCHAR(500) NOT NULL, -- Path to JSON in MinIO
    sync_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(account_id, message_id)
);

-- Create indexes for performance
CREATE INDEX idx_email_accounts_user_id ON email_accounts(user_id);
CREATE INDEX idx_email_accounts_email ON email_accounts(email);
CREATE INDEX idx_email_index_account_id ON email_index(account_id);
CREATE INDEX idx_email_index_email_date ON email_index(email_date DESC);
CREATE INDEX idx_email_index_sender_email ON email_index(sender_email);
CREATE INDEX idx_email_index_subject ON email_index(subject);

-- Insert test users (password: Test123456! - bcrypt hash)
INSERT INTO users (email, password_hash) VALUES 
('test@example.com', '$2a$10$YourHashHere'), -- Replace with actual bcrypt hash
('admin@example.com', '$2a$10$YourHashHere'); -- Replace with actual bcrypt hash

-- Create update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_accounts_updated_at BEFORE UPDATE ON email_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify setup
SELECT 
    'users' as table_name, 
    COUNT(*) as row_count 
FROM users
UNION ALL
SELECT 
    'email_accounts', 
    COUNT(*) 
FROM email_accounts
UNION ALL
SELECT 
    'email_index', 
    COUNT(*) 
FROM email_index;

-- Success message
SELECT 'Database setup completed successfully!' as status;