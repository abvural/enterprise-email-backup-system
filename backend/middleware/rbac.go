package middleware

import (
	"net/http"

	"emailprojectv2/auth"

	"github.com/gin-gonic/gin"
)

// RequireRole checks if the user has the required role level or higher
func RequireRole(requiredLevel int) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user claims from context
		claims, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			c.Abort()
			return
		}

		userClaims, ok := claims.(*auth.Claims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user claims"})
			c.Abort()
			return
		}

		// Check if user has required role level (lower number = higher privilege)
		if userClaims.RoleLevel > requiredLevel {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Insufficient permissions",
				"required_role_level": requiredLevel,
				"user_role_level": userClaims.RoleLevel,
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireSpecificRole checks if the user has exactly the specified role
func RequireSpecificRole(roleName string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user claims from context
		claims, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			c.Abort()
			return
		}

		userClaims, ok := claims.(*auth.Claims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user claims"})
			c.Abort()
			return
		}

		// Check if user has the specific role
		if userClaims.RoleName != roleName {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Access denied",
				"required_role": roleName,
				"user_role": userClaims.RoleName,
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequirePermission checks if the user has a specific permission
func RequirePermission(permission string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user claims from context
		claims, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			c.Abort()
			return
		}

		userClaims, ok := claims.(*auth.Claims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user claims"})
			c.Abort()
			return
		}

		// Admin has all permissions
		if userClaims.RoleName == "admin" {
			c.Next()
			return
		}

		// For other roles, we would need to check the permissions from the database
		// For now, using role-based access
		hasPermission := checkPermissionByRole(userClaims.RoleName, permission)
		if !hasPermission {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Permission denied",
				"required_permission": permission,
				"user_role": userClaims.RoleName,
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireOrgType checks if the user belongs to an organization of the specified type
func RequireOrgType(orgType string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user claims from context
		claims, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			c.Abort()
			return
		}

		userClaims, ok := claims.(*auth.Claims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user claims"})
			c.Abort()
			return
		}

		// Admin can access everything
		if userClaims.RoleName == "admin" {
			c.Next()
			return
		}

		// Check if user's organization type matches
		if userClaims.OrgType != orgType {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Organization type access denied",
				"required_org_type": orgType,
				"user_org_type": userClaims.OrgType,
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// CheckPermissionByRole is a helper function that maps roles to permissions
func checkPermissionByRole(roleName, permission string) bool {
	rolePermissions := map[string][]string{
		"admin": {
			"system.manage", "users.create", "users.read", "users.update", "users.delete",
			"organizations.create", "organizations.read", "organizations.update", "organizations.delete",
			"distributors.create", "distributors.read", "distributors.update", "distributors.delete",
			"dealers.create", "dealers.read", "dealers.update", "dealers.delete",
			"clients.create", "clients.read", "clients.update", "clients.delete",
			"emails.read", "emails.manage", "reports.view", "settings.manage",
		},
		"distributor": {
			"dealers.create", "dealers.read", "dealers.update", "dealers.delete",
			"clients.create", "clients.read", "clients.update", "clients.delete",
			"users.create", "users.read", "users.update", "users.delete",
			"organizations.read", "organizations.update", "reports.view",
		},
		"dealer": {
			"clients.create", "clients.read", "clients.update", "clients.delete",
			"users.create", "users.read", "users.update", "users.delete",
			"organizations.read", "organizations.update", "reports.view",
		},
		"client": {
			"users.create", "users.read", "users.update", "users.delete",
			"emails.read", "emails.manage", "organizations.read", "organizations.update", "reports.view",
		},
		"end_user": {
			"emails.read", "emails.manage", "accounts.create", "accounts.read", "accounts.update", "accounts.delete",
		},
	}

	permissions, exists := rolePermissions[roleName]
	if !exists {
		return false
	}

	for _, p := range permissions {
		if p == permission {
			return true
		}
	}

	return false
}

// GetUserFromContext extracts user claims from the Gin context
func GetUserFromContext(c *gin.Context) (*auth.Claims, error) {
	claims, exists := c.Get("user")
	if !exists {
		return nil, http.ErrNoCookie
	}

	userClaims, ok := claims.(*auth.Claims)
	if !ok {
		return nil, http.ErrNoCookie
	}

	return userClaims, nil
}

// IsAdmin checks if the current user is an admin
func IsAdmin(c *gin.Context) bool {
	claims, err := GetUserFromContext(c)
	if err != nil {
		return false
	}
	return claims.RoleName == "admin"
}

// IsDistributor checks if the current user is a distributor
func IsDistributor(c *gin.Context) bool {
	claims, err := GetUserFromContext(c)
	if err != nil {
		return false
	}
	return claims.RoleName == "distributor"
}

// IsDealer checks if the current user is a dealer
func IsDealer(c *gin.Context) bool {
	claims, err := GetUserFromContext(c)
	if err != nil {
		return false
	}
	return claims.RoleName == "dealer"
}

// IsClient checks if the current user is a client admin
func IsClient(c *gin.Context) bool {
	claims, err := GetUserFromContext(c)
	if err != nil {
		return false
	}
	return claims.RoleName == "client"
}

// IsEndUser checks if the current user is an end user
func IsEndUser(c *gin.Context) bool {
	claims, err := GetUserFromContext(c)
	if err != nil {
		return false
	}
	return claims.RoleName == "end_user"
}

// CanManageUsers checks if user can manage other users
func CanManageUsers(c *gin.Context) bool {
	claims, err := GetUserFromContext(c)
	if err != nil {
		return false
	}
	return claims.RoleLevel <= 4 // admin, distributor, dealer, client can manage users
}

// CanManageOrganizations checks if user can manage organizations
func CanManageOrganizations(c *gin.Context) bool {
	claims, err := GetUserFromContext(c)
	if err != nil {
		return false
	}
	return claims.RoleLevel <= 3 // admin, distributor, dealer can manage orgs
}

// GetUserOrganizationFilter returns the organization filter for the current user
func GetUserOrganizationFilter(c *gin.Context) (string, string) {
	claims, err := GetUserFromContext(c)
	if err != nil {
		return "", ""
	}

	// Admin can see everything
	if claims.RoleName == "admin" {
		return "", ""
	}

	return "organization_id", claims.OrganizationID
}