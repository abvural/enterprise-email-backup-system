package main

import (
	"log"
	"os"

	"emailprojectv2/auth"
	"emailprojectv2/config"
	"emailprojectv2/database"
	"emailprojectv2/handlers"
	"emailprojectv2/storage"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Load configuration
	cfg := config.Load()

	// Initialize database
	if err := database.InitDB(cfg); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	log.Println("✅ PostgreSQL bağlantısı başarılı!")

	// Run migrations
	if err := database.RunMigrations(); err != nil {
		log.Fatal("Failed to run migrations:", err)
	}
	log.Println("✅ Database migration başarılı!")

	// Initialize MinIO
	if err := storage.InitMinIO(cfg); err != nil {
		log.Fatal("Failed to initialize MinIO:", err)
	}
	log.Println("✅ MinIO bağlantısı başarılı!")

	// Check/create MinIO buckets
	if err := storage.CheckAndCreateBuckets(); err != nil {
		log.Fatal("Failed to create MinIO buckets:", err)
	}
	log.Println("✅ MinIO bucket 'email-backups' mevcut")
	log.Println("✅ MinIO bucket 'email-attachments' mevcut")

	// Initialize Gin router
	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.DebugMode)
	}
	
	r := gin.Default()

	// Configure CORS
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177", "http://localhost:5178", "http://localhost:5179", "http://localhost:5180"}
	corsConfig.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"}
	corsConfig.AllowCredentials = true
	r.Use(cors.New(corsConfig))

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "healthy",
			"service": "Email Backup MVP with Storage",
		})
	})

	// Initialize handlers
	authHandler := handlers.NewAuthHandler()
	accountHandler := handlers.NewAccountHandler()
	emailHandler := handlers.NewEmailHandler()

	// Auth routes (public)
	r.POST("/auth/register", authHandler.Register)
	r.POST("/auth/login", authHandler.Login)

	// SSE endpoint (needs special handling for auth)
	r.GET("/api/accounts/:id/sync-stream", accountHandler.SyncStream)

	// Protected routes
	api := r.Group("/api")
	api.Use(auth.AuthMiddleware())
	{
		// User info
		api.GET("/me", func(c *gin.Context) {
			userID := c.GetString("user_id")
			email := c.GetString("email")
			c.JSON(200, gin.H{
				"user_id": userID,
				"email":   email,
			})
		})

		// Account management
		api.POST("/accounts/gmail", accountHandler.AddGmailAccount)
		api.POST("/accounts/exchange", accountHandler.AddExchangeAccount)
		api.GET("/accounts", accountHandler.GetAccounts)
		api.POST("/accounts/:id/sync", accountHandler.SyncAccount)
		api.GET("/accounts/:id/sync-progress", accountHandler.GetSyncProgress)
		api.GET("/accounts/:id/sync-history", accountHandler.GetSyncHistory)
		api.DELETE("/accounts/:id", accountHandler.DeleteAccount)

		// Email operations
		api.GET("/accounts/:id/emails", emailHandler.GetEmails)
		api.GET("/emails/:id", emailHandler.GetEmail)

		// Storage statistics routes
		api.GET("/storage/total", handlers.GetStorageStats)
		api.GET("/storage/accounts", handlers.GetAccountsWithStorage)
		api.POST("/storage/recalculate-all", handlers.RecalculateAllStats)
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	log.Printf("Starting Email Backup MVP with Storage on port %s", port)
	log.Printf("Health check available at: http://localhost:%s/health", port)
	log.Printf("Storage API available at: http://localhost:%s/api/storage/total", port)
	
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}