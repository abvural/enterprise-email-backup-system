package auth

import (
	"errors"
	"log"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

func GenerateToken(userID, email, secret string) (string, error) {
	expirationTime := time.Now().Add(7 * 24 * time.Hour) // 7 days
	
	claims := &Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func ValidateToken(tokenString, secret string) (*Claims, error) {
	log.Printf("🔍 JWT Validation - Token length: %d", len(tokenString))
	log.Printf("🔍 JWT Validation - Secret length: %d", len(secret))
	
	claims := &Claims{}
	
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})

	if err != nil {
		log.Printf("❌ JWT Parse error: %v", err)
		return nil, err
	}

	if !token.Valid {
		log.Printf("❌ JWT Token not valid")
		return nil, errors.New("invalid token")
	}

	log.Printf("✅ JWT Token validated for user: %s", claims.UserID)
	return claims, nil
}