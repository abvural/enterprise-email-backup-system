package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"emailprojectv2/database"
	"emailprojectv2/models"
	"emailprojectv2/storage"

	msgraphsdk "github.com/microsoftgraph/msgraph-sdk-go"
	graphmodels "github.com/microsoftgraph/msgraph-sdk-go/models"
	"github.com/microsoftgraph/msgraph-sdk-go/users"
	"github.com/Azure/azure-sdk-for-go/sdk/azcore"
	"github.com/Azure/azure-sdk-for-go/sdk/azidentity"
	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"golang.org/x/oauth2"
	"gorm.io/gorm"
)

type Office365Service struct {
	TenantID     string
	ClientID     string
	ClientSecret string
	UserEmail    string
	AccountID    uuid.UUID
	client       *msgraphsdk.GraphServiceClient
	oauth2Config *oauth2.Config
}

// Office365TokenResponse represents the OAuth2 token response from Microsoft
type Office365TokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
	Scope        string `json:"scope"`
}

// Office365CustomCredential implements the azcore.TokenCredential interface
type Office365CustomCredential struct {
	accessToken  string
	refreshToken string
	expiresAt    time.Time
	service      *Office365Service
}

func NewOffice365Service(tenantID, clientID, clientSecret, userEmail string, accountID uuid.UUID) *Office365Service {
	oauth2Config := &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		Scopes:       []string{"https://graph.microsoft.com/Mail.Read", "https://graph.microsoft.com/Mail.ReadWrite", "offline_access"},
		Endpoint: oauth2.Endpoint{
			AuthURL:  fmt.Sprintf("https://login.microsoftonline.com/%s/oauth2/v2.0/authorize", tenantID),
			TokenURL: fmt.Sprintf("https://login.microsoftonline.com/%s/oauth2/v2.0/token", tenantID),
		},
		RedirectURL: "http://localhost:8080/api/oauth/office365/callback",
	}

	return &Office365Service{
		TenantID:     tenantID,
		ClientID:     clientID,
		ClientSecret: clientSecret,
		UserEmail:    userEmail,
		AccountID:    accountID,
		oauth2Config: oauth2Config,
	}
}

func NewOffice365ServiceWithToken(tenantID, clientID, clientSecret, userEmail string, accountID uuid.UUID) *Office365Service {
	service := NewOffice365Service(tenantID, clientID, clientSecret, userEmail, accountID)
	return service
}

// Implement azcore.TokenCredential interface
func (cred *Office365CustomCredential) GetToken(ctx context.Context, options azcore.TokenRequestOptions) (azcore.AccessToken, error) {
	// Check if token is expired
	if time.Now().After(cred.expiresAt.Add(-5 * time.Minute)) {
		// Refresh the token
		if err := cred.refreshAccessToken(ctx); err != nil {
			return azcore.AccessToken{}, fmt.Errorf("failed to refresh token: %v", err)
		}
	}

	return azcore.AccessToken{
		Token:     cred.accessToken,
		ExpiresOn: cred.expiresAt,
	}, nil
}

func (cred *Office365CustomCredential) refreshAccessToken(ctx context.Context) error {
	if cred.refreshToken == "" {
		return fmt.Errorf("no refresh token available")
	}

	token, err := cred.service.oauth2Config.TokenSource(ctx, &oauth2.Token{
		RefreshToken: cred.refreshToken,
	}).Token()
	if err != nil {
		return err
	}

	cred.accessToken = token.AccessToken
	cred.expiresAt = token.Expiry

	// Update token in database
	return cred.service.updateTokenInDB(token.AccessToken, cred.refreshToken, token.Expiry)
}

func (o *Office365Service) updateTokenInDB(accessToken, refreshToken string, expiresAt time.Time) error {
	var oauthToken database.OAuthToken
	err := database.DB.Where("account_id = ?", o.AccountID).First(&oauthToken).Error
	
	if err == gorm.ErrRecordNotFound {
		// Create new token record
		oauthToken = database.OAuthToken{
			AccountID:    o.AccountID,
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
			TokenType:    "Bearer",
			ExpiresAt:    expiresAt,
			Scope:        "https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite",
		}
		return database.DB.Create(&oauthToken).Error
	} else if err != nil {
		return err
	}

	// Update existing token
	oauthToken.AccessToken = accessToken
	if refreshToken != "" {
		oauthToken.RefreshToken = refreshToken
	}
	oauthToken.ExpiresAt = expiresAt
	
	return database.DB.Save(&oauthToken).Error
}

func (o *Office365Service) GetAuthURL(state string) string {
	return o.oauth2Config.AuthCodeURL(state, oauth2.AccessTypeOffline)
}

