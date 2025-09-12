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
	Provider     string    `gorm:"not null" json:"provider"` // 'gmail' or 'exchange'
	
	// Gmail OAuth2 fields
	AccessToken  string `json:"-"`
	RefreshToken string `json:"-"`
	
	// Exchange EWS fields
	ServerURL string `json:"server_url,omitempty"`
	Domain    string `json:"domain,omitempty"`
	Username  string `json:"username,omitempty"`
	Password  string `json:"-"`
	
	// Common fields
	IsActive      bool       `gorm:"default:true" json:"is_active"`
	LastSyncDate  *time.Time `gorm:"type:timestamp" json:"last_sync_date,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`

	// Relationship
	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
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