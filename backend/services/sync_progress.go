package services

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"emailprojectv2/database"
	"emailprojectv2/models"

	"github.com/google/uuid"
)

// SyncProgressManager manages sync progress for multiple accounts
type SyncProgressManager struct {
	mu        sync.RWMutex
	progresses map[uuid.UUID]*models.SyncProgress
	subscribers map[uuid.UUID][]chan string // SSE channels for each account
	subMu      sync.RWMutex
}

var ProgressManager = &SyncProgressManager{
	progresses:  make(map[uuid.UUID]*models.SyncProgress),
	subscribers: make(map[uuid.UUID][]chan string),
}

// StartSync initializes a new sync session
func (spm *SyncProgressManager) StartSync(accountID uuid.UUID) *models.SyncProgress {
	spm.mu.Lock()
	defer spm.mu.Unlock()

	progress := models.NewSyncProgress(accountID)
	spm.progresses[accountID] = progress

	log.Printf("🚀 Started sync for account %s", accountID.String())
	spm.broadcastUpdate(accountID, progress)

	return progress
}

// GetProgress returns the current progress for an account
func (spm *SyncProgressManager) GetProgress(accountID uuid.UUID) *models.SyncProgress {
	spm.mu.RLock()
	defer spm.mu.RUnlock()

	return spm.progresses[accountID]
}

// UpdateProgress updates the progress and notifies subscribers
func (spm *SyncProgressManager) UpdateProgress(accountID uuid.UUID, status, operation string) {
	spm.mu.Lock()
	defer spm.mu.Unlock()

	progress := spm.progresses[accountID]
	if progress == nil {
		log.Printf("⚠️  No progress found for account %s", accountID.String())
		return
	}

	progress.Update(status, operation)
	log.Printf("📊 Progress update for %s: %s - %s", accountID.String(), status, operation)
	spm.broadcastUpdate(accountID, progress)
}

// SetTotalEmails sets the total number of emails and notifies subscribers
func (spm *SyncProgressManager) SetTotalEmails(accountID uuid.UUID, total int) {
	spm.mu.Lock()
	defer spm.mu.Unlock()

	progress := spm.progresses[accountID]
	if progress == nil {
		return
	}

	progress.SetTotalEmails(total)
	log.Printf("📧 Set total emails for %s: %d", accountID.String(), total)
	spm.broadcastUpdate(accountID, progress)
}

// ProcessEmail records processing of an email
func (spm *SyncProgressManager) ProcessEmail(accountID uuid.UUID, subject string, success bool) {
	spm.mu.Lock()
	defer spm.mu.Unlock()

	progress := spm.progresses[accountID]
	if progress == nil {
		return
	}

	progress.ProcessEmail(subject, success)
	
	// Log every 10th email to avoid spam
	if progress.ProcessedEmails%10 == 0 || progress.ProcessedEmails == progress.TotalEmails {
		log.Printf("📧 Processed %d/%d emails for %s (Success: %d, Failed: %d)", 
			progress.ProcessedEmails, progress.TotalEmails, accountID.String(),
			progress.SuccessfulEmails, progress.FailedEmails)
	}
	
	spm.broadcastUpdate(accountID, progress)
}

// SetError sets an error and completes the sync
func (spm *SyncProgressManager) SetError(accountID uuid.UUID, err error) {
	spm.mu.Lock()
	defer spm.mu.Unlock()

	progress := spm.progresses[accountID]
	if progress == nil {
		return
	}

	progress.SetError(err)
	log.Printf("❌ Sync failed for %s: %s", accountID.String(), err.Error())
	spm.broadcastUpdate(accountID, progress)
	
	// Save to history
	spm.saveToHistory(progress)
	
	// Clean up after a delay
	go func() {
		time.Sleep(5 * time.Minute)
		spm.cleanup(accountID)
	}()
}

