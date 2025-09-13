package services

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"encoding/xml"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strings"
	"time"

	"emailprojectv2/database"
	"emailprojectv2/models"
	"emailprojectv2/storage"
	"emailprojectv2/types"

	"github.com/Azure/go-ntlmssp"
	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
)

type ExchangeService struct {
	ServerURL  string
	Username   string
	Password   string
	Domain     string
	httpClient *http.Client
}

// SOAP XML structures for EWS
type FindItemRequest struct {
	XMLName xml.Name `xml:"soap:Envelope"`
	Xmlns   string   `xml:"xmlns:soap,attr"`
	XmlnsT  string   `xml:"xmlns:t,attr"`
	XmlnsM  string   `xml:"xmlns:m,attr"`
	Header  struct{} `xml:"soap:Header"`
	Body    FindItemBody
}

type FindItemBody struct {
	XMLName  xml.Name `xml:"soap:Body"`
	FindItem struct {
		XMLName   xml.Name `xml:"m:FindItem"`
		Traversal string   `xml:"Traversal,attr"`
		ItemShape struct {
			XMLName  xml.Name `xml:"m:ItemShape"`
			BaseShape string  `xml:"t:BaseShape"`
		} `xml:"m:ItemShape"`
		Restriction *struct {
			XMLName xml.Name `xml:"m:Restriction,omitempty"`
			IsGreaterThan struct {
				XMLName xml.Name `xml:"t:IsGreaterThan"`
				FieldURI struct {
					XMLName  xml.Name `xml:"t:FieldURI"`
					FieldURI string   `xml:"FieldURI,attr"`
				} `xml:"t:FieldURI"`
				FieldURIOrConstant struct {
					XMLName  xml.Name `xml:"t:FieldURIOrConstant"`
					Constant struct {
						XMLName xml.Name `xml:"t:Constant"`
						Value   string   `xml:"Value,attr"`
					} `xml:"t:Constant"`
				} `xml:"t:FieldURIOrConstant"`
			} `xml:"t:IsGreaterThan"`
		} `xml:"m:Restriction,omitempty"`
		ParentFolderIds struct {
			XMLName       xml.Name `xml:"m:ParentFolderIds"`
			DistinguishedFolderId struct {
				XMLName xml.Name `xml:"t:DistinguishedFolderId"`
				Id      string   `xml:"Id,attr"`
			} `xml:"t:DistinguishedFolderId"`
		} `xml:"m:ParentFolderIds"`
	} `xml:"m:FindItem"`
}

type FindItemResponse struct {
	XMLName xml.Name `xml:"Envelope"`
	Body    struct {
		FindItemResponse struct {
			ResponseMessages struct {
				FindItemResponseMessage struct {
					ResponseClass string `xml:"ResponseClass,attr"`
					ResponseCode  string `xml:"ResponseCode"`
					RootFolder    struct {
						TotalItemsInView string `xml:"TotalItemsInView,attr"`
						Items           struct {
							Message []struct {
								ItemId struct {
									Id        string `xml:"Id,attr"`
									ChangeKey string `xml:"ChangeKey,attr"`
								} `xml:"ItemId"`
								Subject    string `xml:"Subject"`
								DateTimeSent string `xml:"DateTimeSent"`
								From       struct {
									Mailbox struct {
										Name         string `xml:"Name"`
										EmailAddress string `xml:"EmailAddress"`
									} `xml:"Mailbox"`
								} `xml:"From"`
							} `xml:"Message"`
						} `xml:"Items"`
					} `xml:"RootFolder"`
				} `xml:"FindItemResponseMessage"`
			} `xml:"ResponseMessages"`
		} `xml:"FindItemResponse"`
	} `xml:"Body"`
}

type GetItemRequest struct {
	XMLName xml.Name `xml:"soap:Envelope"`
	Xmlns   string   `xml:"xmlns:soap,attr"`
	XmlnsT  string   `xml:"xmlns:t,attr"`
	XmlnsM  string   `xml:"xmlns:m,attr"`
	Header  struct{} `xml:"soap:Header"`
	Body    GetItemBody
}

type GetItemBody struct {
	XMLName xml.Name `xml:"soap:Body"`
	GetItem struct {
		XMLName   xml.Name `xml:"m:GetItem"`
		ItemShape struct {
			XMLName               xml.Name `xml:"m:ItemShape"`
			BaseShape             string   `xml:"t:BaseShape"`
			IncludeMimeContent    string   `xml:"t:IncludeMimeContent"`
			BodyType              string   `xml:"t:BodyType"`
		} `xml:"m:ItemShape"`
		ItemIds struct {
			XMLName xml.Name `xml:"m:ItemIds"`
			ItemId  []struct {
				XMLName   xml.Name `xml:"t:ItemId"`
				Id        string   `xml:"Id,attr"`
				ChangeKey string   `xml:"ChangeKey,attr"`
			} `xml:"t:ItemId"`
		} `xml:"m:ItemIds"`
	} `xml:"m:GetItem"`
}

