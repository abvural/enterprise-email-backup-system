package handlers

import (
	"net/http"
	"strconv"

	"emailprojectv2/database"
	"emailprojectv2/middleware"
	"emailprojectv2/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type OrganizationHandler struct {
	DB               *gorm.DB
	StatisticsService *services.StatisticsService
}

func NewOrganizationHandler(db *gorm.DB) *OrganizationHandler {
	return &OrganizationHandler{
		DB:                db,
		StatisticsService: services.NewStatisticsService(db),
	}
}

// CreateOrganization creates a new organization
// POST /api/organizations
func (oh *OrganizationHandler) CreateOrganization(c *gin.Context) {
	// Get user claims
	userClaims, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req struct {
		Name             string `json:"name" binding:"required"`
		Type             string `json:"type" binding:"required,oneof=distributor dealer client"`
		ParentOrgID      string `json:"parent_org_id,omitempty"`
		MaxUsers         *int   `json:"max_users"`
		MaxStorageGB     *int   `json:"max_storage_gb"`
		MaxEmailAccounts *int   `json:"max_email_accounts"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check permissions based on user role
	if userClaims.RoleLevel > 3 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to create organizations"})
		return
	}

	// Validate parent organization if specified
	var parentOrgID *uuid.UUID
	if req.ParentOrgID != "" {
		parentID, err := uuid.Parse(req.ParentOrgID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parent organization ID"})
			return
		}
		
		var parentOrg database.Organization
		if err := oh.DB.First(&parentOrg, parentID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Parent organization not found"})
			return
		}

		// Admin users can create organizations under any parent, others need permission
		if userClaims.RoleName != "admin" {
			// Check if user can manage the parent organization
			if !parentOrg.CanUserManage(oh.DB, uuid.MustParse(userClaims.UserID)) {
				c.JSON(http.StatusForbidden, gin.H{"error": "Cannot create organization under this parent"})
				return
			}
		}

		parentOrgID = &parentID
	} else {
		// If no parent specified, admin users can create under system organization
		if userClaims.RoleName == "admin" {
			var systemOrg database.Organization
			if err := oh.DB.Where("type = ?", "system").First(&systemOrg).Error; err == nil {
				parentOrgID = &systemOrg.ID
			}
		}
	}

	// Create organization
	createdByID, _ := uuid.Parse(userClaims.UserID)
	organization := database.Organization{
		Name:             req.Name,
		Type:             req.Type,
		ParentOrgID:      parentOrgID,
		CreatedBy:        &createdByID,
		MaxUsers:         req.MaxUsers,
		MaxStorageGB:     req.MaxStorageGB,
		MaxEmailAccounts: req.MaxEmailAccounts,
		IsActive:         true,
	}

	if err := oh.DB.Create(&organization).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create organization"})
		return
	}

	// Load relationships for response
	oh.DB.Preload("ParentOrg").Preload("Creator").First(&organization, organization.ID)

	c.JSON(http.StatusCreated, organization)
}

// GetOrganizations lists organizations based on user permissions
// GET /api/organizations
func (oh *OrganizationHandler) GetOrganizations(c *gin.Context) {
	// Get user claims
	userClaims, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var organizations []database.Organization
	query := oh.DB.Preload("ParentOrg").Preload("Creator").Preload("ChildOrgs")

	// Filter based on user role and organization
	if userClaims.RoleName == "admin" {
		// Admin can see all organizations
		query = query.Find(&organizations)
	} else if userClaims.RoleName == "distributor" {
		// Distributor can see their organization and child organizations
		userOrgID, _ := uuid.Parse(userClaims.OrganizationID)
		query = query.Where("id = ? OR parent_org_id = ?", userOrgID, userOrgID).Find(&organizations)
	} else if userClaims.RoleName == "dealer" {
		// Dealer can see their organization and child organizations
		userOrgID, _ := uuid.Parse(userClaims.OrganizationID)
		query = query.Where("id = ? OR parent_org_id = ?", userOrgID, userOrgID).Find(&organizations)
	} else {
		// Client and end users can only see their organization
		userOrgID, _ := uuid.Parse(userClaims.OrganizationID)
		query = query.Where("id = ?", userOrgID).Find(&organizations)
	}

	if err := query.Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch organizations"})
		return
	}

	c.JSON(http.StatusOK, organizations)
}

// GetOrganization gets a specific organization by ID
// GET /api/organizations/:id
func (oh *OrganizationHandler) GetOrganization(c *gin.Context) {
	orgID := c.Param("id")
	orgUUID, err := uuid.Parse(orgID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
		return
	}

	// Get user claims
	userClaims, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var organization database.Organization
	if err := oh.DB.Preload("ParentOrg").Preload("Creator").Preload("ChildOrgs").First(&organization, orgUUID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Organization not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch organization"})
		return
	}

	// Check if user can access this organization
	if userClaims.RoleName != "admin" && !organization.CanUserManage(oh.DB, uuid.MustParse(userClaims.UserID)) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied to this organization"})
		return
	}

	c.JSON(http.StatusOK, organization)
}

// UpdateOrganization updates an existing organization
// PUT /api/organizations/:id
func (oh *OrganizationHandler) UpdateOrganization(c *gin.Context) {
	orgID := c.Param("id")
	orgUUID, err := uuid.Parse(orgID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
		return
	}

	// Get user claims
	userClaims, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req struct {
		Name             string `json:"name"`
		MaxUsers         *int   `json:"max_users"`
		MaxStorageGB     *int   `json:"max_storage_gb"`
		MaxEmailAccounts *int   `json:"max_email_accounts"`
		IsActive         *bool  `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find the organization
	var organization database.Organization
	if err := oh.DB.First(&organization, orgUUID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Organization not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch organization"})
		return
	}

	// Check if user can manage this organization
	if userClaims.RoleName != "admin" && !organization.CanUserManage(oh.DB, uuid.MustParse(userClaims.UserID)) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Cannot modify this organization"})
		return
	}

	// Update fields
	if req.Name != "" {
		organization.Name = req.Name
	}
	if req.MaxUsers != nil {
		organization.MaxUsers = req.MaxUsers
	}
	if req.MaxStorageGB != nil {
		organization.MaxStorageGB = req.MaxStorageGB
	}
	if req.MaxEmailAccounts != nil {
		organization.MaxEmailAccounts = req.MaxEmailAccounts
	}
	if req.IsActive != nil {
		organization.IsActive = *req.IsActive
	}

	if err := oh.DB.Save(&organization).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update organization"})
		return
	}

	// Load relationships for response
	oh.DB.Preload("ParentOrg").Preload("Creator").First(&organization, organization.ID)

	c.JSON(http.StatusOK, organization)
}

