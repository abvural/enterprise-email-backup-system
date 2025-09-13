package main

import (
	"database/sql"
	"fmt"
	"log"
	
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
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
	fmt.Println("\n=== Checking Users ===")
	
	// Get all users
	rows, err := db.Query(`SELECT id, email, password_hash FROM users`)
	if err != nil {
		log.Fatal("Failed to query users:", err)
	}
	defer rows.Close()
	
	count := 0
	for rows.Next() {
		var id, email, passwordHash string
		if err := rows.Scan(&id, &email, &passwordHash); err != nil {
			continue
		}
		count++
		fmt.Printf("\n%d. User: %s\n", count, email)
		fmt.Printf("   ID: %s\n", id)
		
		// Test password
		testPassword := "Admin123!"
		err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(testPassword))
		if err == nil {
			fmt.Printf("   ✅ Password 'Admin123!' is valid\n")
		} else {
			fmt.Printf("   ❌ Password 'Admin123!' is invalid\n")
		}
	}
	
	if count == 0 {
		fmt.Println("No users found in database")
		fmt.Println("\n=== Creating admin user ===")
		
		// Create admin user
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("Admin123!"), bcrypt.DefaultCost)
		if err != nil {
			log.Fatal("Failed to hash password:", err)
		}
		
		_, err = db.Exec(`
			INSERT INTO users (id, email, password_hash, created_at, updated_at)
			VALUES (gen_random_uuid(), 'admin@emailbackup.com', $1, NOW(), NOW())
			ON CONFLICT (email) DO UPDATE 
			SET password_hash = $1, updated_at = NOW()
		`, string(hashedPassword))
		
		if err != nil {
			log.Printf("Failed to create user: %v", err)
		} else {
			fmt.Println("✅ Admin user created successfully")
			fmt.Println("   Email: admin@emailbackup.com")
			fmt.Println("   Password: Admin123!")
		}
	}
	
	fmt.Println("\n=== Login Test ===")
	fmt.Println("URL: http://localhost:5180")
	fmt.Println("Email: admin@emailbackup.com")
	fmt.Println("Password: Admin123!")
}