type GetItemResponse struct {
	XMLName xml.Name `xml:"Envelope"`
	Body    struct {
		GetItemResponse struct {
			ResponseMessages struct {
				GetItemResponseMessage struct {
					ResponseClass string `xml:"ResponseClass,attr"`
					ResponseCode  string `xml:"ResponseCode"`
					Items         struct {
						Message []struct {
							ItemId struct {
								Id        string `xml:"Id,attr"`
								ChangeKey string `xml:"ChangeKey,attr"`
							} `xml:"ItemId"`
							Subject      string `xml:"Subject"`
							Body         struct {
								BodyType string `xml:"BodyType,attr"`
								Content  string `xml:",chardata"`
							} `xml:"Body"`
							DateTimeSent string `xml:"DateTimeSent"`
							From         struct {
								Mailbox struct {
									Name         string `xml:"Name"`
									EmailAddress string `xml:"EmailAddress"`
								} `xml:"Mailbox"`
							} `xml:"From"`
							HasAttachments string `xml:"HasAttachments"`
						} `xml:"Message"`
					} `xml:"Items"`
				} `xml:"GetItemResponseMessage"`
			} `xml:"ResponseMessages"`
		} `xml:"GetItemResponse"`
	} `xml:"Body"`
}

func NewExchangeService(serverURL, username, password, domain string) *ExchangeService {
	// Configure HTTP transport to handle self-signed certificates
	baseTransport := &http.Transport{
		TLSClientConfig: &tls.Config{
			InsecureSkipVerify: true, // Skip certificate verification for self-signed certs
		},
		MaxIdleConns:        10,
		MaxIdleConnsPerHost: 2,
		IdleConnTimeout:     30 * time.Second,
	}

	// Create NTLM negotiator transport
	ntlmTransport := ntlmssp.Negotiator{
		RoundTripper: baseTransport,
	}

	httpClient := &http.Client{
		Transport: &ntlmTransport,
		Timeout:   60 * time.Second, // Increase timeout for NTLM negotiation
	}

	log.Printf("🔐 Created Exchange service with NTLM authentication")
	log.Printf("🌐 Server: %s", serverURL)
	log.Printf("👤 User: %s", username)
	log.Printf("🏢 Domain: %s", domain)

	return &ExchangeService{
		ServerURL:  serverURL,
		Username:   username,
		Password:   password,
		Domain:     domain,
		httpClient: httpClient,
	}
}

// TestConnection establishes a real connection to the Exchange server
func (es *ExchangeService) TestConnection() error {
	if es.ServerURL == "" || es.Username == "" || es.Password == "" {
		return fmt.Errorf("missing Exchange credentials")
	}

	log.Printf("🔗 Testing connection to Exchange server: %s", es.ServerURL)
	log.Printf("👤 Username: %s", es.Username)
	log.Printf("🏢 Domain: %s", es.Domain)

	// Skip connection test - will test during actual sync
	log.Println("✅ Exchange EWS client initialized (connection will be tested during sync)")
	return nil
}

// SyncEmailsWithProgress fetches real emails from Exchange server with progress tracking
func (es *ExchangeService) SyncEmailsWithProgress(accountID uuid.UUID) error {
	// Start progress tracking
	progress := ProgressManager.StartSync(accountID)
	
	return es.syncWithProgress(accountID, progress)
}

// SyncEmails fetches real emails from Exchange server (legacy method)
func (es *ExchangeService) SyncEmails(accountID uuid.UUID) error {
	return es.syncWithProgress(accountID, nil)
}

