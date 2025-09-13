package handlers

import (
	"net/http"
	"strconv"

	"emailprojectv2/database"
	"emailprojectv2/middleware"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserManagementHandler struct {
	DB *gorm.DB
}

func NewUserManagementHandler(db *gorm.DB) *UserManagementHandler {
	return &UserManagementHandler{DB: db}
}

// CreateUser creates a new user and assigns them to an organization with a role
// POST /api/users
func (umh *UserManagementHandler) CreateUser(c *gin.Context) {
	// Get current user claims
	userClaims, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Check if user can manage users
	if !middleware.CanManageUsers(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to create users"})
		return
	}

	var req struct {
		Email          string `json:"email" binding:"required,email"`
		Password       string `json:"password" binding:"required,min=8"`
		OrganizationID string `json:"organization_id" binding:"required"`
		RoleName       string `json:"role_name" binding:"required,oneof=admin distributor dealer client end_user"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate organization exists and user can assign to it
	orgID, err := uuid.Parse(req.OrganizationID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
		return
	}

	var organization database.Organization
	if err := umh.DB.First(&organization, orgID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Organization not found"})
		return
	}

	// Check if current user can manage this organization
	if userClaims.RoleName != "admin" && !organization.CanUserManage(umh.DB, uuid.MustParse(userClaims.UserID)) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Cannot assign users to this organization"})
		return
	}

	// Validate role exists and current user can assign it
	var role database.Role
	if err := umh.DB.Where("name = ?", req.RoleName).First(&role).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role"})
		return
	}

	// Current user cannot assign a role higher than their own
	if role.Level < userClaims.RoleLevel && userClaims.RoleName != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Cannot assign role higher than your own"})
		return
	}

	// Check if user already exists
	var existingUser database.User
	if err := umh.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Start transaction
	tx := umh.DB.Begin()

	// Create user
	user := database.User{
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		RoleID:       &role.ID,
		PrimaryOrgID: &orgID,
	}

	if err := tx.Create(&user).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Create user-organization relationship
	userOrg := database.UserOrganization{
		UserID:         user.ID,
		OrganizationID: orgID,
		RoleID:         role.ID,
		IsPrimary:      true,
	}

	if err := tx.Create(&userOrg).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign user to organization"})
		return
	}

	// Commit transaction
	tx.Commit()

	// Load relationships for response
	umh.DB.Preload("Role").Preload("PrimaryOrg").First(&user, user.ID)

	// Return user without password
	response := gin.H{
		"id":              user.ID,
		"email":           user.Email,
		"role":            user.Role,
		"primary_org":     user.PrimaryOrg,
		"created_at":      user.CreatedAt,
	}

	c.JSON(http.StatusCreated, response)
}

// GetUsers lists users based on current user's permissions
// GET /api/users
func (umh *UserManagementHandler) GetUsers(c *gin.Context) {
	// Get current user claims
	userClaims, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Check if user can view users
	if !middleware.CanManageUsers(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to view users"})
		return
	}

	// Parse query parameters
	orgIDParam := c.Query("organization_id")
	page := c.DefaultQuery("page", "1")
	limit := c.DefaultQuery("limit", "50")

	var users []database.User
	query := umh.DB.Preload("Role").Preload("PrimaryOrg").Preload("UserOrgs.Organization").Preload("UserOrgs.Role")

	// Filter based on user role and permissions
	if userClaims.RoleName == "admin" {
		// Admin can see all users
		if orgIDParam != "" {
			orgID, err := uuid.Parse(orgIDParam)
			if err == nil {
				query = query.Joins("JOIN user_organizations ON user_organizations.user_id = users.id").
					Where("user_organizations.organization_id = ?", orgID)
			}
		}
	} else {
		// Other roles can only see users in their organization and child organizations
		userOrgID, _ := uuid.Parse(userClaims.OrganizationID)
		
		if orgIDParam != "" {
			// Requesting specific organization - check if they can access it
			requestedOrgID, err := uuid.Parse(orgIDParam)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
				return
			}

			var requestedOrg database.Organization
			if err := umh.DB.First(&requestedOrg, requestedOrgID).Error; err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "Organization not found"})
				return
			}

			if !requestedOrg.CanUserManage(umh.DB, uuid.MustParse(userClaims.UserID)) {
				c.JSON(http.StatusForbidden, gin.H{"error": "Cannot access users from this organization"})
				return
			}

			query = query.Joins("JOIN user_organizations ON user_organizations.user_id = users.id").
				Where("user_organizations.organization_id = ?", requestedOrgID)
		} else {
			// Show users from their organization and child organizations
			var accessibleOrgIDs []uuid.UUID
			
			// Add current organization
			accessibleOrgIDs = append(accessibleOrgIDs, userOrgID)
			
			// Add child organizations
			var childOrgs []database.Organization
			umh.DB.Where("parent_org_id = ?", userOrgID).Find(&childOrgs)
			for _, org := range childOrgs {
				accessibleOrgIDs = append(accessibleOrgIDs, org.ID)
			}

			query = query.Joins("JOIN user_organizations ON user_organizations.user_id = users.id").
				Where("user_organizations.organization_id IN ?", accessibleOrgIDs)
		}
	}

	// Apply pagination
	var total int64
	query.Model(&database.User{}).Count(&total)

	pageInt := 1
	limitInt := 50
	if p, err := strconv.Atoi(page); err == nil && p > 0 {
		pageInt = p
	}
	if l, err := strconv.Atoi(limit); err == nil && l > 0 && l <= 100 {
		limitInt = l
	}

	offset := (pageInt - 1) * limitInt
	query = query.Offset(offset).Limit(limitInt)

	if err := query.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	// Prepare response
	var response []gin.H
	for _, user := range users {
		userResponse := gin.H{
			"id":          user.ID,
			"email":       user.Email,
			"role":        user.Role,
			"primary_org": user.PrimaryOrg,
			"user_orgs":   user.UserOrgs,
			"created_at":  user.CreatedAt,
			"updated_at":  user.UpdatedAt,
		}
		response = append(response, userResponse)
	}

	c.JSON(http.StatusOK, gin.H{
		"users": response,
		"pagination": gin.H{
			"page":  pageInt,
			"limit": limitInt,
			"total": total,
		},
	})
}

// GetUser gets a specific user by ID
// GET /api/users/:id
func (umh *UserManagementHandler) GetUser(c *gin.Context) {
	userID := c.Param("id")
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get current user claims
	userClaims, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var user database.User
	if err := umh.DB.Preload("Role").Preload("PrimaryOrg").Preload("UserOrgs.Organization").Preload("UserOrgs.Role").First(&user, userUUID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
		return
	}

	// Check permissions - users can view themselves, managers can view users in their org
	if userClaims.UserID != userID && !middleware.CanManageUsers(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	// If not admin, check if the user is in an accessible organization
	if userClaims.RoleName != "admin" && userClaims.UserID != userID {
		canAccess := false
		userOrgID, _ := uuid.Parse(userClaims.OrganizationID)
		
		for _, userOrg := range user.UserOrgs {
			if userOrg.OrganizationID == userOrgID {
				canAccess = true
				break
			}
			
			// Check if it's a child organization
			var org database.Organization
			if umh.DB.First(&org, userOrg.OrganizationID).Error == nil {
				if org.ParentOrgID != nil && *org.ParentOrgID == userOrgID {
					canAccess = true
					break
				}
			}
		}

		if !canAccess {
			c.JSON(http.StatusForbidden, gin.H{"error": "User not in accessible organization"})
			return
		}
	}

	response := gin.H{
		"id":          user.ID,
		"email":       user.Email,
		"role":        user.Role,
		"primary_org": user.PrimaryOrg,
		"user_orgs":   user.UserOrgs,
		"created_at":  user.CreatedAt,
		"updated_at":  user.UpdatedAt,
	}

	c.JSON(http.StatusOK, response)
}

// UpdateUser updates a user's role or organization
// PUT /api/users/:id
func (umh *UserManagementHandler) UpdateUser(c *gin.Context) {
	userID := c.Param("id")
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get current user claims
	userClaims, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Check permissions
	if !middleware.CanManageUsers(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to update users"})
		return
	}

	var req struct {
		RoleName       *string `json:"role_name,omitempty"`
		OrganizationID *string `json:"organization_id,omitempty"`
		IsActive       *bool   `json:"is_active,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find the user
	var user database.User
	if err := umh.DB.Preload("Role").Preload("PrimaryOrg").First(&user, userUUID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
		return
	}

	// Start transaction
	tx := umh.DB.Begin()

	// Update role if provided
	if req.RoleName != nil {
		var newRole database.Role
		if err := tx.Where("name = ?", *req.RoleName).First(&newRole).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role"})
			return
		}

		// Current user cannot assign a role higher than their own
		if newRole.Level < userClaims.RoleLevel && userClaims.RoleName != "admin" {
			tx.Rollback()
			c.JSON(http.StatusForbidden, gin.H{"error": "Cannot assign role higher than your own"})
			return
		}

		user.RoleID = &newRole.ID

		// Update user-organization relationship
		if err := tx.Model(&database.UserOrganization{}).
			Where("user_id = ? AND is_primary = true", userUUID).
			Update("role_id", newRole.ID).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user role"})
			return
		}
	}

	// Update organization if provided
	if req.OrganizationID != nil {
		newOrgID, err := uuid.Parse(*req.OrganizationID)
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
			return
		}

		var newOrg database.Organization
		if err := tx.First(&newOrg, newOrgID).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusNotFound, gin.H{"error": "Organization not found"})
			return
		}

		// Check if current user can assign to this organization
		if userClaims.RoleName != "admin" && !newOrg.CanUserManage(umh.DB, uuid.MustParse(userClaims.UserID)) {
			tx.Rollback()
			c.JSON(http.StatusForbidden, gin.H{"error": "Cannot assign users to this organization"})
			return
		}

		user.PrimaryOrgID = &newOrgID

		// Update user-organization relationship
		if err := tx.Model(&database.UserOrganization{}).
			Where("user_id = ? AND is_primary = true", userUUID).
			Update("organization_id", newOrgID).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user organization"})
			return
		}
	}

	// Save user changes
	if err := tx.Save(&user).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	// Commit transaction
	tx.Commit()

	// Load updated relationships
	umh.DB.Preload("Role").Preload("PrimaryOrg").First(&user, user.ID)

	response := gin.H{
		"id":          user.ID,
		"email":       user.Email,
		"role":        user.Role,
		"primary_org": user.PrimaryOrg,
		"updated_at":  user.UpdatedAt,
	}

	c.JSON(http.StatusOK, response)
}

// DeleteUser deactivates a user
// DELETE /api/users/:id
func (umh *UserManagementHandler) DeleteUser(c *gin.Context) {
	userID := c.Param("id")
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get current user claims
	userClaims, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Check permissions
	if !middleware.CanManageUsers(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to delete users"})
		return
	}

	// Cannot delete yourself
	if userClaims.UserID == userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Cannot delete your own account"})
		return
	}

	// Find the user
	var user database.User
	if err := umh.DB.First(&user, userUUID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
		return
	}

	// For now, we'll implement soft delete by deactivating email accounts
	// In a full implementation, you might want to add an is_active field to users table
	if err := umh.DB.Model(&database.EmailAccount{}).
		Where("user_id = ?", userUUID).
		Update("is_active", false).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to deactivate user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deactivated successfully"})
}