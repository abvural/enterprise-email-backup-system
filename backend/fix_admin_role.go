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
	fmt.Println("\n=== Fixing Admin Role Assignment ===")
	
	// Get admin role ID
	var adminRoleID string
	err = db.QueryRow(`SELECT id FROM roles WHERE name = 'admin'`).Scan(&adminRoleID)
	if err != nil {
		log.Fatal("Failed to find admin role:", err)
	}
	fmt.Printf("Admin role ID: %s\n", adminRoleID)
	
	// Get admin user ID
	var adminUserID string
	err = db.QueryRow(`SELECT id FROM users WHERE email = 'admin@emailbackup.com'`).Scan(&adminUserID)
	if err != nil {
		log.Fatal("Failed to find admin user:", err)
	}
	fmt.Printf("Admin user ID: %s\n", adminUserID)
	
	// Update user role
	_, err = db.Exec(`UPDATE users SET role_id = $1 WHERE email = 'admin@emailbackup.com'`, adminRoleID)
	if err != nil {
		log.Fatal("Failed to update user role:", err)
	}
	fmt.Println("✅ Updated users table with admin role")
	
	// Update user-organization relationship
	_, err = db.Exec(`
		UPDATE user_organizations 
		SET role_id = $1 
		WHERE user_id = $2
	`, adminRoleID, adminUserID)
	if err != nil {
		log.Fatal("Failed to update user-organization role:", err)
	}
	fmt.Println("✅ Updated user_organizations table with admin role")
	
	// Verify the changes
	fmt.Println("\n=== Verification ===")
	
	var userRole, userOrgRole string
	err = db.QueryRow(`
		SELECT r.name as user_role 
		FROM users u 
		JOIN roles r ON u.role_id = r.id 
		WHERE u.email = 'admin@emailbackup.com'
	`).Scan(&userRole)
	if err != nil {
		log.Printf("Error checking user role: %v", err)
	} else {
		fmt.Printf("User role: %s\n", userRole)
	}
	
	err = db.QueryRow(`
		SELECT r.name as org_role
		FROM user_organizations uo
		JOIN roles r ON uo.role_id = r.id
		WHERE uo.user_id = $1
	`, adminUserID).Scan(&userOrgRole)
	if err != nil {
		log.Printf("Error checking user-org role: %v", err)
	} else {
		fmt.Printf("User-organization role: %s\n", userOrgRole)
	}
	
	if userRole == "admin" && userOrgRole == "admin" {
		fmt.Println("\n🎉 SUCCESS: Admin role assignment fixed!")
		fmt.Println("Login with: admin@emailbackup.com / Admin123!")
		fmt.Println("Admin will now have full system access")
	} else {
		fmt.Println("\n❌ FAILED: Role assignment not correct")
		fmt.Printf("Expected: admin/admin, Got: %s/%s\n", userRole, userOrgRole)
	}
}