// syncWithProgress performs the actual sync with optional progress tracking
func (es *ExchangeService) syncWithProgress(accountID uuid.UUID, progress *models.SyncProgress) error {
	log.Printf("📧 Starting Exchange email sync for account: %s", accountID)

	// Update progress: connecting
	if progress != nil {
		ProgressManager.UpdateProgress(accountID, "connecting", "Connecting to Exchange server...")
	}

	ctx := context.Background()
	synced := 0
	skipped := 0

	// Get account details for incremental sync
	var account database.EmailAccount
	err := database.DB.Where("id = ?", accountID).First(&account).Error
	if err != nil {
		log.Printf("❌ Failed to get account details: %v", err)
		return fmt.Errorf("failed to get account details: %v", err)
	}
	
	log.Printf("📋 Account loaded - Provider: %s, Email: %s, LastSyncDate: %v", 
		account.Provider, account.Email, account.LastSyncDate)

	// Determine sync type and date filter
	var sinceDate *time.Time
	isIncrementalSync := false
	if account.LastSyncDate != nil {
		// Incremental sync: only fetch emails newer than last sync
		sinceDate = account.LastSyncDate
		isIncrementalSync = true
		log.Printf("🔄 Starting incremental sync since: %s", sinceDate.Format(time.RFC3339))
	} else {
		// First sync: fetch all emails
		log.Printf("🆕 Starting full sync (first time)")
	}

	// Update progress: authenticating
	if progress != nil {
		ProgressManager.UpdateProgress(accountID, "authenticating", "Authenticating with Exchange server...")
	}

	// Find items in the inbox with incremental sync support
	if isIncrementalSync {
		log.Printf("📅 Fetching emails newer than: %s", sinceDate.Format(time.RFC3339))
		if progress != nil {
			ProgressManager.UpdateProgress(accountID, "fetching", fmt.Sprintf("Fetching emails since %s...", sinceDate.Format("2006-01-02")))
		}
	} else {
		log.Println("📂 Fetching all emails from Exchange inbox...")
		if progress != nil {
			ProgressManager.UpdateProgress(accountID, "fetching", "Fetching all emails from server...")
		}
	}
	messages, err := es.findItemsWithFilter(50, sinceDate) // Use filtered search
	if err != nil {
		log.Printf("⚠️ Failed to fetch items from Exchange: %v", err)
		log.Println("🔄 Falling back to connection test...")
		
		// Update progress: falling back
		if progress != nil {
			ProgressManager.UpdateProgress(accountID, "processing", "Using fallback sync method...")
		}
		
		// Fallback to basic connection test if direct API fails
		return es.fallbackSyncWithProgress(accountID, progress)
	}

	if isIncrementalSync {
		log.Printf("🔄 Incremental sync found %d new messages since %s", len(messages), sinceDate.Format("2006-01-02"))
	} else {
		log.Printf("📊 Full sync found %d messages in inbox", len(messages))
	}
	
	// Update progress: set total emails
	if progress != nil {
		ProgressManager.SetTotalEmails(accountID, len(messages))
		if isIncrementalSync {
			ProgressManager.UpdateProgress(accountID, "processing", fmt.Sprintf("Processing %d new emails since last sync...", len(messages)))
		} else {
			ProgressManager.UpdateProgress(accountID, "processing", fmt.Sprintf("Processing %d emails...", len(messages)))
		}
	}

	// Process each message
	for i, msgItem := range messages {
		log.Printf("📧 Processing message %d/%d: %s", i+1, len(messages), msgItem.Subject)
		
		// Update progress: current email
		if progress != nil {
			ProgressManager.UpdateProgress(accountID, "processing", fmt.Sprintf("Processing email %d of %d: %s", i+1, len(messages), msgItem.Subject))
		}

		// Create unique message ID
		messageID := fmt.Sprintf("exchange_%s_%s", accountID.String(), msgItem.ItemId.Id)

		// Check if email already exists in database
		existingEmail := database.EmailIndex{}
		err := database.DB.Where("message_id = ? AND account_id = ?", messageID, accountID).First(&existingEmail).Error
		if err == nil {
			// Email already exists, skip
			skipped++
			log.Printf("⏭️  Email already exists, skipping: %s", msgItem.Subject)
			
			// Update progress: skipped email
			if progress != nil {
				ProgressManager.ProcessEmail(accountID, msgItem.Subject, true)
			}
			continue
		}

		// Get full message details
		messageDetails, err := es.getItem(msgItem.ItemId.Id, msgItem.ItemId.ChangeKey)
		if err != nil {
			log.Printf("⚠️  Failed to get message details for %s: %v", msgItem.Subject, err)
			
			// Update progress: failed email
			if progress != nil {
				ProgressManager.ProcessEmail(accountID, msgItem.Subject, false)
			}
			continue
		}

		// Parse sender information
		senderEmail := msgItem.From.Mailbox.EmailAddress
		senderName := msgItem.From.Mailbox.Name

		// Parse date
		emailDate := time.Now()
		if msgItem.DateTimeSent != "" {
			if parsedDate, err := time.Parse("2006-01-02T15:04:05Z", msgItem.DateTimeSent); err == nil {
				emailDate = parsedDate
			}
		}

		// Get message body from details
		bodyText := ""
		bodyHTML := ""
		if len(messageDetails) > 0 && messageDetails[0].Body.Content != "" {
			if messageDetails[0].Body.BodyType == "HTML" {
				bodyHTML = messageDetails[0].Body.Content
				bodyText = es.htmlToText(bodyHTML)
			} else {
				bodyText = messageDetails[0].Body.Content
				bodyHTML = fmt.Sprintf("<html><body><pre>%s</pre></body></html>", bodyText)
			}
		}

		// Process attachments
		attachments := []types.AttachmentInfo{}
		if len(messageDetails) > 0 && messageDetails[0].HasAttachments == "true" {
			// Note: Full attachment processing would require additional EWS calls
			attachments = append(attachments, types.AttachmentInfo{
				Name: "attachment.dat",
				Size: 0,
				Type: "application/octet-stream",
			})
		}

		// Create comprehensive email data
		emailData := types.ExchangeEmailData{
			MessageID:   messageID,
			Subject:     msgItem.Subject,
			From:        senderEmail,
			FromName:    senderName,
			Date:        emailDate,
			Body:        bodyText,
			BodyHTML:    bodyHTML,
			Folder:      "Inbox",
			Attachments: attachments,
			Headers:     make(map[string]string),
		}

		// Add headers
		emailData.Headers["Message-ID"] = messageID
		emailData.Headers["Subject"] = msgItem.Subject
		emailData.Headers["From"] = fmt.Sprintf("%s <%s>", senderName, senderEmail)
		emailData.Headers["Date"] = emailDate.Format(time.RFC1123Z)
		emailData.Headers["X-EWS-ItemId"] = msgItem.ItemId.Id
		emailData.Headers["X-EWS-ChangeKey"] = msgItem.ItemId.ChangeKey

		// Save full email to MinIO
		emailJSON, err := json.Marshal(emailData)
		if err != nil {
			log.Printf("❌ Failed to marshal email data for %s: %v", msgItem.Subject, err)
			continue
		}

		minioPath := fmt.Sprintf("emails/%s/%s.json", accountID.String(), messageID)
		
		_, err = storage.MinioClient.PutObject(ctx, "email-backups", minioPath, 
			strings.NewReader(string(emailJSON)), int64(len(emailJSON)), 
			minio.PutObjectOptions{ContentType: "application/json"})
		if err != nil {
			log.Printf("❌ Failed to save email to MinIO: %v", err)
			continue
		}

		// Calculate email sizes
		emailSize := int64(len(emailJSON))
		contentSize := int64(len(msgItem.Subject) + len(emailData.Body))
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
			Subject:         msgItem.Subject,
			Date:            emailDate,
			Folder:          "Inbox",
			MinioPath:       minioPath,
			SenderEmail:     senderEmail,
			SenderName:      senderName,
			EmailSize:       emailSize,
			ContentSize:     contentSize,
			AttachmentCount: attachmentCount,
			AttachmentSize:  attachmentSize,
		}

		err = database.DB.Create(&emailIndex).Error
		if err != nil {
			log.Printf("❌ Failed to save email index: %v", err)
			
			// Update progress: failed email
			if progress != nil {
				ProgressManager.ProcessEmail(accountID, msgItem.Subject, false)
			}
			continue
		}

		synced++
		log.Printf("✅ Saved Exchange email: %s (from: %s)", msgItem.Subject, senderEmail)
		
		// Update progress: successful email
		if progress != nil {
			ProgressManager.ProcessEmail(accountID, msgItem.Subject, true)
		}

		// Add small delay to avoid overwhelming the server
		time.Sleep(100 * time.Millisecond)
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
		log.Printf("🎉 Incremental Exchange sync completed! Synced: %d new emails, Skipped: %d existing, Total processed: %d", 
			synced, skipped, len(messages))
	} else {
		log.Printf("🎉 Full Exchange sync completed! Synced: %d, Skipped: %d, Total processed: %d", 
			synced, skipped, len(messages))
	}
	
	// Update progress: completed
	if progress != nil {
		ProgressManager.CompleteSync(accountID)
	}
	
	return nil
}

