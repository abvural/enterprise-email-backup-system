package database

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID           uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Email        string     `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash string     `gorm:"not null" json:"-"`
	
	// Organization and role relationships
	RoleID       *uuid.UUID `gorm:"type:uuid" json:"role_id"`
	PrimaryOrgID *uuid.UUID `gorm:"type:uuid" json:"primary_org_id"`
	
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`

	// Relationships
	Role         *Role                `gorm:"foreignKey:RoleID" json:"role,omitempty"`
	PrimaryOrg   *Organization        `gorm:"foreignKey:PrimaryOrgID" json:"primary_org,omitempty"`
	UserOrgs     []UserOrganization   `gorm:"foreignKey:UserID" json:"user_orgs,omitempty"`
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

// ===== ORGANIZATION MODELS =====

// Role represents user roles in the system
type Role struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Name        string    `gorm:"uniqueIndex;size:50;not null" json:"name"`
	DisplayName string    `gorm:"size:100;not null" json:"display_name"`
	Permissions string    `gorm:"type:jsonb;default:'[]'" json:"permissions"` // JSON array of permissions
	Description string    `gorm:"type:text" json:"description"`
	Level       int       `gorm:"not null" json:"level"` // 1=admin, 2=distributor, 3=dealer, 4=client, 5=end_user
	IsActive    bool      `gorm:"default:true" json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Organization represents the hierarchical organization structure
type Organization struct {
	ID               uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Name             string     `gorm:"size:255;not null" json:"name"`
	Type             string     `gorm:"size:50;not null;check:type IN ('system','distributor','dealer','client')" json:"type"`
	ParentOrgID      *uuid.UUID `gorm:"type:uuid" json:"parent_org_id"`
	CreatedBy        *uuid.UUID `gorm:"type:uuid" json:"created_by"`
	
	// Settings and limits
	Settings         string `gorm:"type:jsonb;default:'{}'" json:"settings"`
	MaxUsers         *int   `json:"max_users"`
	MaxStorageGB     *int   `json:"max_storage_gb"`
	MaxEmailAccounts *int   `json:"max_email_accounts"`
	
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relationships
	ParentOrg      *Organization      `gorm:"foreignKey:ParentOrgID" json:"parent_org,omitempty"`
	ChildOrgs      []Organization     `gorm:"foreignKey:ParentOrgID" json:"child_orgs,omitempty"`
	Creator        *User              `gorm:"foreignKey:CreatedBy" json:"creator,omitempty"`
	UserOrgs       []UserOrganization `gorm:"foreignKey:OrganizationID" json:"user_orgs,omitempty"`
}

// UserOrganization represents the many-to-many relationship between users and organizations
type UserOrganization struct {
	ID             uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID         uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	OrganizationID uuid.UUID `gorm:"type:uuid;not null" json:"organization_id"`
	RoleID         uuid.UUID `gorm:"type:uuid;not null" json:"role_id"`
	IsPrimary      bool      `gorm:"default:false" json:"is_primary"`
	JoinedAt       time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"joined_at"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`

	// Relationships
	User         User         `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Organization Organization `gorm:"foreignKey:OrganizationID" json:"organization,omitempty"`
	Role         Role         `gorm:"foreignKey:RoleID" json:"role,omitempty"`
}

// OrganizationSettings represents detailed settings for organizations
type OrganizationSettings struct {
	ID                  uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	OrgID               uuid.UUID `gorm:"type:uuid;not null;uniqueIndex" json:"org_id"`
	MaxUsers            *int      `json:"max_users"`
	MaxStorageGB        *int      `json:"max_storage_gb"`
	MaxEmailAccounts    *int      `json:"max_email_accounts"`
	Features            string    `gorm:"type:jsonb;default:'{\"email_backup\":true,\"storage_analytics\":true,\"user_management\":true,\"api_access\":false}'" json:"features"`
	EmailRetentionDays  *int      `json:"email_retention_days"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`

	// Relationships
	Organization Organization `gorm:"foreignKey:OrgID" json:"organization,omitempty"`
}

// SyncHistory represents email sync operation history
type SyncHistory struct {
	ID               uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	AccountID        uuid.UUID `gorm:"type:uuid;not null" json:"account_id"`
	SyncType         string    `gorm:"size:20;not null;check:sync_type IN ('full','incremental')" json:"sync_type"`
	StartedAt        time.Time `gorm:"not null" json:"started_at"`
	CompletedAt      *time.Time `json:"completed_at"`
	Status           string    `gorm:"size:20;not null;check:status IN ('running','completed','failed','cancelled')" json:"status"`
	EmailsProcessed  int       `gorm:"default:0" json:"emails_processed"`
	EmailsAdded      int       `gorm:"default:0" json:"emails_added"`
	EmailsUpdated    int       `gorm:"default:0" json:"emails_updated"`
	ErrorMessage     string    `gorm:"type:text" json:"error_message"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`

	// Relationships
	Account EmailAccount `gorm:"foreignKey:AccountID" json:"account,omitempty"`
}

// BeforeCreate hooks for organization models
func (r *Role) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}

func (o *Organization) BeforeCreate(tx *gorm.DB) error {
	if o.ID == uuid.Nil {
		o.ID = uuid.New()
	}
	return nil
}

func (uo *UserOrganization) BeforeCreate(tx *gorm.DB) error {
	if uo.ID == uuid.Nil {
		uo.ID = uuid.New()
	}
	return nil
}

func (os *OrganizationSettings) BeforeCreate(tx *gorm.DB) error {
	if os.ID == uuid.Nil {
		os.ID = uuid.New()
	}
	return nil
}

func (sh *SyncHistory) BeforeCreate(tx *gorm.DB) error {
	if sh.ID == uuid.Nil {
		sh.ID = uuid.New()
	}
	return nil
}

// Helper methods for Role
func (r *Role) IsAdmin() bool {
	return r.Name == "admin"
}

func (r *Role) IsDistributor() bool {
	return r.Name == "distributor"
}

func (r *Role) IsDealer() bool {
	return r.Name == "dealer"
}

func (r *Role) IsClient() bool {
	return r.Name == "client"
}

func (r *Role) IsEndUser() bool {
	return r.Name == "end_user"
}

// Helper methods for Organization
func (o *Organization) IsSystem() bool {
	return o.Type == "system"
}

func (o *Organization) IsDistributor() bool {
	return o.Type == "distributor"
}

func (o *Organization) IsDealer() bool {
	return o.Type == "dealer"
}

func (o *Organization) IsClient() bool {
	return o.Type == "client"
}

// Get organization hierarchy path
func (o *Organization) GetHierarchyPath(db *gorm.DB) ([]Organization, error) {
	var path []Organization
	current := *o
	
	for {
		path = append([]Organization{current}, path...) // Prepend to maintain order
		
		if current.ParentOrgID == nil {
			break
		}
		
		var parent Organization
		if err := db.First(&parent, *current.ParentOrgID).Error; err != nil {
			return nil, err
		}
		current = parent
	}
	
	return path, nil
}

// Check if user can manage this organization
func (o *Organization) CanUserManage(db *gorm.DB, userID uuid.UUID) bool {
	var userOrg UserOrganization
	var role Role
	
	// Get user's role in this organization or parent organization
	err := db.Joins("JOIN roles ON roles.id = user_organizations.role_id").
		Where("user_organizations.user_id = ? AND user_organizations.organization_id = ?", userID, o.ID).
		First(&userOrg).Error
	
	if err != nil {
		// Check parent organizations
		if o.ParentOrgID != nil {
			var parent Organization
			if db.First(&parent, *o.ParentOrgID).Error == nil {
				return parent.CanUserManage(db, userID)
			}
		}
		return false
	}
	
	if err := db.First(&role, userOrg.RoleID).Error; err != nil {
		return false
	}
	
	// Admin can manage everything, others can manage their level and below
	return role.Level <= 3 // admin, distributor, dealer can manage
}