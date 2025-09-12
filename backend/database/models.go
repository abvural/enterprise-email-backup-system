package database

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Email        string    `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash string    `gorm:"not null" json:"-"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type EmailAccount struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID       uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	Email        string    `gorm:"not null" json:"email"`
	Provider     string    `gorm:"not null" json:"provider"` // 'gmail', 'exchange', 'office365', 'yahoo', 'outlook', 'custom_imap'
	
	// Legacy OAuth2 fields (for backward compatibility)
	AccessToken  string `json:"-"`
	RefreshToken string `json:"-"`
	
	// Exchange/EWS fields
	ServerURL string `json:"server_url,omitempty"`
	Domain    string `json:"domain,omitempty"`
	Username  string `json:"username,omitempty"`
	Password  string `json:"-"`
	
	// IMAP Configuration fields
	IMAPServer   string `json:"imap_server,omitempty"`
	IMAPPort     int    `json:"imap_port,omitempty"`
	IMAPSecurity string `json:"imap_security,omitempty"` // "SSL", "TLS", "STARTTLS", "NONE"
	
	// Authentication method
	AuthMethod   string `json:"auth_method,omitempty"` // "password", "oauth2", "xoauth2", "app_password", "ntlm"
	
	// Provider specific settings (JSON field for flexible configuration)
	ProviderSettings string `gorm:"type:jsonb" json:"provider_settings,omitempty"`
	
	// Common fields
	IsActive      bool       `gorm:"default:true" json:"is_active"`
	LastSyncDate  *time.Time `gorm:"type:timestamp" json:"last_sync_date,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`

	// Relationships
	User        User         `gorm:"foreignKey:UserID" json:"user,omitempty"`
	OAuthTokens []OAuthToken `gorm:"foreignKey:AccountID" json:"oauth_tokens,omitempty"`
}

type EmailIndex struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	AccountID   uuid.UUID `gorm:"type:uuid;not null" json:"account_id"`
	MessageID   string    `gorm:"not null" json:"message_id"`
	Subject     string    `json:"subject"`
	SenderEmail string    `json:"sender_email"`
	SenderName  string    `json:"sender_name"`
	Date        time.Time `json:"date"`
	Folder      string    `gorm:"default:'INBOX'" json:"folder"`
	MinioPath   string    `json:"minio_path"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Relationship
	Account EmailAccount `gorm:"foreignKey:AccountID" json:"account,omitempty"`
}

// BeforeCreate hook to set UUID
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

func (ea *EmailAccount) BeforeCreate(tx *gorm.DB) error {
	if ea.ID == uuid.Nil {
		ea.ID = uuid.New()
	}
	return nil
}

func (ei *EmailIndex) BeforeCreate(tx *gorm.DB) error {
	if ei.ID == uuid.Nil {
		ei.ID = uuid.New()
	}
	return nil
}

// OAuthToken stores OAuth2 refresh tokens and related data
type OAuthToken struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	AccountID    uuid.UUID `gorm:"type:uuid;not null" json:"account_id"`
	AccessToken  string    `gorm:"type:text" json:"-"`
	RefreshToken string    `gorm:"type:text" json:"-"`
	TokenType    string    `gorm:"default:'Bearer'" json:"token_type"`
	ExpiresIn    int       `json:"expires_in"`
	ExpiresAt    time.Time `json:"expires_at"`
	Scope        string    `json:"scope"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`

	// Relationship
	Account EmailAccount `gorm:"foreignKey:AccountID" json:"account,omitempty"`
}

// BeforeCreate hook to set UUID for OAuthToken
func (ot *OAuthToken) BeforeCreate(tx *gorm.DB) error {
	if ot.ID == uuid.Nil {
		ot.ID = uuid.New()
	}
	return nil
}

// IsExpired checks if the token is expired
func (ot *OAuthToken) IsExpired() bool {
	return time.Now().After(ot.ExpiresAt)
}

// IsExpiringSoon checks if the token will expire within the next 5 minutes
func (ot *OAuthToken) IsExpiringSoon() bool {
	return time.Now().Add(5 * time.Minute).After(ot.ExpiresAt)
}