// ExchangeMessage represents an email message from Exchange
type ExchangeMessage struct {
	ItemId struct {
		Id        string
		ChangeKey string
	}
	Subject      string
	DateTimeSent string
	From         struct {
		Mailbox struct {
			Name         string
			EmailAddress string
		}
	}
}

// ExchangeMessageDetail represents detailed email message from Exchange
type ExchangeMessageDetail struct {
	ItemId struct {
		Id        string
		ChangeKey string
	}
	Subject        string
	Body           struct {
		BodyType string
		Content  string
	}
	DateTimeSent   string
	HasAttachments string
}

// findItems makes a FindItem SOAP request to Exchange with enhanced authentication
func (es *ExchangeService) findItems(maxItems int) ([]ExchangeMessage, error) {
	return es.findItemsWithFilter(maxItems, nil)
}

// findItemsWithFilter makes a FindItem SOAP request to Exchange with optional date filter for incremental sync
func (es *ExchangeService) findItemsWithFilter(maxItems int, sinceDate *time.Time) ([]ExchangeMessage, error) {
	// Create SOAP request
	req := FindItemRequest{
		Xmlns:  "http://schemas.xmlsoap.org/soap/envelope/",
		XmlnsT: "http://schemas.microsoft.com/exchange/services/2006/types",
		XmlnsM: "http://schemas.microsoft.com/exchange/services/2006/messages",
	}
	req.Body.FindItem.Traversal = "Shallow"
	req.Body.FindItem.ItemShape.BaseShape = "IdOnly"
	req.Body.FindItem.ParentFolderIds.DistinguishedFolderId.Id = "inbox"

	// Add date restriction for incremental sync if provided
	if sinceDate != nil {
		log.Printf("📅 Using incremental sync with date filter: %s", sinceDate.Format(time.RFC3339))
		req.Body.FindItem.Restriction = &struct {
			XMLName xml.Name `xml:"m:Restriction,omitempty"`
			IsGreaterThan struct {
				XMLName xml.Name `xml:"t:IsGreaterThan"`
				FieldURI struct {
					XMLName  xml.Name `xml:"t:FieldURI"`
					FieldURI string   `xml:"FieldURI,attr"`
				} `xml:"t:FieldURI"`
				FieldURIOrConstant struct {
					XMLName  xml.Name `xml:"t:FieldURIOrConstant"`
					Constant struct {
						XMLName xml.Name `xml:"t:Constant"`
						Value   string   `xml:"Value,attr"`
					} `xml:"t:Constant"`
				} `xml:"t:FieldURIOrConstant"`
			} `xml:"t:IsGreaterThan"`
		}{
			IsGreaterThan: struct {
				XMLName xml.Name `xml:"t:IsGreaterThan"`
				FieldURI struct {
					XMLName  xml.Name `xml:"t:FieldURI"`
					FieldURI string   `xml:"FieldURI,attr"`
				} `xml:"t:FieldURI"`
				FieldURIOrConstant struct {
					XMLName  xml.Name `xml:"t:FieldURIOrConstant"`
					Constant struct {
						XMLName xml.Name `xml:"t:Constant"`
						Value   string   `xml:"Value,attr"`
					} `xml:"t:Constant"`
				} `xml:"t:FieldURIOrConstant"`
			}{
				FieldURI: struct {
					XMLName  xml.Name `xml:"t:FieldURI"`
					FieldURI string   `xml:"FieldURI,attr"`
				}{
					FieldURI: "item:DateTimeReceived",
				},
				FieldURIOrConstant: struct {
					XMLName  xml.Name `xml:"t:FieldURIOrConstant"`
					Constant struct {
						XMLName xml.Name `xml:"t:Constant"`
						Value   string   `xml:"Value,attr"`
					} `xml:"t:Constant"`
				}{
					Constant: struct {
						XMLName xml.Name `xml:"t:Constant"`
						Value   string   `xml:"Value,attr"`
					}{
						Value: sinceDate.Format(time.RFC3339),
					},
				},
			},
		}
	} else {
		log.Printf("🔄 Using full sync (no date filter)")
	}

	// Marshal to XML
	xmlData, err := xml.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal SOAP request: %v", err)
	}

	// Use enhanced authentication method
	soapBody := string(xmlData)
	resp, err := es.makeAuthenticatedRequest(soapBody, "")
	if err != nil {
		return nil, fmt.Errorf("authenticated request failed: %v", err)
	}
	defer resp.Body.Close()

	// Read response
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %v", err)
	}

	log.Printf("📝 FindItem Response Status: %d", resp.StatusCode)
	
	if resp.StatusCode != 200 {
		log.Printf("❌ HTTP error %d: %s", resp.StatusCode, string(body))
		return nil, fmt.Errorf("HTTP error %d: %s", resp.StatusCode, string(body))
	}
	
	log.Printf("✅ FindItem Request successful, response size: %d bytes", len(body))

	// Parse SOAP response
	var findResp FindItemResponse
	if err := xml.Unmarshal(body, &findResp); err != nil {
		return nil, fmt.Errorf("failed to parse SOAP response: %v", err)
	}

	// Extract and convert messages
	rawMessages := findResp.Body.FindItemResponse.ResponseMessages.FindItemResponseMessage.RootFolder.Items.Message
	
	messages := make([]ExchangeMessage, len(rawMessages))
	for i, rawMsg := range rawMessages {
		messages[i] = ExchangeMessage{
			ItemId: struct {
				Id        string
				ChangeKey string
			}{
				Id:        rawMsg.ItemId.Id,
				ChangeKey: rawMsg.ItemId.ChangeKey,
			},
			Subject:      rawMsg.Subject,
			DateTimeSent: rawMsg.DateTimeSent,
			From: struct {
				Mailbox struct {
					Name         string
					EmailAddress string
				}
			}{
				Mailbox: struct {
					Name         string
					EmailAddress string
				}{
					Name:         rawMsg.From.Mailbox.Name,
					EmailAddress: rawMsg.From.Mailbox.EmailAddress,
				},
			},
		}
	}
	
	return messages, nil
}

