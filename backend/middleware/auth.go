package middleware

import (
	"log"
	"net/http"
	"strings"

	"emailprojectv2/auth"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		log.Printf("🔒 AuthMiddleware: %s %s", c.Request.Method, c.Request.URL.Path)
		
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			log.Printf("❌ No Authorization header")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		log.Printf("🔑 Authorization header length: %d", len(authHeader))

		// Check Bearer token format
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			log.Printf("❌ Invalid token format: parts=%d, first=%s", len(tokenParts), tokenParts[0])
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		tokenString := tokenParts[1]
		log.Printf("🔍 Token string length: %d", len(tokenString))

		// Validate token
		claims, err := auth.ValidateToken(tokenString, jwtSecret)
		if err != nil {
			log.Printf("❌ Token validation error: %v", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		log.Printf("✅ Token validated for user: %s", claims.UserID)

		// Set user info in context
		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		
		c.Next()
	}
}