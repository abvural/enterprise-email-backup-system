package handlers

import (
	"net/http"
	"time"

	"emailprojectv2/auth"
	"emailprojectv2/database"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// StorageHandler handles storage statistics requests
type StorageHandler struct{}

// NewStorageHandler creates a new storage handler
func NewStorageHandler() *StorageHandler {
	return &StorageHandler{}
}

// GetTotalStorageStats returns total storage statistics for the user
func (h *StorageHandler) GetTotalStorageStats(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	// Check user role - admins should not have access to storage stats
	userClaims, exists := c.Get("user")
	if exists {
		claims := userClaims.(*auth.Claims)
		if claims.RoleName == "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Admins do not have access to storage statistics"})
			return
		}
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get total statistics from account_storage_stats table
	var stats struct {
		TotalEmails       int64 `json:"total_emails"`
		TotalSize         int64 `json:"total_size"`
		ContentSize       int64 `json:"content_size"`
		AttachmentSize    int64 `json:"attachment_size"`
		AttachmentCount   int64 `json:"attachment_count"`
	}

	// Query aggregated stats from account_storage_stats
	err = database.DB.Raw(`
		SELECT 
			COALESCE(SUM(total_emails), 0) as total_emails,
			COALESCE(SUM(total_size), 0) as total_size,
			COALESCE(SUM(content_size), 0) as content_size,
			COALESCE(SUM(attachment_size), 0) as attachment_size,
			COALESCE(SUM(attachment_count), 0) as attachment_count
		FROM account_storage_stats
		JOIN email_accounts ON email_accounts.id = account_storage_stats.account_id
		WHERE email_accounts.user_id = ?
	`, userUUID).Scan(&stats).Error

	if err != nil {
		// If no stats found, try to calculate from email_indices
		err = database.DB.Raw(`
			SELECT 
				COUNT(*) as total_emails,
				COALESCE(SUM(email_size), 0) as total_size,
				COALESCE(SUM(content_size), 0) as content_size,
				COALESCE(SUM(attachment_size), 0) as attachment_size,
				COALESCE(SUM(attachment_count), 0) as attachment_count
			FROM email_indices
			JOIN email_accounts ON email_accounts.id = email_indices.account_id
			WHERE email_accounts.user_id = ?
		`, userUUID).Scan(&stats).Error
		
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get storage stats"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"total_stats": gin.H{
			"total_emails":        stats.TotalEmails,
			"total_size_bytes":    stats.TotalSize,
			"content_size_bytes":  stats.ContentSize,
			"attachment_size_bytes": stats.AttachmentSize,
			"attachment_count":    stats.AttachmentCount,
			"last_calculated_at":  time.Now().Format(time.RFC3339),
		},
	})
}

// GetAccountsWithStorageStats returns all accounts with their storage statistics
func (h *StorageHandler) GetAccountsWithStorageStats(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	// Check user role - admins should not have access to storage stats
	userClaims, exists := c.Get("user")
	if exists {
		claims := userClaims.(*auth.Claims)
		if claims.RoleName == "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Admins do not have access to storage statistics"})
			return
		}
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	type AccountWithStorage struct {
		ID               uuid.UUID `json:"id"`
		Email            string    `json:"email"`
		Provider         string    `json:"provider"`
		TotalEmails      int64     `json:"total_emails"`
		TotalSize        int64     `json:"total_size_bytes"`
		LastSyncDate     *time.Time `json:"last_sync_date"`
	}

	var accounts []AccountWithStorage

	// Get accounts with storage stats
	err = database.DB.Raw(`
		SELECT 
			ea.id,
			ea.email,
			ea.provider,
			COALESCE(ass.total_emails, 0) as total_emails,
			COALESCE(ass.total_size, 0) as total_size,
			ea.last_sync_date
		FROM email_accounts ea
		LEFT JOIN account_storage_stats ass ON ass.account_id = ea.id
		WHERE ea.user_id = ?
		ORDER BY ea.created_at DESC
	`, userUUID).Scan(&accounts).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get accounts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"accounts": accounts})
}