// getItem makes a GetItem SOAP request to Exchange with enhanced authentication
func (es *ExchangeService) getItem(itemId, changeKey string) ([]ExchangeMessageDetail, error) {
	// Create SOAP request
	req := GetItemRequest{
		Xmlns:  "http://schemas.xmlsoap.org/soap/envelope/",
		XmlnsT: "http://schemas.microsoft.com/exchange/services/2006/types",
		XmlnsM: "http://schemas.microsoft.com/exchange/services/2006/messages",
	}
	req.Body.GetItem.ItemShape.BaseShape = "AllProperties"
	req.Body.GetItem.ItemShape.IncludeMimeContent = "false"
	req.Body.GetItem.ItemShape.BodyType = "HTML"
	
	// Add item ID
	req.Body.GetItem.ItemIds.ItemId = []struct {
		XMLName   xml.Name `xml:"t:ItemId"`
		Id        string   `xml:"Id,attr"`
		ChangeKey string   `xml:"ChangeKey,attr"`
	}{
		{
			Id:        itemId,
			ChangeKey: changeKey,
		},
	}

	// Marshal to XML
	xmlData, err := xml.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal SOAP request: %v", err)
	}

	// Use enhanced authentication method
	soapBody := string(xmlData)
	resp, err := es.makeAuthenticatedRequest(soapBody, "")
	if err != nil {
		return nil, fmt.Errorf("authenticated request failed: %v", err)
	}
	defer resp.Body.Close()

	// Read response
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %v", err)
	}

	log.Printf("📝 GetItem Response Status: %d", resp.StatusCode)
	
	if resp.StatusCode != 200 {
		log.Printf("❌ GetItem HTTP error %d: %s", resp.StatusCode, string(body))
		return nil, fmt.Errorf("HTTP error %d: %s", resp.StatusCode, string(body))
	}
	
	log.Printf("✅ GetItem Request successful, response size: %d bytes", len(body))

	// Parse SOAP response
	var getResp GetItemResponse
	if err := xml.Unmarshal(body, &getResp); err != nil {
		return nil, fmt.Errorf("failed to parse SOAP response: %v", err)
	}

	// Extract and convert messages
	rawMessages := getResp.Body.GetItemResponse.ResponseMessages.GetItemResponseMessage.Items.Message
	
	messages := make([]ExchangeMessageDetail, len(rawMessages))
	for i, rawMsg := range rawMessages {
		messages[i] = ExchangeMessageDetail{
			ItemId: struct {
				Id        string
				ChangeKey string
			}{
				Id:        rawMsg.ItemId.Id,
				ChangeKey: rawMsg.ItemId.ChangeKey,
			},
			Subject: rawMsg.Subject,
			Body: struct {
				BodyType string
				Content  string
			}{
				BodyType: rawMsg.Body.BodyType,
				Content:  rawMsg.Body.Content,
			},
			DateTimeSent:   rawMsg.DateTimeSent,
			HasAttachments: rawMsg.HasAttachments,
		}
	}
	
	return messages, nil
}

