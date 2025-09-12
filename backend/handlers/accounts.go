package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"emailprojectv2/auth"
	"emailprojectv2/database"
	"emailprojectv2/models"
	"emailprojectv2/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AccountHandler struct{
	jwtSecret string
}

type AddGmailRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"` // App password
}

type AddExchangeRequest struct {
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required"`
	ServerURL string `json:"server_url" binding:"required"`
	Domain    string `json:"domain"`
	Username  string `json:"username" binding:"required"`
}

type SyncRequest struct {
	AccountID string `json:"account_id" binding:"required"`
}

type AddOffice365Request struct {
	Email    string `json:"email" binding:"required,email"`
	TenantID string `json:"tenant_id"`
}

type AddIMAPRequest struct {
	Email        string `json:"email" binding:"required,email"`
	Password     string `json:"password"`
	IMAPServer   string `json:"imap_server" binding:"required"`
	IMAPPort     int    `json:"imap_port" binding:"required"`
	IMAPSecurity string `json:"imap_security" binding:"required"` // SSL, TLS, STARTTLS, NONE
	AuthMethod   string `json:"auth_method" binding:"required"`   // password, oauth2, xoauth2, app_password
	Provider     string `json:"provider" binding:"required"`      // yahoo, outlook, custom_imap
}

type OAuth2CallbackRequest struct {
	Code  string `json:"code" binding:"required"`
	State string `json:"state" binding:"required"`
}

func NewAccountHandler(jwtSecret string) *AccountHandler {
	return &AccountHandler{jwtSecret: jwtSecret}
}

func (h *AccountHandler) AddGmailAccount(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	var req AddGmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Test Gmail connection first
	gmailService := services.NewGmailServiceV1("imap.gmail.com", "993", req.Email, req.Password)
	if err := gmailService.TestConnection(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to connect to Gmail: " + err.Error()})
		return
	}

	// Check if account already exists
	var existingAccount database.EmailAccount
	err := database.DB.Where("user_id = ? AND email = ? AND provider = ?", userID, req.Email, "gmail").First(&existingAccount).Error
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Gmail account already exists"})
		return
	}

	// Create account record
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	account := database.EmailAccount{
		ID:       uuid.New(),
		UserID:   userUUID,
		Email:    req.Email,
		Provider: "gmail",
		Username: req.Email,
		Password: req.Password, // In production, this should be encrypted
		IsActive: true,
	}

	if err := database.DB.Create(&account).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save account"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Gmail account added successfully",
		"account": account,
	})
}

func (h *AccountHandler) AddExchangeAccount(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	var req AddExchangeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Test Exchange connection first
	exchangeService := services.NewExchangeService(req.ServerURL, req.Username, req.Password, req.Domain)
	if err := exchangeService.TestConnection(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to connect to Exchange: " + err.Error()})
		return
	}

	// Check if account already exists
	var existingAccount database.EmailAccount
	err := database.DB.Where("user_id = ? AND email = ? AND provider = ?", userID, req.Email, "exchange").First(&existingAccount).Error
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Exchange account already exists"})
		return
	}

	// Create account record
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	account := database.EmailAccount{
		ID:        uuid.New(),
		UserID:    userUUID,
		Email:     req.Email,
		Provider:  "exchange",
		ServerURL: req.ServerURL,
		Domain:    req.Domain,
		Username:  req.Username,
		Password:  req.Password, // In production, this should be encrypted
		IsActive:  true,
	}

	if err := database.DB.Create(&account).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save account"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Exchange account added successfully",
		"account": account,
	})
}

func (h *AccountHandler) GetAccounts(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	var accounts []database.EmailAccount
	err := database.DB.Where("user_id = ?", userID).Find(&accounts).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch accounts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"accounts": accounts,
	})
}

