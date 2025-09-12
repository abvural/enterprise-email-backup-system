package main

import (
	"fmt"
	"log"
	"os"

	"emailprojectv2/services"

	"github.com/joho/godotenv"
)

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	
	fmt.Println("🚀 Starting NTLM Exchange Test...")
	
	// Load environment variables
	if err := godotenv.Load("backend/.env"); err != nil {
		log.Printf("Warning: Could not load .env file: %v", err)
	}

	// Get Exchange configuration from environment
	serverURL := os.Getenv("EXCHANGE_SERVER_URL")
	username := os.Getenv("EXCHANGE_USERNAME")
	password := os.Getenv("EXCHANGE_PASSWORD")
	domain := os.Getenv("EXCHANGE_DOMAIN")

	fmt.Printf("📋 Exchange Configuration:\n")
	fmt.Printf("  Server: %s\n", serverURL)
	fmt.Printf("  Username: %s\n", username)
	fmt.Printf("  Domain: %s\n", domain)
	fmt.Printf("  Password: %s\n", "********")

	// Validate configuration
	if serverURL == "" || username == "" || password == "" || domain == "" {
		log.Fatal("❌ Missing Exchange configuration in environment variables")
	}

	fmt.Println("\n🔧 Creating Exchange service with NTLM...")
	exchangeService := services.NewExchangeService(serverURL, username, password, domain)

	fmt.Println("\n🔗 Testing Exchange connection with NTLM authentication...")
	
	// Test connection
	if err := exchangeService.TestConnection(); err != nil {
		log.Printf("❌ Exchange connection test failed: %v", err)
		fmt.Println("\n🔍 This might indicate:")
		fmt.Println("  - NTLM authentication is not working properly")
		fmt.Println("  - Wrong username format")
		fmt.Println("  - Server requires different authentication method")
		fmt.Println("  - Network connectivity issues")
	} else {
		fmt.Println("✅ Exchange connection successful!")
		
		// If connection works, try to fetch some emails
		fmt.Println("\n📧 Testing email retrieval...")
		// Note: This would require a valid account ID in production
		// For now, we're just testing the connection
	}

	fmt.Println("\n🎉 NTLM Exchange test completed!")
}