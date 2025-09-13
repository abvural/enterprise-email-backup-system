package main

import (
	"emailprojectv2/database"
	"emailprojectv2/handlers"
	"fmt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// Test compilation of organization handlers
	dsn := "host=172.25.1.148 user=postgres password=avural1234 dbname=email_backup_mvp port=5432 sslmode=disable TimeZone=UTC"
	
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		fmt.Printf("Failed to connect to database: %v\n", err)
		return
	}

	// Create handlers to test compilation
	orgHandler := handlers.NewOrganizationHandler(db)
	userHandler := handlers.NewUserManagementHandler(db)

	fmt.Printf("Organization handler created: %v\n", orgHandler != nil)
	fmt.Printf("User management handler created: %v\n", userHandler != nil)
	
	// Test database connection with new models
	var roleCount int64
	db.Model(&database.Role{}).Count(&roleCount)
	fmt.Printf("Roles in database: %d\n", roleCount)

	var orgCount int64
	db.Model(&database.Organization{}).Count(&orgCount)
	fmt.Printf("Organizations in database: %d\n", orgCount)

	fmt.Println("✅ Organization handlers compilation test successful!")
}