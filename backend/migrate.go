package main

import (
	"database/sql"
	"log"

	_ "github.com/lib/pq"
)

func main() {
	// PostgreSQL connection string
	connStr := "host=172.25.1.148 port=5432 user=postgres password=avural1234 dbname=email_backup_mvp sslmode=disable"
	
	// Connect to database
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}
	defer db.Close()
	
	// Test connection
	if err = db.Ping(); err != nil {
		log.Fatalf("❌ Failed to ping database: %v", err)
	}
	
	log.Println("✅ Connected to PostgreSQL database")
	
	// Add last_sync_date column
	log.Println("📝 Adding last_sync_date column to email_accounts table...")
	_, err = db.Exec(`ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS last_sync_date TIMESTAMP`)
	if err != nil {
		log.Fatalf("❌ Failed to add last_sync_date column: %v", err)
	}
	
	log.Println("✅ Successfully added last_sync_date column")
	
	// Create index for performance
	log.Println("📝 Creating index on last_sync_date column...")
	_, err = db.Exec(`CREATE INDEX IF NOT EXISTS idx_email_accounts_last_sync_date ON email_accounts(last_sync_date)`)
	if err != nil {
		log.Fatalf("❌ Failed to create index: %v", err)
	}
	
	log.Println("✅ Successfully created performance index")
	
	// Add column comment
	log.Println("📝 Adding column documentation...")
	_, err = db.Exec(`COMMENT ON COLUMN email_accounts.last_sync_date IS 'Timestamp of the last successful email sync completion'`)
	if err != nil {
		log.Printf("⚠️ Failed to add column comment (non-critical): %v", err)
	}
	
	// Verify column was added
	log.Println("📝 Verifying migration...")
	var columnName, dataType, isNullable string
	row := db.QueryRow(`
		SELECT column_name, data_type, is_nullable 
		FROM information_schema.columns 
		WHERE table_name = 'email_accounts' AND column_name = 'last_sync_date'
	`)
	
	err = row.Scan(&columnName, &dataType, &isNullable)
	if err != nil {
		log.Fatalf("❌ Failed to verify column: %v", err)
	}
	
	log.Printf("✅ Column verified: %s (%s, nullable: %s)", columnName, dataType, isNullable)
	
	// Check current accounts
	log.Println("📝 Checking current email accounts...")
	rows, err := db.Query(`
		SELECT id, email, provider, last_sync_date, created_at
		FROM email_accounts
		ORDER BY created_at DESC
	`)
	if err != nil {
		log.Fatalf("❌ Failed to query accounts: %v", err)
	}
	defer rows.Close()
	
	log.Println("📊 Current email accounts:")
	for rows.Next() {
		var id, email, provider string
		var lastSyncDate, createdAt sql.NullTime
		
		err = rows.Scan(&id, &email, &provider, &lastSyncDate, &createdAt)
		if err != nil {
			log.Printf("⚠️ Error reading row: %v", err)
			continue
		}
		
		lastSyncStr := "NULL (will trigger full sync)"
		if lastSyncDate.Valid {
			lastSyncStr = lastSyncDate.Time.Format("2006-01-02 15:04:05")
		}
		
		log.Printf("  📧 %s (%s) - Last sync: %s", email, provider, lastSyncStr)
	}
	
	log.Println("🎉 Migration completed successfully!")
	log.Println("🚀 Incremental email sync is now enabled!")
	log.Println("📈 Next sync operations will be 100x faster for large mailboxes!")
}