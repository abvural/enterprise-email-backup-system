package services

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"strings"
	"time"

	"emailprojectv2/database"
	"emailprojectv2/models"
	"emailprojectv2/storage"

	"github.com/emersion/go-imap"
	"github.com/emersion/go-imap/client"
	"github.com/emersion/go-message/mail"
	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
)

type EmailData struct {
	MessageID   string                 `json:"message_id"`
	Subject     string                 `json:"subject"`
	From        []map[string]string    `json:"from"`
	To          []map[string]string    `json:"to"`
	Date        time.Time              `json:"date"`
	Body        string                 `json:"body"`
	Attachments []AttachmentData       `json:"attachments"`
	Headers     map[string][]string    `json:"headers"`
	Folder      string                 `json:"folder"`
}

type AttachmentData struct {
	Filename    string `json:"filename"`
	ContentType string `json:"content_type"`
	Size        int64  `json:"size"`
	MinioPath   string `json:"minio_path"`
}

type GmailServiceV1 struct {
	Host     string
	Port     string
	Username string
	Password string
}

func NewGmailServiceV1(host, port, username, password string) *GmailServiceV1 {
	return &GmailServiceV1{
		Host:     host,
		Port:     port,
		Username: username,
		Password: password,
	}
}

func (gs *GmailServiceV1) TestConnection() error {
	c, err := gs.connect()
	if err != nil {
		return fmt.Errorf("failed to connect to Gmail IMAP: %v", err)
	}
	defer c.Logout()

	log.Println("✅ Gmail IMAP bağlantısı başarılı!")
	return nil
}

func (gs *GmailServiceV1) connect() (*client.Client, error) {
	// Connect to server
	c, err := client.DialTLS(gs.Host+":"+gs.Port, nil)
	if err != nil {
		return nil, err
	}

	// Login
	if err := c.Login(gs.Username, gs.Password); err != nil {
		c.Logout()
		return nil, err
	}

	return c, nil
}

// SyncEmailsWithProgress syncs emails with progress tracking
func (gs *GmailServiceV1) SyncEmailsWithProgress(accountID uuid.UUID) error {
	// Start progress tracking
	progress := ProgressManager.StartSync(accountID)
	
	return gs.syncEmailsImpl(accountID, progress)
}

// SyncEmails syncs emails (legacy method)
func (gs *GmailServiceV1) SyncEmails(accountID uuid.UUID) error {
	return gs.syncEmailsImpl(accountID, nil)
}

// syncEmailsImpl performs the actual sync with optional progress tracking
func (gs *GmailServiceV1) syncEmailsImpl(accountID uuid.UUID, progress *models.SyncProgress) error {
	// Update progress: connecting
	if progress != nil {
		ProgressManager.UpdateProgress(accountID, "connecting", "Connecting to Gmail IMAP server...")
	}

	c, err := gs.connect()
	if err != nil {
		if progress != nil {
			ProgressManager.SetError(accountID, err)
		}
		return fmt.Errorf("failed to connect: %v", err)
	}
	defer c.Logout()

	// Get account details for incremental sync
	var account database.EmailAccount
	err = database.DB.Where("id = ?", accountID).First(&account).Error
	if err != nil {
		log.Printf("❌ Failed to get account details: %v", err)
		return fmt.Errorf("failed to get account details: %v", err)
	}

	// Determine sync type
	var sinceDate *time.Time
	isIncrementalSync := false
	if account.LastSyncDate != nil {
		// Incremental sync: only fetch emails newer than last sync
		sinceDate = account.LastSyncDate
		isIncrementalSync = true
		log.Printf("🔄 Starting Gmail incremental sync since: %s", sinceDate.Format(time.RFC3339))
	} else {
		// First sync: fetch recent emails (limited for MVP)
		log.Printf("🆕 Starting Gmail full sync (first time)")
	}

	// Update progress: authenticating
	if progress != nil {
		ProgressManager.UpdateProgress(accountID, "authenticating", "Authenticated with Gmail IMAP server")
	}

	folders := []string{"INBOX", "[Gmail]/Sent Mail", "[Gmail]/Drafts"}
	totalEmailsCount := 0
	
	// First pass: count total emails across folders
	if progress != nil {
		ProgressManager.UpdateProgress(accountID, "fetching", "Counting emails across folders...")
		for _, folder := range folders {
			mbox, err := c.Select(folder, false)
			if err != nil {
				continue
			}
			totalEmailsCount += int(mbox.Messages)
		}
		// Limit to 5 emails per folder for MVP (same as original logic)
		if totalEmailsCount > len(folders) * 5 {
			totalEmailsCount = len(folders) * 5
		}
		ProgressManager.SetTotalEmails(accountID, totalEmailsCount)
	}
	
	for _, folder := range folders {
		log.Printf("📧 Syncing folder: %s", folder)
		
		if progress != nil {
			if isIncrementalSync {
				ProgressManager.UpdateProgress(accountID, "processing", fmt.Sprintf("Syncing folder: %s (incremental)", folder))
			} else {
				ProgressManager.UpdateProgress(accountID, "processing", fmt.Sprintf("Syncing folder: %s", folder))
			}
		}
		
		err := gs.syncFolderWithProgressAndFilter(c, accountID, folder, progress, sinceDate, isIncrementalSync)
		if err != nil {
			log.Printf("⚠️ Error syncing folder %s: %v", folder, err)
			continue
		}
	}

	// Update last sync date after successful completion
	currentTime := time.Now()
	err = database.DB.Model(&account).Update("last_sync_date", currentTime).Error
	if err != nil {
		log.Printf("⚠️ Failed to update last sync date: %v", err)
		// Don't fail the entire sync for this
	} else {
		log.Printf("✅ Updated last sync date to: %s", currentTime.Format(time.RFC3339))
	}

	if isIncrementalSync {
		log.Println("✅ Gmail incremental email sync completed!")
	} else {
		log.Println("✅ Gmail full email sync completed!")
	}
	
	// Update progress: completed
	if progress != nil {
		ProgressManager.CompleteSync(accountID)
	}
	
	return nil
}

