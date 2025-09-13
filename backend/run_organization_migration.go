package main

import (
	"fmt"
	"io/ioutil"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// Database connection
	dsn := "host=172.25.1.148 user=postgres password=avural1234 dbname=email_backup_mvp port=5432 sslmode=disable TimeZone=UTC"
	
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Read migration file
	sqlBytes, err := ioutil.ReadFile("database/migrations/add_organization_structure.sql")
	if err != nil {
		log.Fatalf("Failed to read migration file: %v", err)
	}

	sqlContent := string(sqlBytes)

	// Execute migration
	log.Println("Running organization structure migration...")
	
	result := db.Exec(sqlContent)
	if result.Error != nil {
		log.Fatalf("Migration failed: %v", result.Error)
	}

	log.Printf("Migration completed successfully! Rows affected: %d", result.RowsAffected)

	// Verify tables were created
	var tables []string
	db.Raw("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('roles', 'organizations', 'user_organizations', 'organization_settings')").Scan(&tables)
	
	fmt.Println("\nCreated tables:")
	for _, table := range tables {
		fmt.Printf("✅ %s\n", table)
	}

	// Check role count
	var roleCount int64
	db.Table("roles").Count(&roleCount)
	fmt.Printf("\n📋 Roles created: %d\n", roleCount)

	// Check organization count
	var orgCount int64
	db.Table("organizations").Count(&orgCount)
	fmt.Printf("🏢 Organizations created: %d\n", orgCount)

	fmt.Println("\n🎉 Organization structure migration completed successfully!")
}