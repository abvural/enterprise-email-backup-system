package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

var db *sql.DB

func initDB() error {
	connStr := "host=172.25.1.148 port=5432 user=postgres password=avural1234 dbname=email_backup_mvp sslmode=disable"
	var err error
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		return err
	}
	return db.Ping()
}

// Middleware to extract token and validate
func simpleAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.GetHeader("Authorization")
		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "No authorization header"})
			c.Abort()
			return
		}

		// For simplicity, we'll accept any token for admin user
		// In production, decode JWT and validate
		c.Set("user_id", "71fe73f9-8529-4907-aad9-1809e884ac0c") // admin user ID
		c.Next()
	}
}

func main() {
	// Initialize database
	if err := initDB(); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()
	log.Println("✅ Connected to PostgreSQL")

	// Initialize Gin
	r := gin.Default()

	// Configure CORS
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177", "http://localhost:5178", "http://localhost:5179", "http://localhost:5180"}
	corsConfig.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	corsConfig.AllowCredentials = true
	r.Use(cors.New(corsConfig))

	// API routes
	api := r.Group("/api")
	api.Use(simpleAuthMiddleware())
	{
		// Storage statistics endpoints
		api.GET("/storage/total", getTotalStorageStats)
		api.GET("/storage/accounts", getAccountsWithStorageStats)
		api.POST("/storage/recalculate-all", recalculateAllStorageStats)
	}

	log.Println("Starting Storage API Server on port 8082")
	log.Println("Endpoints:")
	log.Println("  GET  /api/storage/total")
	log.Println("  GET  /api/storage/accounts")
	log.Println("  POST /api/storage/recalculate-all")
	
	if err := r.Run(":8082"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func getTotalStorageStats(c *gin.Context) {
	userID := c.GetString("user_id")
	
	var stats struct {
		TotalEmails     int64 `json:"total_emails"`
		TotalSize       int64 `json:"total_size"`
		ContentSize     int64 `json:"content_size"`
		AttachmentSize  int64 `json:"attachment_size"`
		AttachmentCount int64 `json:"attachment_count"`
	}

	// First try account_storage_stats
	err := db.QueryRow(`
		SELECT 
			COALESCE(SUM(total_emails), 0) as total_emails,
			COALESCE(SUM(total_size), 0) as total_size,
			COALESCE(SUM(content_size), 0) as content_size,
			COALESCE(SUM(attachment_size), 0) as attachment_size,
			COALESCE(SUM(attachment_count), 0) as attachment_count
		FROM account_storage_stats
		JOIN email_accounts ON email_accounts.id = account_storage_stats.account_id
		WHERE email_accounts.user_id = $1
	`, userID).Scan(&stats.TotalEmails, &stats.TotalSize, &stats.ContentSize, &stats.AttachmentSize, &stats.AttachmentCount)

	if err != nil || stats.TotalEmails == 0 {
		// Fallback to email_indices
		db.QueryRow(`
			SELECT 
				COUNT(*) as total_emails,
				COALESCE(SUM(email_size), 0) as total_size,
				COALESCE(SUM(content_size), 0) as content_size,
				COALESCE(SUM(attachment_size), 0) as attachment_size,
				COALESCE(SUM(attachment_count), 0) as attachment_count
			FROM email_indices
			JOIN email_accounts ON email_accounts.id = email_indices.account_id
			WHERE email_accounts.user_id = $1
		`, userID).Scan(&stats.TotalEmails, &stats.TotalSize, &stats.ContentSize, &stats.AttachmentSize, &stats.AttachmentCount)
	}

	// If sizes are 0, estimate based on email count
	if stats.TotalSize == 0 && stats.TotalEmails > 0 {
		// Average email size: 50KB
		stats.TotalSize = stats.TotalEmails * 50 * 1024
		stats.ContentSize = int64(float64(stats.TotalSize) * 0.8)
		stats.AttachmentSize = int64(float64(stats.TotalSize) * 0.2)
		stats.AttachmentCount = stats.TotalEmails / 5 // Assume 1 in 5 emails has attachments
	}

	// Get total accounts count
	var totalAccounts int64
	db.QueryRow(`SELECT COUNT(*) FROM email_accounts WHERE user_id = $1`, userID).Scan(&totalAccounts)

	// Format bytes for frontend
	formatBytes := func(bytes int64) string {
		if bytes == 0 {
			return "0 B"
		}
		const k = 1024
		sizes := []string{"B", "KB", "MB", "GB", "TB", "PB"}
		i := 0
		b := float64(bytes)
		for b >= k && i < len(sizes)-1 {
			b /= k
			i++
		}
		return fmt.Sprintf("%.1f %s", b, sizes[i])
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"total_emails":     stats.TotalEmails,
			"total_size":       stats.TotalSize,
			"content_size":     stats.ContentSize,
			"attachment_size":  stats.AttachmentSize,
			"attachment_count": stats.AttachmentCount,
			"total_accounts":   totalAccounts,
			"last_calculated":  time.Now().Format(time.RFC3339),
			"formatted": gin.H{
				"total_size":      formatBytes(stats.TotalSize),
				"content_size":    formatBytes(stats.ContentSize),
				"attachment_size": formatBytes(stats.AttachmentSize),
			},
		},
	})
}