func (o *Office365Service) ExchangeCodeForToken(ctx context.Context, code string) (*oauth2.Token, error) {
	token, err := o.oauth2Config.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code for token: %v", err)
	}

	// Store token in database
	err = o.updateTokenInDB(token.AccessToken, token.RefreshToken, token.Expiry)
	if err != nil {
		log.Printf("Warning: failed to store token in database: %v", err)
	}

	return token, nil
}

func (o *Office365Service) TestConnection() error {
	if err := o.connect(); err != nil {
		return fmt.Errorf("failed to connect to Office 365: %v", err)
	}
	
	log.Println("✅ Office 365 Microsoft Graph API connection successful!")
	return nil
}

func (o *Office365Service) connect() error {
	// Get token from database
	var oauthToken database.OAuthToken
	err := database.DB.Where("account_id = ?", o.AccountID).First(&oauthToken).Error
	if err != nil {
		return fmt.Errorf("no OAuth token found for account %s: %v", o.AccountID, err)
	}

	// Create custom credential with stored token
	cred := &Office365CustomCredential{
		accessToken:  oauthToken.AccessToken,
		refreshToken: oauthToken.RefreshToken,
		expiresAt:    oauthToken.ExpiresAt,
		service:      o,
	}

	// Create Graph client with custom credential
	client, err := msgraphsdk.NewGraphServiceClientWithCredentials(
		cred,
		[]string{"https://graph.microsoft.com/.default"},
	)
	if err != nil {
		return fmt.Errorf("failed to create Graph client: %v", err)
	}

	o.client = client
	return nil
}

func (o *Office365Service) SyncEmailsWithProgress(accountID uuid.UUID) error {
	progress := ProgressManager.StartSync(accountID)
	return o.syncEmailsImpl(accountID, progress)
}

func (o *Office365Service) SyncEmails(accountID uuid.UUID) error {
	return o.syncEmailsImpl(accountID, nil)
}

func (o *Office365Service) syncEmailsImpl(accountID uuid.UUID, progress *models.SyncProgress) error {
	if progress != nil {
		progress.UpdateStatus("connecting", "Connecting to Office 365...", 0, 0, 0)
	}

	if err := o.connect(); err != nil {
		if progress != nil {
			progress.UpdateStatus("error", fmt.Sprintf("Connection failed: %v", err), 0, 0, 0)
		}
		return err
	}

	var lastSyncDate *time.Time
	err := database.DB.QueryRow(`
		SELECT last_sync_date FROM email_accounts 
		WHERE id = $1
	`, accountID).Scan(&lastSyncDate)
	if err != nil {
		log.Printf("Error fetching last sync date: %v", err)
	}

	if progress != nil {
		progress.UpdateStatus("fetching", "Fetching email list from Office 365...", 0, 0, 0)
	}

	// Build query parameters
	query := users.ItemMessagesRequestBuilderGetQueryParameters{
		Select:  []string{"id", "subject", "from", "toRecipients", "receivedDateTime", "bodyPreview", "hasAttachments"},
		Top:     int32Ptr(100),
		Orderby: []string{"receivedDateTime DESC"},
	}

	// Add date filter for incremental sync
	if lastSyncDate != nil {
		filterDate := lastSyncDate.Format(time.RFC3339)
		filterStr := fmt.Sprintf("receivedDateTime gt %s", filterDate)
		query.Filter = &filterStr
	}

	requestConfig := &users.ItemMessagesRequestBuilderGetRequestConfiguration{
		QueryParameters: &query,
	}

	messages, err := o.client.Users().ByUserId(o.UserEmail).Messages().Get(context.Background(), requestConfig)
	if err != nil {
		if progress != nil {
			progress.UpdateStatus("error", fmt.Sprintf("Failed to fetch messages: %v", err), 0, 0, 0)
		}
		return fmt.Errorf("failed to fetch messages: %v", err)
	}

	totalMessages := len(messages.GetValue())
	if progress != nil {
		progress.UpdateStatus("syncing", fmt.Sprintf("Syncing %d emails...", totalMessages), totalMessages, 0, 0)
	}

	processedCount := 0
	errorCount := 0

	for _, message := range messages.GetValue() {
		if err := o.processMessage(accountID, message); err != nil {
			log.Printf("Error processing message %s: %v", *message.GetId(), err)
			errorCount++
		} else {
			processedCount++
		}

		if progress != nil {
			progress.UpdateStatus("syncing", 
				fmt.Sprintf("Processing email %d of %d", processedCount+errorCount, totalMessages),
				totalMessages, processedCount, errorCount)
		}
	}

	// Update last sync date
	_, err = database.DB.Exec(`
		UPDATE email_accounts 
		SET last_sync_date = CURRENT_TIMESTAMP 
		WHERE id = $1
	`, accountID)
	if err != nil {
		log.Printf("Error updating last sync date: %v", err)
	}

	if progress != nil {
		status := "completed"
		message := fmt.Sprintf("Sync completed: %d emails processed", processedCount)
		if errorCount > 0 {
			message = fmt.Sprintf("Sync completed with errors: %d processed, %d errors", processedCount, errorCount)
		}
		progress.UpdateStatus(status, message, totalMessages, processedCount, errorCount)
	}

	return nil
}