// syncFolderWithProgress syncs a folder with optional progress tracking
func (gs *GmailServiceV1) syncFolderWithProgress(c *client.Client, accountID uuid.UUID, folder string, progress *models.SyncProgress) error {
	return gs.syncFolderImpl(c, accountID, folder, progress, nil, false)
}

// syncFolderWithProgressAndFilter syncs a folder with optional progress tracking and date filtering
func (gs *GmailServiceV1) syncFolderWithProgressAndFilter(c *client.Client, accountID uuid.UUID, folder string, progress *models.SyncProgress, sinceDate *time.Time, isIncremental bool) error {
	return gs.syncFolderImpl(c, accountID, folder, progress, sinceDate, isIncremental)
}

// syncFolder syncs a folder (legacy method)
func (gs *GmailServiceV1) syncFolder(c *client.Client, accountID uuid.UUID, folder string) error {
	return gs.syncFolderImpl(c, accountID, folder, nil, nil, false)
}

// syncFolderImpl performs the actual folder sync with optional progress tracking and date filtering
func (gs *GmailServiceV1) syncFolderImpl(c *client.Client, accountID uuid.UUID, folder string, progress *models.SyncProgress, sinceDate *time.Time, isIncremental bool) error {
	// Select folder
	mbox, err := c.Select(folder, false)
	if err != nil {
		return fmt.Errorf("failed to select folder %s: %v", folder, err)
	}

	if mbox.Messages == 0 {
		log.Printf("📭 No messages found in folder %s", folder)
		return nil
	}

	// Create sequence set based on sync type
	seqset := new(imap.SeqSet)
	var searchCriteria *imap.SearchCriteria

	if isIncremental && sinceDate != nil {
		// Incremental sync: search for messages since last sync date
		log.Printf("🔄 Performing incremental sync for folder %s since %s", folder, sinceDate.Format("2006-01-02"))
		searchCriteria = &imap.SearchCriteria{
			Since: *sinceDate,
		}
		
		// Search for messages matching criteria
		uids, err := c.Search(searchCriteria)
		if err != nil {
			log.Printf("⚠️ IMAP search failed, falling back to recent messages: %v", err)
			// Fallback to recent messages
			from := uint32(1)
			to := mbox.Messages
			if mbox.Messages > 10 {
				from = mbox.Messages - 9 // Get last 10 for fallback
			}
			seqset.AddRange(from, to)
		} else {
			log.Printf("🔍 Found %d new messages in %s since last sync", len(uids), folder)
			if len(uids) == 0 {
				log.Printf("ℹ️ No new messages in folder %s", folder)
				return nil
			}
			seqset.AddNum(uids...)
		}
	} else {
		// Full sync: get recent messages (limit to 5 for MVP)
		log.Printf("🆕 Performing full sync for folder %s", folder)
		from := uint32(1)
		to := mbox.Messages
		if mbox.Messages > 5 {
			from = mbox.Messages - 4
		}
		seqset.AddRange(from, to)
		log.Printf("📧 Found %d messages in %s, processing %d-%d", mbox.Messages, folder, from, to)
	}

	// Fetch messages
	messages := make(chan *imap.Message, 10)
	done := make(chan error, 1)

	go func() {
		done <- c.Fetch(seqset, []imap.FetchItem{imap.FetchEnvelope, imap.FetchRFC822}, messages)
	}()

	ctx := context.Background()

	for msg := range messages {
		err := gs.processMessageWithProgress(ctx, msg, accountID, folder, progress)
		if err != nil {
			log.Printf("⚠️ Error processing message: %v", err)
			continue
		}
	}

	if err := <-done; err != nil {
		return fmt.Errorf("failed to fetch messages: %v", err)
	}

	return nil
}

// processMessageWithProgress processes a message with optional progress tracking
func (gs *GmailServiceV1) processMessageWithProgress(ctx context.Context, msg *imap.Message, accountID uuid.UUID, folder string, progress *models.SyncProgress) error {
	return gs.processMessageImpl(ctx, msg, accountID, folder, progress)
}

