package main

import (
	"database/sql"
	"fmt"
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
	
	fmt.Println("✅ Connected to PostgreSQL successfully!")
	fmt.Println("\n=== Testing Storage Statistics ===")
	
	// Check account_storage_stats table
	var accountCount int
	err = db.QueryRow(`SELECT COUNT(*) FROM account_storage_stats`).Scan(&accountCount)
	if err != nil {
		fmt.Printf("❌ Error querying account_storage_stats: %v\n", err)
	} else {
		fmt.Printf("✓ account_storage_stats has %d records\n", accountCount)
	}
	
	// Check folder_storage_stats table
	var folderCount int
	err = db.QueryRow(`SELECT COUNT(*) FROM folder_storage_stats`).Scan(&folderCount)
	if err != nil {
		fmt.Printf("❌ Error querying folder_storage_stats: %v\n", err)
	} else {
		fmt.Printf("✓ folder_storage_stats has %d records\n", folderCount)
	}
	
	// Check email_indices with size columns
	var emailCount int
	var totalSize sql.NullInt64
	err = db.QueryRow(`
		SELECT COUNT(*), COALESCE(SUM(email_size), 0) 
		FROM email_indices
	`).Scan(&emailCount, &totalSize)
	if err != nil {
		fmt.Printf("❌ Error querying email_indices: %v\n", err)
	} else {
		fmt.Printf("✓ email_indices has %d emails with total size: %d bytes\n", emailCount, totalSize.Int64)
	}
	
	// Get sample data from email_indices
	fmt.Println("\n=== Sample Email Data ===")
	rows, err := db.Query(`
		SELECT id, subject, email_size, content_size, attachment_count, attachment_size 
		FROM email_indices 
		LIMIT 5
	`)
	if err != nil {
		fmt.Printf("❌ Error getting sample data: %v\n", err)
	} else {
		defer rows.Close()
		count := 0
		for rows.Next() {
			var id, subject string
			var emailSize, contentSize, attachmentCount, attachmentSize sql.NullInt64
			
			err := rows.Scan(&id, &subject, &emailSize, &contentSize, &attachmentCount, &attachmentSize)
			if err != nil {
				fmt.Printf("Error scanning row: %v\n", err)
				continue
			}
			
			count++
			fmt.Printf("%d. Subject: %.50s...\n", count, subject)
			fmt.Printf("   Email Size: %d, Content: %d, Attachments: %d (Size: %d)\n", 
				emailSize.Int64, contentSize.Int64, attachmentCount.Int64, attachmentSize.Int64)
		}
		
		if count == 0 {
			fmt.Println("No emails found in database")
		}
	}
	
	// Calculate and insert storage statistics
	fmt.Println("\n=== Calculating Storage Statistics ===")
	
	// Get all accounts
	accountRows, err := db.Query(`SELECT id, email FROM email_accounts`)
	if err != nil {
		fmt.Printf("❌ Error getting accounts: %v\n", err)
		return
	}
	defer accountRows.Close()
	
	for accountRows.Next() {
		var accountID, email string
		if err := accountRows.Scan(&accountID, &email); err != nil {
			continue
		}
		
		fmt.Printf("\nProcessing account: %s\n", email)
		
		// Delete existing stats
		db.Exec(`DELETE FROM account_storage_stats WHERE account_id = $1`, accountID)
		
		// Calculate and insert new stats
		_, err = db.Exec(`
			INSERT INTO account_storage_stats (
				id, account_id, total_emails, total_size, content_size, 
				attachment_size, attachment_count, last_calculated_at
			)
			SELECT 
				gen_random_uuid(),
				$1, 
				COUNT(*),
				COALESCE(SUM(email_size), 0),
				COALESCE(SUM(content_size), 0),
				COALESCE(SUM(attachment_size), 0),
				COALESCE(SUM(attachment_count), 0),
				NOW()
			FROM email_indices
			WHERE account_id = $1
		`, accountID)
		
		if err != nil {
			fmt.Printf("  ❌ Error calculating stats: %v\n", err)
		} else {
			// Get the stats
			var totalEmails, totalSize int64
			err = db.QueryRow(`
				SELECT total_emails, total_size 
				FROM account_storage_stats 
				WHERE account_id = $1
			`, accountID).Scan(&totalEmails, &totalSize)
			
			if err != nil {
				fmt.Printf("  ❌ Error retrieving stats: %v\n", err)
			} else {
				fmt.Printf("  ✅ Stats calculated: %d emails, %d bytes\n", totalEmails, totalSize)
			}
		}
	}
	
	fmt.Println("\n✅ Storage statistics test completed!")
}