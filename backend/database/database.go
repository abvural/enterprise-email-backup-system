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
	err := DB.AutoMigrate(&User{}, &EmailAccount{}, &EmailIndex{}, &models.SyncHistory{})
	if err != nil {
		return fmt.Errorf("failed to migrate database: %v", err)
	}
	
	log.Println("✅ Database migration başarılı!")
	return nil
}