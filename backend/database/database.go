package database

import (
	"fmt"
	"log"

	"emailprojectv2/config"
	"emailprojectv2/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect(cfg *config.Config) error {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		cfg.Database.Host,
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.DBName,
		cfg.Database.Port,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %v", err)
	}

	DB = db
	log.Println("✅ PostgreSQL bağlantısı başarılı!")
	
	return nil
}

func Migrate() error {
	// Pre-migration cleanup
	if err := preMigrationCleanup(); err != nil {
		log.Printf("⚠️ Pre-migration cleanup warning: %v", err)
	}

	// Migrate all models including organization models
	err := DB.AutoMigrate(
		&User{}, 
		&EmailAccount{}, 
		&EmailIndex{}, 
		&models.SyncHistory{},
		&Role{},
		&Organization{},
		&UserOrganization{},
		&OrganizationSettings{},
		&AccountStorageStats{},
		&FolderStorageStats{},
	)
	if err != nil {
		return fmt.Errorf("failed to migrate database: %v", err)
	}
	
	log.Println("✅ Database migration successful!")
	
	// Initialize default data
	if err := initializeDefaultData(); err != nil {
		return fmt.Errorf("failed to initialize default data: %v", err)
	}
	
	return nil
}

func preMigrationCleanup() error {
	// Update any null sync_type values to 'incremental' before migration
	result := DB.Exec("UPDATE sync_histories SET sync_type = 'incremental' WHERE sync_type IS NULL")
	if result.Error != nil && result.Error != gorm.ErrRecordNotFound {
		return fmt.Errorf("failed to update sync_histories: %v", result.Error)
	}
	
	if result.RowsAffected > 0 {
		log.Printf("✅ Updated %d sync_histories records with null sync_type", result.RowsAffected)
	}
	
	return nil
}

func initializeDefaultData() error {
	// Create default roles if they don't exist
	roles := []Role{
		{Name: "admin", DisplayName: "System Administrator", Level: 1, IsActive: true, Description: "System administrator with full access"},
		{Name: "distributor", DisplayName: "Distributor", Level: 2, IsActive: true, Description: "Distributor level access"},
		{Name: "dealer", DisplayName: "Dealer", Level: 3, IsActive: true, Description: "Dealer level access"},
		{Name: "client", DisplayName: "Client", Level: 4, IsActive: true, Description: "Client level access"},
		{Name: "end_user", DisplayName: "End User", Level: 5, IsActive: true, Description: "End user access"},
	}

	for _, role := range roles {
		var existingRole Role
		if err := DB.Where("name = ?", role.Name).First(&existingRole).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				if err := DB.Create(&role).Error; err != nil {
					return fmt.Errorf("failed to create role %s: %v", role.Name, err)
				}
				log.Printf("✅ Created role: %s", role.Name)
			} else {
				return fmt.Errorf("error checking role %s: %v", role.Name, err)
			}
		}
	}

	// Create system organization if it doesn't exist
	var systemOrg Organization
	if err := DB.Where("type = ?", "system").First(&systemOrg).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			systemOrg = Organization{
				Name:        "System Organization",
				Type:        "system",
				ParentOrgID: nil, // System org has no parent
				IsActive:    true,
			}
			
			if err := DB.Create(&systemOrg).Error; err != nil {
				return fmt.Errorf("failed to create system organization: %v", err)
			}
			log.Printf("✅ Created system organization: %s", systemOrg.ID)
		} else {
			return fmt.Errorf("error checking system organization: %v", err)
		}
	}

	return nil
}