func (h *AccountHandler) SyncAccount(c *gin.Context) {
	log.Printf("🔄 Sync request for account: %s", c.Param("id"))
	
	userID := c.GetString("user_id")
	if userID == "" {
		log.Printf("❌ No user_id from middleware")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	log.Printf("✅ User authenticated: %s", userID)

	accountID := c.Param("id")
	if accountID == "" {
		log.Printf("❌ No account ID provided")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Account ID required"})
		return
	}

	// Parse account ID
	accountUUID, err := uuid.Parse(accountID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account ID"})
		return
	}

	// Check if account is already syncing
	if services.ProgressManager.IsAccountSyncing(accountUUID) {
		c.JSON(http.StatusConflict, gin.H{
			"error": "Account is already syncing",
			"message": "Please wait for the current sync to complete",
		})
		return
	}

	// Get account details
	var account database.EmailAccount
	err = database.DB.Where("id = ? AND user_id = ?", accountID, userID).First(&account).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Account not found"})
		return
	}

	// Start sync in background
	go func() {
		switch account.Provider {
		case "gmail":
			gmailService := services.NewGmailServiceV1("imap.gmail.com", "993", account.Username, account.Password)
			gmailService.SyncEmailsWithProgress(account.ID)
		case "exchange":
			log.Printf("📧 Starting Exchange email sync...")
			exchangeService := services.NewExchangeService(account.ServerURL, account.Username, account.Password, account.Domain)
			exchangeService.SyncEmailsWithProgress(account.ID)
		case "office365":
			log.Printf("📧 Starting Office 365 email sync...")
			office365Service := services.NewOffice365ServiceWithToken("common", "", "", account.Email, account.ID)
			office365Service.SyncEmailsWithProgress(account.ID)
		case "yahoo", "outlook", "custom_imap":
			log.Printf("📧 Starting IMAP sync for %s...", account.Provider)
			providerType := models.ProviderType(account.Provider)
			imapService := services.NewIMAPGeneralService(account.IMAPServer, account.IMAPPort, account.Username, account.Password, account.AuthMethod, account.ID, providerType)
			
			// Set security settings based on stored configuration
			useSSL := account.IMAPSecurity == "SSL"
			useTLS := account.IMAPSecurity == "TLS"
			useSTARTTLS := account.IMAPSecurity == "STARTTLS"
			imapService.SetSecuritySettings(useSSL, useTLS, useSTARTTLS)
			
			imapService.SyncEmailsWithProgress(account.ID)
		default:
			log.Printf("❌ Unknown provider type: %s", account.Provider)
		}
	}()

	c.JSON(http.StatusOK, gin.H{
		"message": "Email sync has been initiated",
		"account_id": accountID,
		"sync_stream_url": fmt.Sprintf("/api/accounts/%s/sync-stream", accountID),
	})
}

func (h *AccountHandler) DeleteAccount(c *gin.Context) {
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

	// Get account details to verify ownership
	var account database.EmailAccount
	err := database.DB.Where("id = ? AND user_id = ?", accountID, userID).First(&account).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Account not found"})
		return
	}

	// Delete associated emails first
	if err := database.DB.Where("account_id = ?", accountID).Delete(&database.EmailIndex{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete emails"})
		return
	}

	// Delete the account
	if err := database.DB.Delete(&account).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete account"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Account deleted successfully",
	})
}

func (h *AccountHandler) SyncStream(c *gin.Context) {
	log.Printf("🔗 SSE Connection attempt for account: %s", c.Param("id"))
	
	// SSE doesn't support headers, so we need to get token from query param
	token := c.Query("token")
	log.Printf("🔑 SSE Token received: %t (length: %d)", token != "", len(token))
	
	if token == "" {
		log.Printf("❌ No token in query param - authentication required")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication token required"})
		return
	}
	
	log.Printf("🔍 Validating token from query param...")
	// Verify token from query param  
	claims, err := auth.ValidateToken(token, h.jwtSecret)
	if err != nil {
		log.Printf("❌ Token validation failed: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}
	log.Printf("✅ Token validated successfully for user: %s", claims.UserID)
	// Set user_id for consistency
	c.Set("user_id", claims.UserID)
	
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

	// Parse account ID
	accountUUID, err := uuid.Parse(accountID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account ID"})
		return
	}

	// Verify account ownership
	var account database.EmailAccount
	err = database.DB.Where("id = ? AND user_id = ?", accountID, userID).First(&account).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Account not found"})
		return
	}

	// Set SSE headers
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("Access-Control-Allow-Headers", "Cache-Control")

	// Subscribe to progress updates
	progressChan := services.ProgressManager.Subscribe(accountUUID)
	defer services.ProgressManager.Unsubscribe(accountUUID, progressChan)

	// Send initial connection message
	c.SSEvent("connected", gin.H{
		"account_id": accountID,
		"timestamp": fmt.Sprintf("%d", time.Now().Unix()),
	})
	c.Writer.Flush()

	// Keep connection alive and send progress updates
	clientGone := c.Writer.CloseNotify()
	for {
		select {
		case <-clientGone:
			return
		case message := <-progressChan:
			if message == "" {
				continue
			}
			c.Writer.WriteString(message)
			c.Writer.Flush()
		}
	}
}

func (h *AccountHandler) GetSyncProgress(c *gin.Context) {
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

	// Parse account ID
	accountUUID, err := uuid.Parse(accountID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account ID"})
		return
	}

	// Verify account ownership
	var account database.EmailAccount
	err = database.DB.Where("id = ? AND user_id = ?", accountID, userID).First(&account).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Account not found"})
		return
	}

	// Get current progress
	progress := services.ProgressManager.GetProgress(accountUUID)
	if progress == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "No active sync found for this account",
			"is_syncing": false,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"progress": progress,
		"is_syncing": !progress.IsCompleted,
	})
}

