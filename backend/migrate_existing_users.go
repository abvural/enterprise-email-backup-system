package main

import (
	"fmt"
	"log"

	"emailprojectv2/database"

	"golang.org/x/crypto/bcrypt"
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

	log.Println("🚀 Starting user migration to organization structure...")

	// 1. Create default client organization for existing users
	var defaultClientOrg database.Organization
	err = db.Where("name = ? AND type = ?", "Default Client Organization", "client").First(&defaultClientOrg).Error
	if err == gorm.ErrRecordNotFound {
		// Get system organization as parent
		var systemOrg database.Organization
		if err := db.Where("type = ?", "system").First(&systemOrg).Error; err != nil {
			log.Fatalf("System organization not found: %v", err)
		}

		defaultClientOrg = database.Organization{
			Name:        "Default Client Organization",
			Type:        "client",
			ParentOrgID: &systemOrg.ID,
			IsActive:    true,
		}

		if err := db.Create(&defaultClientOrg).Error; err != nil {
			log.Fatalf("Failed to create default client organization: %v", err)
		}
		
		log.Printf("✅ Created default client organization: %s", defaultClientOrg.ID)
	} else if err != nil {
		log.Fatalf("Error checking for default client organization: %v", err)
	}

	// 2. Get end_user role
	var endUserRole database.Role
	if err := db.Where("name = ?", "end_user").First(&endUserRole).Error; err != nil {
		log.Fatalf("End user role not found: %v", err)
	}

	// 3. Get admin role for creating admin user
	var adminRole database.Role
	if err := db.Where("name = ?", "admin").First(&adminRole).Error; err != nil {
		log.Fatalf("Admin role not found: %v", err)
	}

	// 4. Create system admin user if not exists
	var adminUser database.User
	err = db.Where("email = ?", "admin@emailbackup.com").First(&adminUser).Error
	if err == gorm.ErrRecordNotFound {
		// Hash password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("Admin123!"), bcrypt.DefaultCost)
		if err != nil {
			log.Fatalf("Failed to hash admin password: %v", err)
		}

		// Get system organization
		var systemOrg database.Organization
		if err := db.Where("type = ?", "system").First(&systemOrg).Error; err != nil {
			log.Fatalf("System organization not found: %v", err)
		}

		adminUser = database.User{
			Email:        "admin@emailbackup.com",
			PasswordHash: string(hashedPassword),
			RoleID:       &adminRole.ID,
			PrimaryOrgID: &systemOrg.ID,
		}

		if err := db.Create(&adminUser).Error; err != nil {
			log.Fatalf("Failed to create admin user: %v", err)
		}

		// Create user-organization relationship for admin
		adminUserOrg := database.UserOrganization{
			UserID:         adminUser.ID,
			OrganizationID: systemOrg.ID,
			RoleID:         adminRole.ID,
			IsPrimary:      true,
		}

		if err := db.Create(&adminUserOrg).Error; err != nil {
			log.Fatalf("Failed to create admin user-organization relationship: %v", err)
		}

		log.Printf("✅ Created admin user: admin@emailbackup.com")
	} else if err != nil {
		log.Fatalf("Error checking for admin user: %v", err)
	}

	// 5. Migrate existing users
	var existingUsers []database.User
	if err := db.Where("role_id IS NULL").Find(&existingUsers).Error; err != nil {
		log.Fatalf("Failed to fetch existing users: %v", err)
	}

	log.Printf("📊 Found %d users to migrate", len(existingUsers))

	// Start transaction
	tx := db.Begin()

	migratedCount := 0
	for _, user := range existingUsers {
		// Update user with role and organization
		user.RoleID = &endUserRole.ID
		user.PrimaryOrgID = &defaultClientOrg.ID

		if err := tx.Save(&user).Error; err != nil {
			log.Printf("❌ Failed to update user %s: %v", user.Email, err)
			continue
		}

		// Create user-organization relationship
		userOrg := database.UserOrganization{
			UserID:         user.ID,
			OrganizationID: defaultClientOrg.ID,
			RoleID:         endUserRole.ID,
			IsPrimary:      true,
		}

		if err := tx.Create(&userOrg).Error; err != nil {
			log.Printf("❌ Failed to create user-organization relationship for %s: %v", user.Email, err)
			continue
		}

		migratedCount++
		log.Printf("✅ Migrated user: %s", user.Email)
	}

	// Commit transaction
	tx.Commit()

	// 6. Verify migration
	var totalUsers int64
	var usersWithRoles int64
	var usersWithOrgs int64
	var userOrgRelationships int64

	db.Model(&database.User{}).Count(&totalUsers)
	db.Model(&database.User{}).Where("role_id IS NOT NULL").Count(&usersWithRoles)
	db.Model(&database.User{}).Where("primary_org_id IS NOT NULL").Count(&usersWithOrgs)
	db.Model(&database.UserOrganization{}).Count(&userOrgRelationships)

	// Summary
	fmt.Println("\n📋 MIGRATION SUMMARY")
	fmt.Println("====================")
	fmt.Printf("Total users in database: %d\n", totalUsers)
	fmt.Printf("Users with roles assigned: %d\n", usersWithRoles)
	fmt.Printf("Users with organizations assigned: %d\n", usersWithOrgs)
	fmt.Printf("User-organization relationships: %d\n", userOrgRelationships)
	fmt.Printf("Users migrated in this run: %d\n", migratedCount)
	fmt.Println()

	// Check roles
	var roleStats []struct {
		RoleName string
		Count    int64
	}
	
	db.Table("users").
		Select("roles.name as role_name, COUNT(*) as count").
		Joins("LEFT JOIN roles ON roles.id = users.role_id").
		Group("roles.name").
		Find(&roleStats)

	fmt.Println("👥 USERS BY ROLE")
	fmt.Println("================")
	for _, stat := range roleStats {
		if stat.RoleName == "" {
			fmt.Printf("No role assigned: %d\n", stat.Count)
		} else {
			fmt.Printf("%s: %d\n", stat.RoleName, stat.Count)
		}
	}

	// Check organizations
	var orgStats []struct {
		OrgName string
		OrgType string
		Count   int64
	}
	
	db.Table("users").
		Select("organizations.name as org_name, organizations.type as org_type, COUNT(*) as count").
		Joins("LEFT JOIN organizations ON organizations.id = users.primary_org_id").
		Group("organizations.name, organizations.type").
		Find(&orgStats)

	fmt.Println("\n🏢 USERS BY ORGANIZATION")
	fmt.Println("========================")
	for _, stat := range orgStats {
		if stat.OrgName == "" {
			fmt.Printf("No organization assigned: %d\n", stat.Count)
		} else {
			fmt.Printf("%s (%s): %d\n", stat.OrgName, stat.OrgType, stat.Count)
		}
	}

	fmt.Println("\n🎉 User migration completed successfully!")
	fmt.Println("\n🔑 ADMIN LOGIN CREDENTIALS")
	fmt.Println("==========================")
	fmt.Println("Email: admin@emailbackup.com")
	fmt.Println("Password: Admin123!")
	fmt.Println("\nUse these credentials to log in as system administrator.")
}