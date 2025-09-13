package handlers

import (
	"net/http"

	"emailprojectv2/auth"
	"emailprojectv2/database"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AuthHandler struct {
	JWTSecret string
}

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	Token string              `json:"token"`
	User  database.User       `json:"user"`
}

func NewAuthHandler(jwtSecret string) *AuthHandler {
	return &AuthHandler{
		JWTSecret: jwtSecret,
	}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user already exists
	var existingUser database.User
	if err := database.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
		return
	}

	// Hash password
	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Get default end_user role
	var endUserRole database.Role
	if err := database.DB.Where("name = ?", "end_user").First(&endUserRole).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Default role not found"})
		return
	}

	// Create user with default role (no organization assignment for registration)
	user := database.User{
		ID:           uuid.New(),
		Email:        req.Email,
		PasswordHash: hashedPassword,
		RoleID:       &endUserRole.ID,
		// PrimaryOrgID will be nil - user needs to be assigned to organization by admin
	}

	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Generate token with default values
	token, err := auth.GenerateTokenWithRole(
		user.ID.String(),
		user.Email,
		"end_user",
		5,
		"", // No organization
		"client",
		h.JWTSecret,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Load role for response
	database.DB.Preload("Role").First(&user, user.ID)

	userResponse := map[string]interface{}{
		"id":         user.ID,
		"email":      user.Email,
		"role":       user.Role,
		"primary_org": nil, // No organization assigned
		"created_at": user.CreatedAt,
	}

	c.JSON(http.StatusCreated, gin.H{
		"token": token,
		"user":  userResponse,
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find user with role and organization information
	var user database.User
	if err := database.DB.Preload("Role").Preload("PrimaryOrg").Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Check password
	if !auth.CheckPassword(req.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Prepare token data - use defaults for users without organization assignment
	var roleName string = "end_user"
	var roleLevel int = 5
	var organizationID string = ""
	var orgType string = "client"

	if user.Role != nil {
		roleName = user.Role.Name
		roleLevel = user.Role.Level
	}

	if user.PrimaryOrg != nil {
		organizationID = user.PrimaryOrg.ID.String()
		orgType = user.PrimaryOrg.Type
	}

	// Generate token with organization information
	token, err := auth.GenerateTokenWithRole(
		user.ID.String(),
		user.Email,
		roleName,
		roleLevel,
		organizationID,
		orgType,
		h.JWTSecret,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Prepare user response
	userResponse := map[string]interface{}{
		"id":         user.ID,
		"email":      user.Email,
		"role":       user.Role,
		"primary_org": user.PrimaryOrg,
		"created_at": user.CreatedAt,
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  userResponse,
	})
}