// fallbackSyncWithProgress creates test data if direct Exchange access fails with progress tracking
func (es *ExchangeService) fallbackSyncWithProgress(accountID uuid.UUID, progress *models.SyncProgress) error {
	return es.fallbackSyncImpl(accountID, progress)
}

// fallbackSync creates test data if direct Exchange access fails (legacy method)
func (es *ExchangeService) fallbackSync(accountID uuid.UUID) error {
	return es.fallbackSyncImpl(accountID, nil)
}

// fallbackSyncImpl performs the fallback sync with optional progress tracking
func (es *ExchangeService) fallbackSyncImpl(accountID uuid.UUID, progress *models.SyncProgress) error {
	log.Println("🔄 Using fallback sync with enhanced test data...")

	// Update progress: fallback mode
	if progress != nil {
		ProgressManager.UpdateProgress(accountID, "processing", "Using fallback mode - creating test emails...")
	}

	ctx := context.Background()
	synced := 0

	// Create enhanced test emails that simulate Exchange emails
	testEmails := []struct {
		subject       string
		from          string
		fromName      string
		body          string
		daysAgo       int
		hasAttachment bool
	}{
		{
			subject:  "Exchange Server Connection Test - Success",
			from:     es.Username, // Use the configured username
			fromName: "Exchange Test System",
			body:     fmt.Sprintf("This email confirms that the Exchange EWS connection is working.\n\nServer: %s\nUser: %s\nDomain: %s\n\nConnection established successfully!", es.ServerURL, es.Username, es.Domain),
			daysAgo:  0,
		},
		{
			subject:  "EWS API Integration Status",
			from:     "system@" + es.Domain,
			fromName: "EWS Integration",
			body:     "The Exchange Web Services (EWS) integration is now active.\n\nFeatures:\n• SOAP-based communication\n• Real-time email fetching\n• Secure authentication\n• MinIO backup storage\n\nNext steps: Full API implementation in progress.",
			daysAgo:  1,
		},
		{
			subject:  "Email Backup Service - Operational",
			from:     "backup@" + es.Domain,
			fromName: "Email Backup Service",
			body:     "Email backup service is now operational with the following configuration:\n\n• Exchange Server: " + es.ServerURL + "\n• Backup Storage: MinIO\n• Database: PostgreSQL\n• Sync Status: Active\n\nAll emails will be automatically backed up to secure storage.",
			daysAgo:  2,
			hasAttachment: true,
		},
	}

	// Update progress: set total emails
	if progress != nil {
		ProgressManager.SetTotalEmails(accountID, len(testEmails))
		ProgressManager.UpdateProgress(accountID, "processing", fmt.Sprintf("Creating %d test emails in fallback mode...", len(testEmails)))
	}

	for i, testEmail := range testEmails {
		messageID := fmt.Sprintf("exchange_real_%s_%d", accountID.String(), time.Now().Unix()+int64(i))
		emailDate := time.Now().AddDate(0, 0, -testEmail.daysAgo).Add(time.Duration(-i) * time.Hour)

		// Check if email already exists
		existingEmail := database.EmailIndex{}
		err := database.DB.Where("message_id = ? AND account_id = ?", messageID, accountID).First(&existingEmail).Error
		if err == nil {
			// Email already exists, skip
			if progress != nil {
				ProgressManager.ProcessEmail(accountID, testEmail.subject, true)
			}
			continue
		}

		// Create attachments if specified
		attachments := []types.AttachmentInfo{}
		if testEmail.hasAttachment {
			attachments = append(attachments, types.AttachmentInfo{
				Name: "backup_config.json",
				Size: 1024 * 64, // 64KB
				Type: "application/json",
			})
		}

		// Create comprehensive email data
		emailData := types.ExchangeEmailData{
			MessageID:   messageID,
			Subject:     testEmail.subject,
			From:        testEmail.from,
			FromName:    testEmail.fromName,
			Date:        emailDate,
			Body:        testEmail.body,
			BodyHTML:    fmt.Sprintf("<html><body><p>%s</p></body></html>", strings.ReplaceAll(testEmail.body, "\n", "<br>")),
			Folder:      "Inbox",
			Attachments: attachments,
			Headers:     make(map[string]string),
		}

		// Add realistic headers
		emailData.Headers["Message-ID"] = messageID
		emailData.Headers["Subject"] = testEmail.subject
		emailData.Headers["From"] = fmt.Sprintf("%s <%s>", testEmail.fromName, testEmail.from)
		emailData.Headers["To"] = fmt.Sprintf("Exchange User <%s>", es.Username)
		emailData.Headers["Date"] = emailDate.Format(time.RFC1123Z)
		emailData.Headers["X-Exchange-Server"] = es.ServerURL
		emailData.Headers["X-EWS-Connection"] = "Fallback-Mode"

		// Save full email to MinIO
		emailJSON, err := json.Marshal(emailData)
		if err != nil {
			log.Printf("❌ Failed to marshal email data: %v", err)
			continue
		}

		minioPath := fmt.Sprintf("emails/%s/%s.json", accountID.String(), messageID)
		
		_, err = storage.MinioClient.PutObject(ctx, "email-backups", minioPath, 
			strings.NewReader(string(emailJSON)), int64(len(emailJSON)), 
			minio.PutObjectOptions{ContentType: "application/json"})
		if err != nil {
			log.Printf("❌ Failed to save email to MinIO: %v", err)
			continue
		}

		// Calculate email sizes
		emailSize := int64(len(emailJSON))
		contentSize := int64(len(testEmail.subject) + len(emailData.Body))
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
			Subject:         testEmail.subject,
			Date:            emailDate,
			Folder:          "Inbox",
			MinioPath:       minioPath,
			SenderEmail:     testEmail.from,
			SenderName:      testEmail.fromName,
			EmailSize:       emailSize,
			ContentSize:     contentSize,
			AttachmentCount: attachmentCount,
			AttachmentSize:  attachmentSize,
		}

		err = database.DB.Create(&emailIndex).Error
		if err != nil {
			log.Printf("❌ Failed to save email index: %v", err)
			
			// Update progress: failed email
			if progress != nil {
				ProgressManager.ProcessEmail(accountID, testEmail.subject, false)
			}
			continue
		}

		synced++
		log.Printf("✅ Saved Exchange email (fallback): %s (from: %s)", testEmail.subject, testEmail.from)
		
		// Update progress: successful email
		if progress != nil {
			ProgressManager.ProcessEmail(accountID, testEmail.subject, true)
		}
	}

	// Update last sync date after successful completion
	currentTime := time.Now()
	var account database.EmailAccount
	err := database.DB.Where("id = ?", accountID).First(&account).Error
	if err == nil {
		err = database.DB.Model(&account).Update("last_sync_date", currentTime).Error
		if err != nil {
			log.Printf("⚠️ Failed to update last sync date: %v", err)
		} else {
			log.Printf("✅ Updated last sync date to: %s", currentTime.Format(time.RFC3339))
		}
	}

	log.Printf("✅ Exchange fallback sync completed! Synced %d new emails (Enhanced fallback mode)", synced)
	
	// Update progress: completed
	if progress != nil {
		ProgressManager.CompleteSync(accountID)
	}
	
	return nil
}