func (h *AccountHandler) GetSyncHistory(c *gin.Context) {
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

	// Parse account ID
	accountUUID, err := uuid.Parse(accountID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account ID"})
		return
	}

	// Verify account ownership
	var account database.EmailAccount
	err = database.DB.Where("id = ? AND user_id = ?", accountID, userID).First(&account).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Account not found"})
		return
	}

	// Parse limit parameter
	limitStr := c.DefaultQuery("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}
	if limit > 50 { // Max limit
		limit = 50
	}

	// Get sync history
	history, err := services.ProgressManager.GetSyncHistory(accountUUID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch sync history"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"history": history,
		"count": len(history),
	})
}

// AddOffice365Account initiates Office 365 OAuth2 flow
func (h *AccountHandler) AddOffice365Account(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	var req AddOffice365Request
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create account placeholder
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	account := database.EmailAccount{
		ID:         uuid.New(),
		UserID:     userUUID,
		Email:      req.Email,
		Provider:   "office365",
		AuthMethod: "oauth2",
		IsActive:   false, // Will be activated after OAuth2 flow
	}

	if err := database.DB.Create(&account).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create account placeholder"})
		return
	}

	// Create Office 365 service and generate auth URL
	tenantID := req.TenantID
	if tenantID == "" {
		tenantID = "common"
	}
	
	office365Service := services.NewOffice365Service(tenantID, "", "", req.Email, account.ID)
	authURL := office365Service.GetAuthURL(account.ID.String())

	c.JSON(http.StatusCreated, gin.H{
		"message":    "Office 365 account placeholder created",
		"account_id": account.ID.String(),
		"auth_url":   authURL,
	})
}

// AddIMAPAccount adds a general IMAP account (Yahoo, Outlook, Custom)
func (h *AccountHandler) AddIMAPAccount(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	var req AddIMAPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate provider type
	if !models.ValidateProviderType(req.Provider) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid provider type"})
		return
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Check if account already exists
	var existingAccount database.EmailAccount
	err = database.DB.Where("user_id = ? AND email = ? AND provider = ?", userID, req.Email, req.Provider).First(&existingAccount).Error
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Account already exists for this provider"})
		return
	}

	providerType := models.ProviderType(req.Provider)

	// For OAuth2 providers, initiate OAuth2 flow
	if req.AuthMethod == "oauth2" || req.AuthMethod == "xoauth2" {
		account := database.EmailAccount{
			ID:           uuid.New(),
			UserID:       userUUID,
			Email:        req.Email,
			Provider:     req.Provider,
			IMAPServer:   req.IMAPServer,
			IMAPPort:     req.IMAPPort,
			IMAPSecurity: req.IMAPSecurity,
			AuthMethod:   req.AuthMethod,
			IsActive:     false, // Will be activated after OAuth2 flow
		}

		if err := database.DB.Create(&account).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create account placeholder"})
			return
		}

		// Create IMAP service and generate auth URL
		imapService := services.NewIMAPGeneralService(req.IMAPServer, req.IMAPPort, req.Email, req.Password, req.AuthMethod, account.ID, providerType)
		authURL := imapService.GetAuthURL(account.ID.String())

		if authURL == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "OAuth2 not configured for this provider"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"message":    "IMAP account placeholder created",
			"account_id": account.ID.String(),
			"auth_url":   authURL,
		})
		return
	}

	// For password-based authentication, test connection and create account
	imapService := services.NewIMAPGeneralService(req.IMAPServer, req.IMAPPort, req.Email, req.Password, req.AuthMethod, uuid.New(), providerType)
	
	// Set security settings
	useSSL := req.IMAPSecurity == "SSL"
	useTLS := req.IMAPSecurity == "TLS"
	useSTARTTLS := req.IMAPSecurity == "STARTTLS"
	imapService.SetSecuritySettings(useSSL, useTLS, useSTARTTLS)

	if err := imapService.TestConnection(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to connect to IMAP server: " + err.Error()})
		return
	}

	// Create account record
	account := database.EmailAccount{
		ID:           uuid.New(),
		UserID:       userUUID,
		Email:        req.Email,
		Provider:     req.Provider,
		Username:     req.Email,
		Password:     req.Password, // In production, this should be encrypted
		IMAPServer:   req.IMAPServer,
		IMAPPort:     req.IMAPPort,
		IMAPSecurity: req.IMAPSecurity,
		AuthMethod:   req.AuthMethod,
		IsActive:     true,
	}

	if err := database.DB.Create(&account).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save account"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "IMAP account added successfully",
		"account": account,
	})
}

