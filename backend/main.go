package main

import (
	"log"
	"net/http"

	"emailprojectv2/config"
	"emailprojectv2/database"
	"emailprojectv2/handlers"
	"emailprojectv2/middleware"
	"emailprojectv2/services"
	"emailprojectv2/storage"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func main() {
	// Load configuration
	cfg := config.Load()
	
	// Set Gin mode
	gin.SetMode(cfg.Server.GinMode)

	// Connect to database
	if err := database.Connect(cfg); err != nil {
		log.Fatal("Database connection failed:", err)
	}

	// Run database migrations
	if err := database.Migrate(); err != nil {
		log.Fatal("Database migration failed:", err)
	}

	// Connect to MinIO
	if err := storage.ConnectMinio(cfg); err != nil {
		log.Fatal("MinIO connection failed:", err)
	}

	// TODO: Re-enable when background jobs service is available
	// backgroundJobService := services.NewBackgroundJobService(database.DB, storage.MinioClient)
	// backgroundJobService.StartAllJobs()
	log.Println("✅ Backend started (background jobs disabled)")

	// Initialize router
	router := gin.Default()

	// CORS middleware
	router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		
		c.Next()
	})

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"service": "email-backup-mvp",
			"version": "1.0.0",
			"database": "connected",
			"minio": "connected",
		})
	})

	// NTLM Exchange test endpoint
	router.GET("/test/exchange-ntlm", func(c *gin.Context) {
		log.Println("🚀 Testing Exchange NTLM connection...")
		
		// Create Exchange service with configuration
		exchangeService := services.NewExchangeService(
			cfg.Exchange.ServerURL,
			cfg.Exchange.Username,
			cfg.Exchange.Password,
			cfg.Exchange.Domain,
		)
		
		// Test connection
		if err := exchangeService.TestConnection(); err != nil {
			log.Printf("❌ Exchange NTLM test failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"status": "failed",
				"error":  err.Error(),
				"message": "NTLM Exchange connection failed",
				"config": gin.H{
					"server": cfg.Exchange.ServerURL,
					"username": cfg.Exchange.Username,
					"domain": cfg.Exchange.Domain,
				},
			})
			return
		}
		
		log.Println("✅ Exchange NTLM connection successful!")
		c.JSON(http.StatusOK, gin.H{
			"status": "success",
			"message": "NTLM Exchange connection successful",
			"config": gin.H{
				"server": cfg.Exchange.ServerURL,
				"username": cfg.Exchange.Username,
				"domain": cfg.Exchange.Domain,
			},
		})
	})

	// Enhanced NTLM Exchange email fetch test endpoint
	router.GET("/test/exchange-fetch-emails", func(c *gin.Context) {
		log.Println("🚀 Testing Exchange email fetch with enhanced NTLM...")
		
		// First, check if test Exchange account exists in database
		var account database.EmailAccount
		result := database.DB.Where("email = ? AND provider = ?", cfg.Exchange.Username, "exchange").First(&account)
		
		var accountID uuid.UUID
		if result.Error != nil {
			// Account doesn't exist, create it for testing
			log.Println("📝 Creating test Exchange account in database...")
			
			// Get or create test user
			var user database.User
			userResult := database.DB.Where("email = ?", "test@emailbackup.com").First(&user)
			if userResult.Error != nil {
				// Create test user
				user = database.User{
					Email:        "test@emailbackup.com",
					PasswordHash: "$2a$10$YourHashHere", // Dummy hash
				}
				if err := database.DB.Create(&user).Error; err != nil {
					log.Printf("❌ Failed to create test user: %v", err)
					c.JSON(http.StatusInternalServerError, gin.H{
						"status": "failed",
						"error":  "Could not create test user",
					})
					return
				}
			}
			
			// Create Exchange account
			account = database.EmailAccount{
				UserID:    user.ID,
				Provider:  "exchange",
				Email:     cfg.Exchange.Username,
				ServerURL: cfg.Exchange.ServerURL,
				Username:  cfg.Exchange.Username,
				Password:  cfg.Exchange.Password,
				Domain:    cfg.Exchange.Domain,
			}
			if err := database.DB.Create(&account).Error; err != nil {
				log.Printf("❌ Failed to create test Exchange account: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"status": "failed",
					"error":  "Could not create test Exchange account",
				})
				return
			}
			accountID = account.ID
			log.Printf("✅ Test Exchange account created with ID: %s", accountID)
		} else {
			accountID = account.ID
			log.Printf("✅ Using existing Exchange account with ID: %s", accountID)
		}
		
		// Create Exchange service with configuration
		exchangeService := services.NewExchangeService(
			cfg.Exchange.ServerURL,
			cfg.Exchange.Username,
			cfg.Exchange.Password,
			cfg.Exchange.Domain,
		)
		
		// Try to sync emails with enhanced authentication
		log.Println("📧 Attempting to fetch real emails from Exchange...")
		if err := exchangeService.SyncEmails(accountID); err != nil {
			log.Printf("❌ Email fetch failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"status": "failed",
				"error":  err.Error(),
				"message": "Enhanced NTLM email fetch failed",
			})
			return
		}
		
		log.Println("✅ Exchange email fetch with enhanced NTLM successful!")
		c.JSON(http.StatusOK, gin.H{
			"status": "success",
			"message": "Enhanced NTLM email fetch successful - emails processed",
			"account_id": accountID.String(),
		})
	})

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(cfg.JWT.Secret)
	accountHandler := handlers.NewAccountHandler(cfg.JWT.Secret)
	emailHandler := handlers.NewEmailHandler()

	// Auth routes (no middleware required)
	auth := router.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
	}

	// SSE endpoint outside protected group (uses query param auth)  
	router.GET("/api/accounts/:id/sync-stream", accountHandler.SyncStream)

	// Protected routes
	protected := router.Group("/api")
	protected.Use(middleware.AuthMiddleware(cfg.JWT.Secret))
	{
		protected.GET("/me", func(c *gin.Context) {
			userID := c.GetString("user_id")
			userEmail := c.GetString("user_email")
			
			c.JSON(http.StatusOK, gin.H{
				"user_id": userID,
				"email":   userEmail,
			})
		})

		// Account management
		protected.POST("/accounts/gmail", accountHandler.AddGmailAccount)
		protected.POST("/accounts/exchange", accountHandler.AddExchangeAccount)
		protected.GET("/accounts", accountHandler.GetAccounts)
		protected.POST("/accounts/:id/sync", accountHandler.SyncAccount)
		protected.GET("/accounts/:id/sync-progress", accountHandler.GetSyncProgress)
		protected.GET("/accounts/:id/sync-history", accountHandler.GetSyncHistory)
		protected.DELETE("/accounts/:id", accountHandler.DeleteAccount)

		// Email management
		protected.GET("/accounts/:id/emails", emailHandler.GetEmails)
		protected.GET("/emails/:id", emailHandler.GetEmail)

		// Storage statistics
		storageHandler := handlers.NewStorageHandler()
		protected.GET("/storage/total", storageHandler.GetTotalStorageStats)
		protected.GET("/storage/accounts", storageHandler.GetAccountsWithStorageStats)
		protected.GET("/storage/account/:accountId", storageHandler.GetAccountStorageStats)
		protected.GET("/storage/account/:accountId/folders", storageHandler.GetFolderStorageStats)
		protected.POST("/storage/account/:accountId/recalculate", storageHandler.RecalculateStorageStats)
		protected.POST("/storage/recalculate-all", storageHandler.RecalculateAllStorageStats)

		// Organization management
		orgHandler := handlers.NewOrganizationHandler(database.DB)
		protected.GET("/organizations", orgHandler.GetOrganizations)
		protected.POST("/organizations", orgHandler.CreateOrganization)
		protected.GET("/organizations/:id", orgHandler.GetOrganization)
		protected.PUT("/organizations/:id", orgHandler.UpdateOrganization)
		protected.DELETE("/organizations/:id", orgHandler.DeleteOrganization)
		protected.GET("/organizations/:id/stats", orgHandler.GetOrganizationStats)
		protected.GET("/organizations/:id/hierarchy", orgHandler.GetOrganizationHierarchy)

		// Admin statistics endpoints
		protected.GET("/admin/system-stats", orgHandler.GetSystemStats)
		protected.GET("/admin/top-organizations", orgHandler.GetTopOrganizations)

		// Distributor statistics endpoints
		protected.GET("/distributor/network-stats", orgHandler.GetNetworkStats)
		protected.GET("/distributor/dealer-performance", orgHandler.GetDealerPerformance)

		// Dealer statistics endpoints
		protected.GET("/dealer/client-stats", orgHandler.GetClientStats)
		protected.GET("/dealer/usage-trends", orgHandler.GetUsageTrends)

		// Client statistics endpoints
		protected.GET("/client/user-stats", orgHandler.GetUserStats)
		protected.GET("/client/storage-usage", orgHandler.GetStorageUsage)

		// User management
		userMgmtHandler := handlers.NewUserManagementHandler(database.DB)
		protected.GET("/users", userMgmtHandler.GetUsers)
		protected.POST("/users", userMgmtHandler.CreateUser)
		protected.GET("/users/:id", userMgmtHandler.GetUser)
		protected.PUT("/users/:id", userMgmtHandler.UpdateUser)
		protected.DELETE("/users/:id", userMgmtHandler.DeleteUser)
		// TODO: Add AssignRole and AssignOrganization methods to UserManagementHandler
		// protected.POST("/users/:id/assign-role", userMgmtHandler.AssignRole)
		// protected.POST("/users/:id/assign-organization", userMgmtHandler.AssignOrganization)
	}

	log.Printf("Starting Email Backup MVP server on port %s", cfg.Server.Port)
	log.Printf("Health check available at: http://localhost:%s/health", cfg.Server.Port)

	// Start server
	if err := router.Run(":" + cfg.Server.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}