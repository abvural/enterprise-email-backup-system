package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")

	// Connect to default postgres database first
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=postgres sslmode=disable",
		host, port, user, password)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal("Failed to connect to PostgreSQL:", err)
	}
	defer db.Close()

	// Test connection
	if err := db.Ping(); err != nil {
		log.Fatal("Failed to ping database:", err)
	}

	log.Println("✅ PostgreSQL connection successful!")

	// Create database if it doesn't exist
	_, err = db.Exec("CREATE DATABASE email_backup_mvp")
	if err != nil {
		if fmt.Sprintf("%v", err) != `pq: database "email_backup_mvp" already exists` {
			log.Fatal("Failed to create database:", err)
		}
		log.Println("⚠️ Database email_backup_mvp already exists")
	} else {
		log.Println("✅ Database email_backup_mvp created successfully!")
	}
}