// RecalculateAllStorageStats recalculates storage statistics for all user accounts
func (h *StorageHandler) RecalculateAllStorageStats(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get all user accounts
	var accountIDs []uuid.UUID
	err = database.DB.Raw(`
		SELECT id FROM email_accounts WHERE user_id = ?
	`, userUUID).Scan(&accountIDs).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get accounts"})
		return
	}

	// Recalculate stats for each account
	for _, accountID := range accountIDs {
		// Delete existing stats
		database.DB.Exec(`DELETE FROM account_storage_stats WHERE account_id = ?`, accountID)
		database.DB.Exec(`DELETE FROM folder_storage_stats WHERE account_id = ?`, accountID)
		
		// Insert new account stats
		database.DB.Exec(`
			INSERT INTO account_storage_stats (
				id, account_id, total_emails, total_size, content_size, 
				attachment_size, attachment_count, last_calculated_at
			)
			SELECT 
				gen_random_uuid(),
				?, 
				COUNT(*),
				COALESCE(SUM(email_size), 0),
				COALESCE(SUM(content_size), 0),
				COALESCE(SUM(attachment_size), 0),
				COALESCE(SUM(attachment_count), 0),
				NOW()
			FROM email_indices
			WHERE account_id = ?
		`, accountID, accountID)

		// Insert new folder stats
		database.DB.Exec(`
			INSERT INTO folder_storage_stats (
				id, account_id, folder_name, total_emails, total_size, 
				content_size, attachment_size, attachment_count, last_calculated_at
			)
			SELECT 
				gen_random_uuid(),
				?, 
				folder,
				COUNT(*),
				COALESCE(SUM(email_size), 0),
				COALESCE(SUM(content_size), 0),
				COALESCE(SUM(attachment_size), 0),
				COALESCE(SUM(attachment_count), 0),
				NOW()
			FROM email_indices
			WHERE account_id = ?
			GROUP BY folder
		`, accountID, accountID)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Storage statistics recalculated successfully",
		"accounts_processed": len(accountIDs),
	})
}

// GetAccountStorageStats returns storage statistics for a specific account
func (h *StorageHandler) GetAccountStorageStats(c *gin.Context) {
	userID := c.GetString("user_id")
	accountID := c.Param("accountId")
	
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	// Check user role - admins should not have access
	userClaims, exists := c.Get("user")
	if exists {
		claims := userClaims.(*auth.Claims)
		if claims.RoleName == "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Admins do not have access to storage statistics"})
			return
		}
	}

	accountUUID, err := uuid.Parse(accountID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account ID"})
		return
	}

	// Verify account access (organization-based filtering)
	userUUID, _ := uuid.Parse(userID)
	var account database.EmailAccount
	err = database.DB.Where("id = ? AND user_id = ?", accountUUID, userUUID).First(&account).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Account not found or access denied"})
		return
	}

	// Get real storage stats from database
	var stats struct {
		TotalEmails       int64 `json:"total_emails"`
		TotalSize         int64 `json:"total_size"`
		ContentSize       int64 `json:"content_size"`
		AttachmentSize    int64 `json:"attachment_size"`
		AttachmentCount   int64 `json:"attachment_count"`
	}

	// Try account_storage_stats first
	err = database.DB.Raw(`
		SELECT 
			total_emails, total_size, content_size, 
			attachment_size, attachment_count
		FROM account_storage_stats 
		WHERE account_id = ?
	`, accountUUID).Scan(&stats).Error

	if err != nil {
		// Fallback to email_indices calculation
		database.DB.Raw(`
			SELECT 
				COUNT(*) as total_emails,
				COALESCE(SUM(email_size), 0) as total_size,
				COALESCE(SUM(content_size), 0) as content_size,
				COALESCE(SUM(attachment_size), 0) as attachment_size,
				COALESCE(SUM(attachment_count), 0) as attachment_count
			FROM email_indices 
			WHERE account_id = ?
		`, accountUUID).Scan(&stats)
	}

	c.JSON(http.StatusOK, gin.H{
		"storage_stats": gin.H{
			"account_id":         accountID,
			"total_emails":       stats.TotalEmails,
			"total_size":         stats.TotalSize,
			"content_size":       stats.ContentSize,
			"attachment_size":    stats.AttachmentSize,
			"attachment_count":   stats.AttachmentCount,
			"last_calculated_at": time.Now().Format(time.RFC3339),
		},
	})
}