// OAuth2Callback handles OAuth2 callback for all providers
func (h *AccountHandler) OAuth2Callback(c *gin.Context) {
	provider := c.Param("provider")
	code := c.Query("code")
	state := c.Query("state")

	if code == "" || state == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing code or state parameter"})
		return
	}

	// Parse account ID from state
	accountID, err := uuid.Parse(state)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid state parameter"})
		return
	}

	// Get account details
	var account database.EmailAccount
	err = database.DB.Where("id = ?", accountID).First(&account).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Account not found"})
		return
	}

	ctx := context.Background()

	switch provider {
	case "office365":
		office365Service := services.NewOffice365Service("common", "", "", account.Email, accountID)
		token, err := office365Service.ExchangeCodeForToken(ctx, code)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to exchange code for token: " + err.Error()})
			return
		}

		// Activate account
		account.IsActive = true
		if err := database.DB.Save(&account).Error; err != nil {
			log.Printf("Warning: failed to activate account: %v", err)
		}

		c.JSON(http.StatusOK, gin.H{
			"message":     "Office 365 account authorized successfully",
			"account_id":  account.ID.String(),
			"expires_at":  token.Expiry,
		})

	case "yahoo", "outlook":
		providerType := models.ProviderType(provider)
		imapService := services.NewIMAPGeneralService(account.IMAPServer, account.IMAPPort, account.Email, "", account.AuthMethod, accountID, providerType)
		
		token, err := imapService.ExchangeCodeForToken(ctx, code)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to exchange code for token: " + err.Error()})
			return
		}

		// Activate account
		account.IsActive = true
		if err := database.DB.Save(&account).Error; err != nil {
			log.Printf("Warning: failed to activate account: %v", err)
		}

		c.JSON(http.StatusOK, gin.H{
			"message":     fmt.Sprintf("%s account authorized successfully", provider),
			"account_id":  account.ID.String(),
			"expires_at":  token.Expiry,
		})

	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported provider"})
	}
}

// GetProviderConfigs returns available provider configurations
func (h *AccountHandler) GetProviderConfigs(c *gin.Context) {
	configs := models.GetProviderConfigs()
	
	// Remove sensitive information like client secrets
	publicConfigs := make(map[string]interface{})
	for providerType, config := range configs {
		publicConfig := gin.H{
			"type":         config.Type,
			"name":         config.Name,
			"display_name": config.DisplayName,
			"imap_server":  config.IMAPServer,
			"imap_port":    config.IMAPPort,
			"imap_security": config.IMAPSecurity,
			"auth_method":  config.AuthMethod,
			"requires_domain": config.RequiresDomain,
			"is_custom":    config.IsCustom,
			"supported_features": config.SupportedFeatures,
		}
		
		if config.OAuth2Config != nil {
			publicConfig["supports_oauth2"] = true
		} else {
			publicConfig["supports_oauth2"] = false
		}
		
		publicConfigs[string(providerType)] = publicConfig
	}
	
	c.JSON(http.StatusOK, gin.H{
		"providers": publicConfigs,
	})
}