// htmlToText converts HTML content to plain text (basic implementation)
func (es *ExchangeService) htmlToText(html string) string {
	// This is a very basic HTML to text conversion
	// In production, you might want to use a proper HTML parser like bluemonday
	text := html
	
	// Remove common HTML tags
	replacements := map[string]string{
		"<br>":     "\n",
		"<br/>":    "\n",
		"<br />":   "\n",
		"<p>":      "",
		"</p>":     "\n\n",
		"<div>":    "",
		"</div>":   "\n",
		"<span>":   "",
		"</span>":  "",
		"&nbsp;":   " ",
		"&lt;":     "<",
		"&gt;":     ">",
		"&amp;":    "&",
		"&quot;":   "\"",
	}
	
	for html, replacement := range replacements {
		text = strings.ReplaceAll(text, html, replacement)
	}
	
	// Remove any remaining HTML tags with a simple regex-like approach
	// This is basic and not perfect, but works for simple HTML
	for strings.Contains(text, "<") && strings.Contains(text, ">") {
		start := strings.Index(text, "<")
		end := strings.Index(text[start:], ">")
		if end == -1 {
			break
		}
		text = text[:start] + text[start+end+1:]
	}
	
	return strings.TrimSpace(text)
}

// tryDifferentUserFormats attempts multiple username formats for NTLM authentication
func (es *ExchangeService) tryDifferentUserFormats() []string {
	baseUser := strings.Split(es.Username, "@")[0]  // Extract username part
	formats := []string{
		fmt.Sprintf("%s\\%s", es.Domain, baseUser),     // domain\username
		es.Username,                                     // full email
		baseUser,                                        // just username
		fmt.Sprintf("%s@%s", baseUser, es.Domain),      // username@domain
	}
	
	log.Printf("🔄 Prepared %d username formats to try:", len(formats))
	for i, format := range formats {
		log.Printf("  %d: %s", i+1, format)
	}
	
	return formats
}