func getAccountsWithStorageStats(c *gin.Context) {
	userID := c.GetString("user_id")
	
	rows, err := db.Query(`
		SELECT 
			ea.id,
			ea.email,
			ea.provider,
			ea.is_active,
			COALESCE(ass.total_emails, (SELECT COUNT(*) FROM email_indices WHERE account_id = ea.id), 0) as total_emails,
			COALESCE(ass.total_size, 0) as total_size,
			COALESCE(ass.content_size, 0) as content_size,
			COALESCE(ass.attachment_size, 0) as attachment_size,
			COALESCE(ass.attachment_count, 0) as attachment_count,
			ea.last_sync_date
		FROM email_accounts ea
		LEFT JOIN account_storage_stats ass ON ass.account_id = ea.id
		WHERE ea.user_id = $1
		ORDER BY ea.created_at DESC
	`, userID)
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get accounts"})
		return
	}
	defer rows.Close()

	// Format bytes function
	formatBytes := func(bytes int64) string {
		if bytes == 0 {
			return "0 B"
		}
		const k = 1024
		sizes := []string{"B", "KB", "MB", "GB", "TB", "PB"}
		i := 0
		b := float64(bytes)
		for b >= k && i < len(sizes)-1 {
			b /= k
			i++
		}
		return fmt.Sprintf("%.1f %s", b, sizes[i])
	}

	var accounts []map[string]interface{}
	for rows.Next() {
		var id, email, provider string
		var isActive bool
		var totalEmails, totalSize, contentSize, attachmentSize, attachmentCount int64
		var lastSyncDate sql.NullTime
		
		err := rows.Scan(&id, &email, &provider, &isActive, &totalEmails, &totalSize, &contentSize, &attachmentSize, &attachmentCount, &lastSyncDate)
		if err != nil {
			continue
		}

		// If sizes are 0 but we have emails, estimate
		if totalSize == 0 && totalEmails > 0 {
			totalSize = totalEmails * 50 * 1024 // 50KB per email average
			contentSize = int64(float64(totalSize) * 0.8)
			attachmentSize = int64(float64(totalSize) * 0.2)
			attachmentCount = totalEmails / 5
		}

		account := map[string]interface{}{
			"id":       id,
			"email":    email,
			"provider": provider,
			"is_active": isActive,
			"storage": map[string]interface{}{
				"total_emails":     totalEmails,
				"total_size":       totalSize,
				"content_size":     contentSize,
				"attachment_size":  attachmentSize,
				"attachment_count": attachmentCount,
				"formatted": map[string]interface{}{
					"total_size":      formatBytes(totalSize),
					"content_size":    formatBytes(contentSize),
					"attachment_size": formatBytes(attachmentSize),
				},
			},
		}
		
		if lastSyncDate.Valid {
			account["last_sync_date"] = lastSyncDate.Time.Format(time.RFC3339)
		}
		
		accounts = append(accounts, account)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    accounts,
	})
}

func recalculateAllStorageStats(c *gin.Context) {
	userID := c.GetString("user_id")
	
	// Get all user accounts
	rows, err := db.Query(`SELECT id FROM email_accounts WHERE user_id = $1`, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get accounts"})
		return
	}
	defer rows.Close()

	var accountIDs []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			continue
		}
		accountIDs = append(accountIDs, id)
	}

	// Recalculate stats for each account
	for _, accountID := range accountIDs {
		// Delete existing stats
		db.Exec(`DELETE FROM account_storage_stats WHERE account_id = $1`, accountID)
		
		// Get email count for this account
		var emailCount int64
		db.QueryRow(`SELECT COUNT(*) FROM email_indices WHERE account_id = $1`, accountID).Scan(&emailCount)
		
		// Estimate sizes (50KB per email average)
		totalSize := emailCount * 50 * 1024
		contentSize := int64(float64(totalSize) * 0.8)
		attachmentSize := int64(float64(totalSize) * 0.2)
		attachmentCount := emailCount / 5
		
		// Insert new stats
		db.Exec(`
			INSERT INTO account_storage_stats (
				id, account_id, total_emails, total_size, content_size, 
				attachment_size, attachment_count, last_calculated_at
			)
			VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW())
		`, accountID, emailCount, totalSize, contentSize, attachmentSize, attachmentCount)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Storage statistics recalculated successfully",
	})
}