// DeleteOrganization deactivates an organization (soft delete)
// DELETE /api/organizations/:id
func (oh *OrganizationHandler) DeleteOrganization(c *gin.Context) {
	orgID := c.Param("id")
	orgUUID, err := uuid.Parse(orgID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
		return
	}

	// Get user claims
	userClaims, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Only admin and distributors can delete organizations
	if userClaims.RoleLevel > 2 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to delete organizations"})
		return
	}

	// Find the organization
	var organization database.Organization
	if err := oh.DB.First(&organization, orgUUID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Organization not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch organization"})
		return
	}

	// Check if user can manage this organization
	if userClaims.RoleName != "admin" && !organization.CanUserManage(oh.DB, uuid.MustParse(userClaims.UserID)) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Cannot delete this organization"})
		return
	}

	// Soft delete by setting inactive
	organization.IsActive = false
	if err := oh.DB.Save(&organization).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete organization"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Organization deactivated successfully"})
}

// GetOrganizationStats gets statistics for an organization
// GET /api/organizations/:id/stats
func (oh *OrganizationHandler) GetOrganizationStats(c *gin.Context) {
	orgID := c.Param("id")
	orgUUID, err := uuid.Parse(orgID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
		return
	}

	// Get user claims
	userClaims, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Find the organization
	var organization database.Organization
	if err := oh.DB.First(&organization, orgUUID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Organization not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch organization"})
		return
	}

	// Check if user can access this organization
	if userClaims.RoleName != "admin" && !organization.CanUserManage(oh.DB, uuid.MustParse(userClaims.UserID)) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied to this organization"})
		return
	}

	// Calculate statistics
	var userCount int64
	var emailAccountCount int64
	var totalEmails int64

	// Count users in this organization
	oh.DB.Table("user_organizations").Where("organization_id = ?", orgUUID).Count(&userCount)

	// Count email accounts for users in this organization
	oh.DB.Table("email_accounts").
		Joins("JOIN user_organizations ON user_organizations.user_id = email_accounts.user_id").
		Where("user_organizations.organization_id = ?", orgUUID).
		Count(&emailAccountCount)

	// Count total emails for this organization
	oh.DB.Table("email_index").
		Joins("JOIN email_accounts ON email_accounts.id = email_index.account_id").
		Joins("JOIN user_organizations ON user_organizations.user_id = email_accounts.user_id").
		Where("user_organizations.organization_id = ?", orgUUID).
		Count(&totalEmails)

	// Calculate storage stats
	var totalStorage int64
	oh.DB.Table("email_index").
		Select("COALESCE(SUM(email_size), 0)").
		Joins("JOIN email_accounts ON email_accounts.id = email_index.account_id").
		Joins("JOIN user_organizations ON user_organizations.user_id = email_accounts.user_id").
		Where("user_organizations.organization_id = ?", orgUUID).
		Scan(&totalStorage)

	stats := gin.H{
		"organization_id":      orgUUID,
		"user_count":          userCount,
		"email_account_count": emailAccountCount,
		"total_emails":        totalEmails,
		"total_storage_bytes": totalStorage,
		"total_storage_mb":    totalStorage / (1024 * 1024),
		"limits": gin.H{
			"max_users":         organization.MaxUsers,
			"max_storage_gb":    organization.MaxStorageGB,
			"max_email_accounts": organization.MaxEmailAccounts,
		},
	}

	c.JSON(http.StatusOK, stats)
}