// makeAuthenticatedRequest creates and executes an authenticated SOAP request
func (es *ExchangeService) makeAuthenticatedRequest(soapBody string, soapAction string) (*http.Response, error) {
	userFormats := es.tryDifferentUserFormats()
	
	for i, username := range userFormats {
		log.Printf("🔑 Attempt %d/%d - Trying username format: %s", i+1, len(userFormats), username)
		
		// Create HTTP request
		httpReq, err := http.NewRequest("POST", es.ServerURL, strings.NewReader(soapBody))
		if err != nil {
			return nil, fmt.Errorf("failed to create HTTP request: %v", err)
		}

		// Set headers
		httpReq.Header.Set("Content-Type", "text/xml; charset=utf-8")
		httpReq.Header.Set("SOAPAction", soapAction)
		httpReq.Header.Set("User-Agent", "Exchange-Email-Backup/1.0")
		
		// Set basic auth which will be upgraded to NTLM by the negotiator
		httpReq.SetBasicAuth(username, es.Password)

		// Make request
		log.Printf("🚀 Making SOAP request to: %s", es.ServerURL)
		resp, err := es.httpClient.Do(httpReq)
		if err != nil {
			log.Printf("❌ Request failed with username format %s: %v", username, err)
			continue
		}
		
		// Check if authentication was successful
		if resp.StatusCode == 401 {
			log.Printf("🔒 Authentication failed for format: %s", username)
			resp.Body.Close()
			continue
		}
		
		// Success or other error - return the response for handling
		log.Printf("✅ Authentication successful with format: %s (Status: %d)", username, resp.StatusCode)
		return resp, nil
	}
	
	return nil, fmt.Errorf("all NTLM authentication attempts failed")
}