// processMessage processes a message (legacy method)
func (gs *GmailServiceV1) processMessage(ctx context.Context, msg *imap.Message, accountID uuid.UUID, folder string) error {
	return gs.processMessageImpl(ctx, msg, accountID, folder, nil)
}

// processMessageImpl performs the actual message processing with optional progress tracking
func (gs *GmailServiceV1) processMessageImpl(ctx context.Context, msg *imap.Message, accountID uuid.UUID, folder string, progress *models.SyncProgress) error {
	if msg.Envelope == nil {
		return fmt.Errorf("message envelope is nil")
	}

	// Check if message already exists
	var existingEmail database.EmailIndex
	messageID := msg.Envelope.MessageId
	
	// Update progress with current email subject
	if progress != nil {
		ProgressManager.UpdateProgress(accountID, "processing", fmt.Sprintf("Processing: %s", msg.Envelope.Subject))
	}
	
	err := database.DB.Where("account_id = ? AND message_id = ?", accountID, messageID).First(&existingEmail).Error
	if err == nil {
		// Message already exists, skip
		if progress != nil {
			ProgressManager.ProcessEmail(accountID, msg.Envelope.Subject, true)
		}
		return nil
	}

	// Create email data structure
	emailData := EmailData{
		MessageID: messageID,
		Subject:   msg.Envelope.Subject,
		Date:      msg.Envelope.Date,
		Folder:    folder,
		From:      convertIMAPAddresses(msg.Envelope.From),
		To:        convertIMAPAddresses(msg.Envelope.To),
		Headers:   make(map[string][]string),
	}

	// Get body from RFC822 - simplified for MVP
	for _, r := range msg.Body {
		body, err := io.ReadAll(r)
		if err != nil {
			log.Printf("Error reading body: %v", err)
			continue
		}
		
		// For MVP, just take the raw body
		emailData.Body = string(body)
		
		// Try to parse and get text part
		mr, err := mail.CreateReader(strings.NewReader(string(body)))
		if err == nil {
			for {
				p, err := mr.NextPart()
				if err == io.EOF {
					break
				} else if err != nil {
					break
				}

				if strings.HasPrefix(p.Header.Get("Content-Type"), "text/plain") {
					b, err := io.ReadAll(p.Body)
					if err == nil {
						emailData.Body = string(b)
					}
					break
				}
			}
		}
		break // Take first body for MVP
	}

	// Save to MinIO
	emailJSON, err := json.Marshal(emailData)
	if err != nil {
		return fmt.Errorf("failed to marshal email data: %v", err)
	}

	minioPath := fmt.Sprintf("emails/%s/%s.json", accountID.String(), messageID)
	
	_, err = storage.MinioClient.PutObject(ctx, "email-backups", minioPath, 
		strings.NewReader(string(emailJSON)), int64(len(emailJSON)), 
		minio.PutObjectOptions{ContentType: "application/json"})
	if err != nil {
		return fmt.Errorf("failed to save email to MinIO: %v", err)
	}

	// Calculate email sizes
	emailSize := int64(len(emailJSON))
	contentSize := int64(len(emailData.Subject) + len(emailData.Body))
	attachmentCount := len(emailData.Attachments)
	attachmentSize := int64(0)
	
	// Calculate attachment size
	for _, attachment := range emailData.Attachments {
		attachmentSize += attachment.Size
	}

	// Save index to PostgreSQL
	emailIndex := database.EmailIndex{
		ID:              uuid.New(),
		AccountID:       accountID,
		MessageID:       messageID,
		Subject:         emailData.Subject,
		Date:            emailData.Date,
		Folder:          folder,
		MinioPath:       minioPath,
		EmailSize:       emailSize,
		ContentSize:     contentSize,
		AttachmentCount: attachmentCount,
		AttachmentSize:  attachmentSize,
	}

	// Extract sender info
	if len(emailData.From) > 0 {
		emailIndex.SenderEmail = emailData.From[0]["email"]
		emailIndex.SenderName = emailData.From[0]["name"]
	}

	err = database.DB.Create(&emailIndex).Error
	if err != nil {
		// Update progress: failed email
		if progress != nil {
			ProgressManager.ProcessEmail(accountID, msg.Envelope.Subject, false)
		}
		return fmt.Errorf("failed to save email index: %v", err)
	}

	log.Printf("✅ Saved email: %s", emailData.Subject)
	
	// Update progress: successful email
	if progress != nil {
		ProgressManager.ProcessEmail(accountID, msg.Envelope.Subject, true)
	}
	
	return nil
}

func convertIMAPAddresses(addresses []*imap.Address) []map[string]string {
	result := make([]map[string]string, len(addresses))
	for i, addr := range addresses {
		email := addr.MailboxName + "@" + addr.HostName
		result[i] = map[string]string{
			"name":  addr.PersonalName,
			"email": email,
		}
	}
	return result
}