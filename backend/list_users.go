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
	
	fmt.Println("✅ Connected to PostgreSQL")
	fmt.Println("\n=== AVAILABLE USERS IN SYSTEM ===\n")
	
	// Query all users with their roles
	rows, err := db.Query(`
		SELECT 
			u.email,
			u.password_hash,
			r.name as role_name,
			r.display_name as role_display,
			r.level as role_level,
			o.name as organization_name,
			o.type as org_type,
			u.created_at
		FROM users u
		LEFT JOIN roles r ON u.role_id = r.id
		LEFT JOIN organizations o ON u.primary_org_id = o.id
		ORDER BY r.level, u.created_at
	`)
	if err != nil {
		log.Fatal("Failed to query users:", err)
	}
	defer rows.Close()
	
	fmt.Println("📋 USER ACCOUNTS:")
	fmt.Println("==================================================================================")
	
	count := 0
	for rows.Next() {
		var email, passwordHash, roleName, roleDisplay, orgName, orgType string
		var roleLevel int
		var createdAt sql.NullTime
		var roleNameNull, roleDisplayNull, orgNameNull, orgTypeNull sql.NullString
		var roleLevelNull sql.NullInt64
		
		err := rows.Scan(&email, &passwordHash, &roleNameNull, &roleDisplayNull, &roleLevelNull, &orgNameNull, &orgTypeNull, &createdAt)
		if err != nil {
			log.Printf("Error scanning row: %v", err)
			continue
		}
		
		// Handle NULL values
		if roleNameNull.Valid {
			roleName = roleNameNull.String
		} else {
			roleName = "end_user"
		}
		
		if roleDisplayNull.Valid {
			roleDisplay = roleDisplayNull.String
		} else {
			roleDisplay = "End User"
		}
		
		if roleLevelNull.Valid {
			roleLevel = int(roleLevelNull.Int64)
		} else {
			roleLevel = 5
		}
		
		if orgNameNull.Valid {
			orgName = orgNameNull.String
		} else {
			orgName = "No Organization"
		}
		
		if orgTypeNull.Valid {
			orgType = orgTypeNull.String
		} else {
			orgType = "none"
		}
		
		count++
		
		// Determine default password based on email pattern
		defaultPassword := ""
		switch email {
		case "admin@emailbackup.com":
			defaultPassword = "Admin123!"
		case "test@emailbackup.com":
			defaultPassword = "Test123!"
		case "testgmail@example.com":
			defaultPassword = "password123"
		case "testexchange@example.com":
			defaultPassword = "password123"
		case "test@exchange.local":
			defaultPassword = "Test123!"
		default:
			if email == "flow_test_20250911_005753@example.com" {
				defaultPassword = "password123"
			} else {
				defaultPassword = "password123 (default)"
			}
		}
		
		fmt.Printf("\n%d. USER: %s\n", count, email)
		fmt.Printf("   Password: %s\n", defaultPassword)
		fmt.Printf("   Role: %s (%s) - Level %d\n", roleName, roleDisplay, roleLevel)
		fmt.Printf("   Organization: %s (%s)\n", orgName, orgType)
		
		// Role-specific features
		switch roleName {
		case "admin":
			fmt.Println("   ✅ Can: Manage organizations, users, system settings")
			fmt.Println("   ❌ Cannot: Access email accounts or content")
		case "distributor":
			fmt.Println("   ✅ Can: Manage dealers and clients in network")
			fmt.Println("   ❌ Cannot: Access email accounts")
		case "dealer":
			fmt.Println("   ✅ Can: Manage client organizations")
			fmt.Println("   ❌ Cannot: Access email accounts")
		case "client":
			fmt.Println("   ✅ Can: Manage end users in organization")
			fmt.Println("   ❌ Cannot: Access email accounts")
		case "end_user":
			fmt.Println("   ✅ Can: Add/manage email accounts, view emails")
			fmt.Println("   ❌ Cannot: Manage organizations or users")
		}
	}
	
	fmt.Println("\n====================================================================================")
	fmt.Printf("\n✅ TOTAL USERS: %d\n", count)
	
	// Show recommendation
	fmt.Println("\n🎯 RECOMMENDED TEST ACCOUNTS:")
	fmt.Println("\n1. FOR ORGANIZATION MANAGEMENT:")
	fmt.Println("   Email: admin@emailbackup.com")
	fmt.Println("   Password: Admin123!")
	fmt.Println("   Features: Organizations, Users, System Settings")
	
	fmt.Println("\n2. FOR EMAIL FUNCTIONALITY:")
	fmt.Println("   Email: test@emailbackup.com")
	fmt.Println("   Password: Test123!")
	fmt.Println("   Features: Email Accounts, Emails, Folders")
	
	fmt.Println("\n3. FOR END USER EXPERIENCE:")
	fmt.Println("   Email: testgmail@example.com")
	fmt.Println("   Password: password123")
	fmt.Println("   Features: Personal email backup management")
}