// GetOrganizationHierarchy gets the full hierarchy for an organization
// GET /api/organizations/:id/hierarchy
func (oh *OrganizationHandler) GetOrganizationHierarchy(c *gin.Context) {
	orgID := c.Param("id")
	orgUUID, err := uuid.Parse(orgID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
		return
	}

	// Get user claims
	userClaims, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Find the organization
	var organization database.Organization
	if err := oh.DB.First(&organization, orgUUID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Organization not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch organization"})
		return
	}

	// Check if user can access this organization
	if userClaims.RoleName != "admin" && !organization.CanUserManage(oh.DB, uuid.MustParse(userClaims.UserID)) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied to this organization"})
		return
	}

	// Get hierarchy path
	path, err := organization.GetHierarchyPath(oh.DB)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get hierarchy path"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"hierarchy": path,
		"depth":     len(path),
	})
}

// ===== ADMIN STATISTICS ENDPOINTS =====

// GetSystemStats gets comprehensive system statistics for admin dashboard
// GET /api/admin/system-stats
func (oh *OrganizationHandler) GetSystemStats(c *gin.Context) {
	// Get user claims
	userClaims, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Only admin users can access system stats
	if userClaims.RoleName != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	stats, err := oh.StatisticsService.GetSystemStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get system statistics", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": stats,
		"success": true,
	})
}

// GetTopOrganizations gets top organizations by usage for admin dashboard
// GET /api/admin/top-organizations
func (oh *OrganizationHandler) GetTopOrganizations(c *gin.Context) {
	// Get user claims
	userClaims, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Only admin users can access this endpoint
	if userClaims.RoleName != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	// Get limit parameter (default: 10)
	limitStr := c.DefaultQuery("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}
	if limit > 100 {
		limit = 100 // Cap at 100
	}

	topOrgs, err := oh.StatisticsService.GetTopOrganizations(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get top organizations", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": topOrgs,
		"success": true,
		"count": len(topOrgs),
	})
}

// ===== DISTRIBUTOR STATISTICS ENDPOINTS =====

