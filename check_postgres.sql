-- Check PostgreSQL version
SELECT version();

-- Create database if not exists
SELECT 'CREATE DATABASE email_backup_mvp'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'email_backup_mvp');

-- List existing databases
SELECT datname FROM pg_database WHERE datistemplate = false;