func (o *Office365Service) processMessage(accountID uuid.UUID, message graphmodels.Messageable) error {
	messageID := *message.GetId()
	
	// Check if email already exists
	var exists bool
	err := database.DB.QueryRow(`
		SELECT EXISTS(SELECT 1 FROM email_index WHERE message_id = $1 AND account_id = $2)
	`, messageID, accountID).Scan(&exists)
	if err != nil {
		return err
	}
	if exists {
		log.Printf("Email %s already exists, skipping", messageID)
		return nil
	}

	// Get full message with body and attachments
	fullMessage, err := o.client.Users().ByUserId(o.UserEmail).Messages().ByMessageId(messageID).Get(context.Background(), nil)
	if err != nil {
		return fmt.Errorf("failed to get full message: %v", err)
	}

	// Prepare email data
	emailData := EmailData{
		MessageID: messageID,
		Subject:   *fullMessage.GetSubject(),
		Date:      *fullMessage.GetReceivedDateTime(),
		Folder:    "Inbox",
	}

	// Extract sender
	if fullMessage.GetFrom() != nil {
		emailData.From = []map[string]string{{
			"email": *fullMessage.GetFrom().GetEmailAddress().GetAddress(),
			"name":  *fullMessage.GetFrom().GetEmailAddress().GetName(),
		}}
	}

	// Extract recipients
	for _, recipient := range fullMessage.GetToRecipients() {
		emailData.To = append(emailData.To, map[string]string{
			"email": *recipient.GetEmailAddress().GetAddress(),
			"name":  *recipient.GetEmailAddress().GetName(),
		})
	}

	// Extract body
	if fullMessage.GetBody() != nil {
		emailData.Body = *fullMessage.GetBody().GetContent()
	}

	// Handle attachments if present
	if *fullMessage.GetHasAttachments() {
		attachments, err := o.client.Users().ByUserId(o.UserEmail).Messages().ByMessageId(messageID).Attachments().Get(context.Background(), nil)
		if err == nil {
			for _, attachment := range attachments.GetValue() {
				attachmentData := AttachmentData{
					Filename:    *attachment.GetName(),
					ContentType: *attachment.GetContentType(),
					Size:        int64(*attachment.GetSize()),
				}

				// Download and store attachment
				fullAttachment, err := o.client.Users().ByUserId(o.UserEmail).Messages().ByMessageId(messageID).Attachments().ByAttachmentId(*attachment.GetId()).Get(context.Background(), nil)
				if err == nil {
					fileAttachment, ok := fullAttachment.(graphmodels.FileAttachmentable)
					if ok && fileAttachment.GetContentBytes() != nil {
						attachmentPath := fmt.Sprintf("attachments/%s/%s", accountID.String(), attachmentData.Filename)
						_, err := storage.MinioClient.PutObject(
							context.Background(),
							"email-attachments",
							attachmentPath,
							strings.NewReader(string(fileAttachment.GetContentBytes())),
							int64(len(fileAttachment.GetContentBytes())),
							minio.PutObjectOptions{ContentType: attachmentData.ContentType},
						)
						if err == nil {
							attachmentData.MinioPath = attachmentPath
						}
					}
				}

				emailData.Attachments = append(emailData.Attachments, attachmentData)
			}
		}
	}

	// Store email in MinIO
	emailJSON, err := json.Marshal(emailData)
	if err != nil {
		return err
	}

	minioPath := fmt.Sprintf("emails/%s/%s.json", accountID.String(), messageID)
	_, err = storage.MinioClient.PutObject(
		context.Background(),
		"email-backups",
		minioPath,
		strings.NewReader(string(emailJSON)),
		int64(len(emailJSON)),
		minio.PutObjectOptions{ContentType: "application/json"},
	)
	if err != nil {
		return err
	}

	// Store in database
	senderEmail := ""
	if len(emailData.From) > 0 {
		senderEmail = emailData.From[0]["email"]
	}

	_, err = database.DB.Exec(`
		INSERT INTO email_index (id, account_id, message_id, subject, sender_email, date, folder, minio_path)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (message_id, account_id) DO NOTHING
	`, uuid.New(), accountID, messageID, emailData.Subject, senderEmail, emailData.Date, emailData.Folder, minioPath)

	return err
}

func int32Ptr(i int32) *int32 {
	return &i
}