// CompleteSync marks the sync as completed
func (spm *SyncProgressManager) CompleteSync(accountID uuid.UUID) {
	spm.mu.Lock()
	defer spm.mu.Unlock()

	progress := spm.progresses[accountID]
	if progress == nil {
		return
	}

	progress.Complete()
	log.Printf("✅ Sync completed for %s: %d successful, %d failed, took %ds", 
		accountID.String(), progress.SuccessfulEmails, progress.FailedEmails, progress.TimeElapsed)
	spm.broadcastUpdate(accountID, progress)
	
	// Save to history
	spm.saveToHistory(progress)
	
	// Clean up after a delay
	go func() {
		time.Sleep(5 * time.Minute)
		spm.cleanup(accountID)
	}()
}

// Subscribe adds a new SSE channel for progress updates
func (spm *SyncProgressManager) Subscribe(accountID uuid.UUID) <-chan string {
	spm.subMu.Lock()
	defer spm.subMu.Unlock()

	ch := make(chan string, 10) // Buffered channel
	spm.subscribers[accountID] = append(spm.subscribers[accountID], ch)

	log.Printf("📡 New subscriber for account %s (total: %d)", 
		accountID.String(), len(spm.subscribers[accountID]))

	// Send current progress if available
	if progress := spm.GetProgress(accountID); progress != nil {
		select {
		case ch <- spm.formatSSEMessage(progress):
		default:
			// Channel is full, skip
		}
	}

	return ch
}

// Unsubscribe removes an SSE channel
func (spm *SyncProgressManager) Unsubscribe(accountID uuid.UUID, ch <-chan string) {
	spm.subMu.Lock()
	defer spm.subMu.Unlock()

	subscribers := spm.subscribers[accountID]
	for i, subscriber := range subscribers {
		if subscriber == ch {
			// Close the channel and remove it from slice
			close(subscriber)
			spm.subscribers[accountID] = append(subscribers[:i], subscribers[i+1:]...)
			log.Printf("📡 Unsubscribed from account %s (remaining: %d)", 
				accountID.String(), len(spm.subscribers[accountID]))
			break
		}
	}
}

// broadcastUpdate sends progress update to all subscribers
func (spm *SyncProgressManager) broadcastUpdate(accountID uuid.UUID, progress *models.SyncProgress) {
	spm.subMu.RLock()
	defer spm.subMu.RUnlock()

	message := spm.formatSSEMessage(progress)
	subscribers := spm.subscribers[accountID]

	for i := len(subscribers) - 1; i >= 0; i-- {
		select {
		case subscribers[i] <- message:
			// Message sent successfully
		default:
			// Channel is full or closed, remove it
			close(subscribers[i])
			spm.subscribers[accountID] = append(subscribers[:i], subscribers[i+1:]...)
		}
	}
}

// formatSSEMessage formats progress as SSE message
func (spm *SyncProgressManager) formatSSEMessage(progress *models.SyncProgress) string {
	data, err := json.Marshal(progress)
	if err != nil {
		log.Printf("❌ Failed to marshal progress: %v", err)
		return ""
	}

	return fmt.Sprintf("data: %s\n\n", string(data))
}

// saveToHistory saves the sync progress to database history
func (spm *SyncProgressManager) saveToHistory(progress *models.SyncProgress) {
	history := progress.ToHistory()
	if err := database.DB.Create(history).Error; err != nil {
		log.Printf("❌ Failed to save sync history: %v", err)
	} else {
		log.Printf("💾 Saved sync history for account %s", progress.AccountID.String())
	}
}

// cleanup removes progress data after sync completion
func (spm *SyncProgressManager) cleanup(accountID uuid.UUID) {
	spm.mu.Lock()
	defer spm.mu.Unlock()

	delete(spm.progresses, accountID)
	log.Printf("🧹 Cleaned up progress data for account %s", accountID.String())
}

// GetSyncHistory returns the sync history for an account
func (spm *SyncProgressManager) GetSyncHistory(accountID uuid.UUID, limit int) ([]models.SyncHistory, error) {
	var history []models.SyncHistory
	err := database.DB.Where("account_id = ?", accountID).
		Order("created_at DESC").
		Limit(limit).
		Find(&history).Error

	return history, err
}

// IsAccountSyncing checks if an account is currently syncing
func (spm *SyncProgressManager) IsAccountSyncing(accountID uuid.UUID) bool {
	spm.mu.RLock()
	defer spm.mu.RUnlock()

	progress := spm.progresses[accountID]
	return progress != nil && !progress.IsCompleted
}