// GetNetworkStats gets network statistics for distributor dashboard
// GET /api/distributor/network-stats
func (oh *OrganizationHandler) GetNetworkStats(c *gin.Context) {
	// Get user claims
	userClaims, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Only distributors and admins can access network stats
	if userClaims.RoleName != "distributor" && userClaims.RoleName != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Distributor access required"})
		return
	}

	// Get distributor organization ID
	distributorID, err := uuid.Parse(userClaims.OrganizationID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
		return
	}

	stats, err := oh.StatisticsService.GetNetworkStats(distributorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get network statistics", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": stats,
		"success": true,
	})
}

// GetDealerPerformance gets dealer performance metrics for distributor dashboard
// GET /api/distributor/dealer-performance
func (oh *OrganizationHandler) GetDealerPerformance(c *gin.Context) {
	// Get user claims
	userClaims, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Only distributors and admins can access dealer performance
	if userClaims.RoleName != "distributor" && userClaims.RoleName != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Distributor access required"})
		return
	}

	// Get distributor organization ID
	distributorID, err := uuid.Parse(userClaims.OrganizationID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
		return
	}

	// This data is included in network stats, so we'll get it from there
	stats, err := oh.StatisticsService.GetNetworkStats(distributorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get dealer performance", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"dealer_performance": stats.DealerPerformance,
			"client_distribution": stats.ClientDistribution,
		},
		"success": true,
	})
}

// ===== DEALER STATISTICS ENDPOINTS =====

// GetClientStats gets client statistics for dealer dashboard
// GET /api/dealer/client-stats
func (oh *OrganizationHandler) GetClientStats(c *gin.Context) {
	// Get user claims
	userClaims, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Only dealers and admins can access client stats
	if userClaims.RoleName != "dealer" && userClaims.RoleName != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Dealer access required"})
		return
	}

	// Get dealer organization ID
	dealerID, err := uuid.Parse(userClaims.OrganizationID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
		return
	}

	stats, err := oh.StatisticsService.GetClientStats(dealerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get client statistics", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": stats,
		"success": true,
	})
}

// GetUsageTrends gets usage trends for dealer dashboard
// GET /api/dealer/usage-trends
func (oh *OrganizationHandler) GetUsageTrends(c *gin.Context) {
	// Get user claims
	userClaims, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Only dealers and admins can access usage trends
	if userClaims.RoleName != "dealer" && userClaims.RoleName != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Dealer access required"})
		return
	}

	// Get dealer organization ID
	dealerID, err := uuid.Parse(userClaims.OrganizationID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
		return
	}

	// Get client stats which includes performance data
	stats, err := oh.StatisticsService.GetClientStats(dealerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get usage trends", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"client_performance": stats.ClientPerformance,
			"user_distribution": stats.UserDistribution,
			"recent_activity": stats.RecentClientActivity,
		},
		"success": true,
	})
}

// ===== CLIENT STATISTICS ENDPOINTS =====

// GetUserStats gets user statistics for client dashboard
// GET /api/client/user-stats
func (oh *OrganizationHandler) GetUserStats(c *gin.Context) {
	// Get user claims
	userClaims, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Only clients and admins can access user stats
	if userClaims.RoleName != "client" && userClaims.RoleName != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Client access required"})
		return
	}

	// Get client organization ID
	clientID, err := uuid.Parse(userClaims.OrganizationID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
		return
	}

	stats, err := oh.StatisticsService.GetUserStats(clientID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user statistics", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": stats,
		"success": true,
	})
}

// GetStorageUsage gets storage usage analytics for client dashboard
// GET /api/client/storage-usage
func (oh *OrganizationHandler) GetStorageUsage(c *gin.Context) {
	// Get user claims
	userClaims, err := middleware.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Only clients and admins can access storage usage
	if userClaims.RoleName != "client" && userClaims.RoleName != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Client access required"})
		return
	}

	// Get client organization ID
	clientID, err := uuid.Parse(userClaims.OrganizationID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
		return
	}

	// Get user stats which includes storage data
	stats, err := oh.StatisticsService.GetUserStats(clientID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get storage usage", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"total_storage": gin.H{
				"bytes": stats.UserStorageBytes,
				"gb": stats.UserStorageGB,
			},
			"quota_usage": stats.StorageQuotaUsage,
			"account_types": stats.AccountTypes,
			"user_performance": stats.UserPerformance,
		},
		"success": true,
	})
}