// GetFolderStorageStats returns folder storage statistics for an account
func (h *StorageHandler) GetFolderStorageStats(c *gin.Context) {
	userID := c.GetString("user_id")
	accountID := c.Param("accountId")
	
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	// Check user role - admins should not have access
	userClaims, exists := c.Get("user")
	if exists {
		claims := userClaims.(*auth.Claims)
		if claims.RoleName == "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Admins do not have access to storage statistics"})
			return
		}
	}

	accountUUID, err := uuid.Parse(accountID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account ID"})
		return
	}

	// Verify account access
	userUUID, _ := uuid.Parse(userID)
	var account database.EmailAccount
	err = database.DB.Where("id = ? AND user_id = ?", accountUUID, userUUID).First(&account).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Account not found or access denied"})
		return
	}

	// Get real folder stats from database
	type FolderStats struct {
		FolderName      string `json:"folder_name"`
		TotalEmails     int64  `json:"email_count"`
		TotalSize       int64  `json:"total_size"`
		ContentSize     int64  `json:"content_size"`
		AttachmentSize  int64  `json:"attachment_size"`
		AttachmentCount int64  `json:"attachment_count"`
	}

	var folderStats []FolderStats

	// Try folder_storage_stats first
	err = database.DB.Raw(`
		SELECT 
			folder_name, total_emails, total_size, 
			content_size, attachment_size, attachment_count
		FROM folder_storage_stats 
		WHERE account_id = ?
		ORDER BY folder_name
	`, accountUUID).Scan(&folderStats).Error

	if err != nil || len(folderStats) == 0 {
		// Fallback to email_indices calculation by folder
		database.DB.Raw(`
			SELECT 
				folder as folder_name,
				COUNT(*) as total_emails,
				COALESCE(SUM(email_size), 0) as total_size,
				COALESCE(SUM(content_size), 0) as content_size,
				COALESCE(SUM(attachment_size), 0) as attachment_size,
				COALESCE(SUM(attachment_count), 0) as attachment_count
			FROM email_indices 
			WHERE account_id = ?
			GROUP BY folder
			ORDER BY folder
		`, accountUUID).Scan(&folderStats)
	}

	c.JSON(http.StatusOK, gin.H{
		"folder_stats": folderStats,
	})
}

// RecalculateStorageStats recalculates storage for a specific account
func (h *StorageHandler) RecalculateStorageStats(c *gin.Context) {
	userID := c.GetString("user_id")
	accountIDStr := c.Param("accountId")
	
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	// Check user role - admins should not have access
	userClaims, exists := c.Get("user")
	if exists {
		claims := userClaims.(*auth.Claims)
		if claims.RoleName == "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Admins do not have access to storage operations"})
			return
		}
	}

	accountUUID, err := uuid.Parse(accountIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account ID"})
		return
	}

	// Verify account access
	userUUID, _ := uuid.Parse(userID)
	var account database.EmailAccount
	err = database.DB.Where("id = ? AND user_id = ?", accountUUID, userUUID).First(&account).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Account not found or access denied"})
		return
	}

	// Delete existing stats
	database.DB.Exec(`DELETE FROM account_storage_stats WHERE account_id = ?`, accountUUID)
	database.DB.Exec(`DELETE FROM folder_storage_stats WHERE account_id = ?`, accountUUID)
	
	// Insert new account stats
	database.DB.Exec(`
		INSERT INTO account_storage_stats (
			id, account_id, total_emails, total_size, content_size, 
			attachment_size, attachment_count, last_calculated_at
		)
		SELECT 
			gen_random_uuid(),
			?, 
			COUNT(*),
			COALESCE(SUM(email_size), 0),
			COALESCE(SUM(content_size), 0),
			COALESCE(SUM(attachment_size), 0),
			COALESCE(SUM(attachment_count), 0),
			NOW()
		FROM email_indices
		WHERE account_id = ?
	`, accountUUID, accountUUID)

	// Insert new folder stats
	database.DB.Exec(`
		INSERT INTO folder_storage_stats (
			id, account_id, folder_name, total_emails, total_size, 
			content_size, attachment_size, attachment_count, last_calculated_at
		)
		SELECT 
			gen_random_uuid(),
			?, 
			folder,
			COUNT(*),
			COALESCE(SUM(email_size), 0),
			COALESCE(SUM(content_size), 0),
			COALESCE(SUM(attachment_size), 0),
			COALESCE(SUM(attachment_count), 0),
			NOW()
		FROM email_indices
		WHERE account_id = ?
		GROUP BY folder
	`, accountUUID, accountUUID)

	c.JSON(http.StatusOK, gin.H{
		"message":    "Storage statistics recalculated successfully",
		"account_id": accountIDStr,
		"timestamp":  time.Now().Format(time.RFC3339),
	})
}