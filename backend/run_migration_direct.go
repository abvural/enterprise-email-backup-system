package main

import (
    "database/sql"
    "fmt"
    "io/ioutil"
    "log"
    
    _ "github.com/lib/pq"
)

func main() {
    // Database connection
    connStr := "host=172.25.1.148 port=5432 user=postgres password=avural1234 dbname=email_backup_mvp sslmode=disable"
    db, err := sql.Open("postgres", connStr)
    if err != nil {
        log.Fatal("Failed to connect to database:", err)
    }
    defer db.Close()
    
    // Test connection
    err = db.Ping()
    if err != nil {
        log.Fatal("Failed to ping database:", err)
    }
    
    fmt.Println("Connected to PostgreSQL successfully!")
    
    // Read migration file
    content, err := ioutil.ReadFile("database/migrations/add_storage_tracking.sql")
    if err != nil {
        log.Fatal("Failed to read migration file:", err)
    }
    
    fmt.Println("Running migration as a single transaction...")
    
    // Execute the entire migration as one statement
    _, err = db.Exec(string(content))
    if err != nil {
        log.Printf("Migration error: %v\n", err)
        fmt.Println("\nTrying to apply migration manually...")
        
        // Try individual critical statements
        statements := []string{
            // Enable UUID extension
            `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
            
            // Create update function
            `CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ language 'plpgsql'`,
            
            // Add columns to email_indices
            `ALTER TABLE email_indices 
            ADD COLUMN IF NOT EXISTS email_size BIGINT DEFAULT 0`,
            
            `ALTER TABLE email_indices 
            ADD COLUMN IF NOT EXISTS content_size BIGINT DEFAULT 0`,
            
            `ALTER TABLE email_indices 
            ADD COLUMN IF NOT EXISTS attachment_count INTEGER DEFAULT 0`,
            
            `ALTER TABLE email_indices 
            ADD COLUMN IF NOT EXISTS attachment_size BIGINT DEFAULT 0`,
            
            // Create account_storage_stats table
            `CREATE TABLE IF NOT EXISTS account_storage_stats (
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
            )`,
            
            // Create folder_storage_stats table
            `CREATE TABLE IF NOT EXISTS folder_storage_stats (
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
            )`,
            
            // Create indexes
            `CREATE INDEX IF NOT EXISTS idx_email_indices_email_size ON email_indices(email_size DESC)`,
            `CREATE INDEX IF NOT EXISTS idx_email_indices_attachment_size ON email_indices(attachment_size DESC)`,
            `CREATE INDEX IF NOT EXISTS idx_account_storage_stats_account_id ON account_storage_stats(account_id)`,
            `CREATE INDEX IF NOT EXISTS idx_account_storage_stats_total_size ON account_storage_stats(total_size DESC)`,
            `CREATE INDEX IF NOT EXISTS idx_folder_storage_stats_account_id ON folder_storage_stats(account_id)`,
            `CREATE INDEX IF NOT EXISTS idx_folder_storage_stats_folder_name ON folder_storage_stats(folder_name)`,
            `CREATE INDEX IF NOT EXISTS idx_folder_storage_stats_total_size ON folder_storage_stats(total_size DESC)`,
        }
        
        for i, stmt := range statements {
            fmt.Printf("Executing statement %d/%d...\n", i+1, len(statements))
            _, err := db.Exec(stmt)
            if err != nil {
                fmt.Printf("  ❌ Error: %v\n", err)
            } else {
                fmt.Printf("  ✅ Success\n")
            }
        }
    } else {
        fmt.Println("✅ Migration applied successfully!")
    }
    
    // Verify tables and columns
    fmt.Println("\n=== Verification ===")
    
    // Check tables
    tables := []string{"account_storage_stats", "folder_storage_stats"}
    for _, table := range tables {
        var exists bool
        err = db.QueryRow(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = $1
            )`, table).Scan(&exists)
        
        if err != nil {
            fmt.Printf("❌ Error checking table %s: %v\n", table, err)
        } else if exists {
            fmt.Printf("✅ Table %s exists\n", table)
        } else {
            fmt.Printf("❌ Table %s does not exist\n", table)
        }
    }
    
    // Check columns in email_indices
    columns := []string{"email_size", "content_size", "attachment_count", "attachment_size"}
    for _, col := range columns {
        var exists bool
        err = db.QueryRow(`
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'email_indices'
                AND column_name = $1
            )`, col).Scan(&exists)
        
        if err != nil {
            fmt.Printf("❌ Error checking column %s: %v\n", col, err)
        } else if exists {
            fmt.Printf("✅ Column email_indices.%s exists\n", col)
        } else {
            fmt.Printf("❌ Column email_indices.%s does not exist\n", col)
        }
    }
    
    fmt.Println("\n✅ Migration process completed!")
}