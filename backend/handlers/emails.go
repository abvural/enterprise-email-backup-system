package handlers

import (
	"net/http"
	"strconv"

	"emailprojectv2/database"
	"emailprojectv2/storage"

	"github.com/gin-gonic/gin"
)

type EmailHandler struct{}

func NewEmailHandler() *EmailHandler {
	return &EmailHandler{}
}

func (h *EmailHandler) GetEmails(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	accountID := c.Param("id")
	if accountID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Account ID required"})
		return
	}

	// Check if account belongs to user
	var account database.EmailAccount
	err := database.DB.Where("id = ? AND user_id = ?", accountID, userID).First(&account).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Account not found"})
		return
	}

	// Get pagination parameters
	page := 1
	limit := 20
	
	if p := c.Query("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}
	
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	offset := (page - 1) * limit

	// Get emails
	var emails []database.EmailIndex
	var total int64

	// Count total emails
	database.DB.Model(&database.EmailIndex{}).Where("account_id = ?", accountID).Count(&total)

	// Get paginated emails
	err = database.DB.Where("account_id = ?", accountID).
		Order("date DESC").
		Offset(offset).
		Limit(limit).
		Find(&emails).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch emails"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"emails": emails,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
			"pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

func (h *EmailHandler) GetEmail(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	emailID := c.Param("id")
	if emailID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email ID required"})
		return
	}

	// Get email index
	var email database.EmailIndex
	err := database.DB.Preload("Account").Where("id = ?", emailID).First(&email).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Email not found"})
		return
	}

	// Check if email belongs to user
	if email.Account.UserID.String() != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	// Get full email content from MinIO
	if email.MinioPath == "" {
		c.JSON(http.StatusOK, gin.H{
			"email":       email,
			"full_email":  nil,
			"message":     "Email content not available in storage",
		})
		return
	}

	// Retrieve full email content
	fullEmailContent, err := storage.GetEmailFromMinIO(email.MinioPath)
	if err != nil {
		// If we can't get from MinIO, still return the index data
		c.JSON(http.StatusOK, gin.H{
			"email":       email,
			"full_email":  nil,
			"message":     "Failed to retrieve email content from storage",
			"error":       err.Error(),
		})
		return
	}

	// Return both index and full content
	c.JSON(http.StatusOK, gin.H{
		"email":      email,
		"full_email": fullEmailContent,
		"message":    "Email content retrieved successfully",
	})
}