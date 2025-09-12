package models

import (
	"time"

	"github.com/google/uuid"
)

// SyncProgress represents real-time sync progress information
type SyncProgress struct {
	AccountID            uuid.UUID `json:"account_id"`
	Status               string    `json:"status"` // connecting, authenticating, fetching, processing, completed, failed
	TotalEmails          int       `json:"total_emails"`
	ProcessedEmails      int       `json:"processed_emails"`
	SuccessfulEmails     int       `json:"successful_emails"`
	FailedEmails         int       `json:"failed_emails"`
	CurrentEmailSubject  string    `json:"current_email_subject,omitempty"`
	CurrentOperation     string    `json:"current_operation"`
	TimeElapsed          int64     `json:"time_elapsed"` // seconds
	EstimatedTimeRemaining int64   `json:"estimated_time_remaining,omitempty"` // seconds
	ErrorMessage         string    `json:"error_message,omitempty"`
	LastUpdated          time.Time `json:"last_updated"`
	IsCompleted          bool      `json:"is_completed"`
	StartTime            time.Time `json:"start_time"`
	EndTime              *time.Time `json:"end_time,omitempty"`
}

// SyncHistory stores historical sync information in database
type SyncHistory struct {
	ID               uuid.UUID  `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	AccountID        uuid.UUID  `json:"account_id" gorm:"type:uuid;not null;index"`
	Status           string     `json:"status" gorm:"varchar(50);not null"` // completed, failed, cancelled
	TotalEmails      int        `json:"total_emails" gorm:"default:0"`
	SuccessfulEmails int        `json:"successful_emails" gorm:"default:0"`
	FailedEmails     int        `json:"failed_emails" gorm:"default:0"`
	TimeElapsed      int64      `json:"time_elapsed"` // seconds
	ErrorMessage     string     `json:"error_message,omitempty" gorm:"text"`
	StartTime        time.Time  `json:"start_time" gorm:"not null"`
	EndTime          *time.Time `json:"end_time"`
	CreatedAt        time.Time  `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt        time.Time  `json:"updated_at" gorm:"autoUpdateTime"`
}

// NewSyncProgress creates a new sync progress instance
func NewSyncProgress(accountID uuid.UUID) *SyncProgress {
	return &SyncProgress{
		AccountID:     accountID,
		Status:        "connecting",
		StartTime:     time.Now(),
		LastUpdated:   time.Now(),
		IsCompleted:   false,
	}
}

// Update updates the sync progress
func (sp *SyncProgress) Update(status string, currentOperation string) {
	sp.Status = status
	sp.CurrentOperation = currentOperation
	sp.LastUpdated = time.Now()
	sp.TimeElapsed = int64(time.Since(sp.StartTime).Seconds())
	
	// Calculate ETA if we have enough data
	if sp.ProcessedEmails > 0 && sp.TotalEmails > 0 {
		avgTimePerEmail := float64(sp.TimeElapsed) / float64(sp.ProcessedEmails)
		remainingEmails := sp.TotalEmails - sp.ProcessedEmails
		sp.EstimatedTimeRemaining = int64(float64(remainingEmails) * avgTimePerEmail)
	}
}

// SetTotalEmails sets the total number of emails to process
func (sp *SyncProgress) SetTotalEmails(total int) {
	sp.TotalEmails = total
	sp.LastUpdated = time.Now()
}

// ProcessEmail increments the processed email count and updates current email
func (sp *SyncProgress) ProcessEmail(subject string, success bool) {
	sp.ProcessedEmails++
	sp.CurrentEmailSubject = subject
	if success {
		sp.SuccessfulEmails++
	} else {
		sp.FailedEmails++
	}
	sp.LastUpdated = time.Now()
	sp.TimeElapsed = int64(time.Since(sp.StartTime).Seconds())
	
	// Update ETA
	if sp.TotalEmails > 0 && sp.ProcessedEmails > 0 {
		avgTimePerEmail := float64(sp.TimeElapsed) / float64(sp.ProcessedEmails)
		remainingEmails := sp.TotalEmails - sp.ProcessedEmails
		if remainingEmails > 0 {
			sp.EstimatedTimeRemaining = int64(float64(remainingEmails) * avgTimePerEmail)
		} else {
			sp.EstimatedTimeRemaining = 0
		}
	}
}

// SetError sets an error and updates status
func (sp *SyncProgress) SetError(err error) {
	sp.Status = "failed"
	sp.ErrorMessage = err.Error()
	sp.IsCompleted = true
	now := time.Now()
	sp.EndTime = &now
	sp.LastUpdated = now
	sp.TimeElapsed = int64(time.Since(sp.StartTime).Seconds())
}

// Complete marks the sync as completed successfully
func (sp *SyncProgress) Complete() {
	sp.Status = "completed"
	sp.IsCompleted = true
	now := time.Now()
	sp.EndTime = &now
	sp.LastUpdated = now
	sp.TimeElapsed = int64(time.Since(sp.StartTime).Seconds())
	sp.CurrentOperation = "Sync completed successfully"
	sp.EstimatedTimeRemaining = 0
}

// ToHistory converts sync progress to sync history for database storage
func (sp *SyncProgress) ToHistory() *SyncHistory {
	return &SyncHistory{
		ID:               uuid.New(),
		AccountID:        sp.AccountID,
		Status:           sp.Status,
		TotalEmails:      sp.TotalEmails,
		SuccessfulEmails: sp.SuccessfulEmails,
		FailedEmails:     sp.FailedEmails,
		TimeElapsed:      sp.TimeElapsed,
		ErrorMessage:     sp.ErrorMessage,
		StartTime:        sp.StartTime,
		EndTime:          sp.EndTime,
	}
}

// GetProgressPercentage returns the completion percentage (0-100)
func (sp *SyncProgress) GetProgressPercentage() int {
	if sp.TotalEmails == 0 {
		return 0
	}
	return int((float64(sp.ProcessedEmails) / float64(sp.TotalEmails)) * 100)
}