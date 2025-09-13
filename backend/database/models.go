package database

import (
	"fmt"
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
	
	// Storage size fields
	EmailSize       int64 `gorm:"default:0;not null" json:"email_size"`       // Total size (content + attachments)
	ContentSize     int64 `gorm:"default:0;not null" json:"content_size"`     // Content only size
	AttachmentCount int   `gorm:"default:0;not null" json:"attachment_count"` // Number of attachments
	AttachmentSize  int64 `gorm:"default:0;not null" json:"attachment_size"`  // Total attachment size
	
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

// AccountStorageStats stores storage statistics per email account
type AccountStorageStats struct {
	ID               uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	AccountID        uuid.UUID `gorm:"type:uuid;not null;uniqueIndex" json:"account_id"`
	TotalEmails      int       `gorm:"default:0;not null" json:"total_emails"`
	TotalSize        int64     `gorm:"default:0;not null" json:"total_size"`       // Total size in bytes
	ContentSize      int64     `gorm:"default:0;not null" json:"content_size"`     // Content only size in bytes
	AttachmentSize   int64     `gorm:"default:0;not null" json:"attachment_size"`  // Total attachments size in bytes
	AttachmentCount  int       `gorm:"default:0;not null" json:"attachment_count"` // Total number of attachments
	LastCalculatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"last_calculated_at"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`

	// Relationship
	Account EmailAccount `gorm:"foreignKey:AccountID" json:"account,omitempty"`
}

// FolderStorageStats stores storage statistics per folder within each account
type FolderStorageStats struct {
	ID               uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	AccountID        uuid.UUID `gorm:"type:uuid;not null" json:"account_id"`
	FolderName       string    `gorm:"not null;size:100" json:"folder_name"`
	TotalEmails      int       `gorm:"default:0;not null" json:"total_emails"`
	TotalSize        int64     `gorm:"default:0;not null" json:"total_size"`       // Total size in bytes
	ContentSize      int64     `gorm:"default:0;not null" json:"content_size"`     // Content only size in bytes
	AttachmentSize   int64     `gorm:"default:0;not null" json:"attachment_size"`  // Total attachments size in bytes
	AttachmentCount  int       `gorm:"default:0;not null" json:"attachment_count"` // Total number of attachments
	LastCalculatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"last_calculated_at"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`

	// Relationship
	Account EmailAccount `gorm:"foreignKey:AccountID" json:"account,omitempty"`
}

// BeforeCreate hook to set UUID for AccountStorageStats
func (ass *AccountStorageStats) BeforeCreate(tx *gorm.DB) error {
	if ass.ID == uuid.Nil {
		ass.ID = uuid.New()
	}
	return nil
}

// BeforeCreate hook to set UUID for FolderStorageStats
func (fss *FolderStorageStats) BeforeCreate(tx *gorm.DB) error {
	if fss.ID == uuid.Nil {
		fss.ID = uuid.New()
	}
	return nil
}

// GetTotalSizeFormatted returns total size in human readable format
func (ass *AccountStorageStats) GetTotalSizeFormatted() string {
	return formatBytes(ass.TotalSize)
}

// GetContentSizeFormatted returns content size in human readable format
func (ass *AccountStorageStats) GetContentSizeFormatted() string {
	return formatBytes(ass.ContentSize)
}

// GetAttachmentSizeFormatted returns attachment size in human readable format
func (ass *AccountStorageStats) GetAttachmentSizeFormatted() string {
	return formatBytes(ass.AttachmentSize)
}

// GetTotalSizeFormatted returns total size in human readable format
func (fss *FolderStorageStats) GetTotalSizeFormatted() string {
	return formatBytes(fss.TotalSize)
}

// formatBytes converts bytes to human readable format
func formatBytes(bytes int64) string {
	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}
	div, exp := int64(unit), 0
	for n := bytes / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(bytes)/float64(div), "KMGTPE"[exp])
}