package storage

import (
	"context"
	"encoding/json"
	"fmt"
	"io"

	"emailprojectv2/types"
	"github.com/minio/minio-go/v7"
)

// GetEmailFromMinIO retrieves the full email content from MinIO storage
func GetEmailFromMinIO(minioPath string) (*types.ExchangeEmailData, error) {
	if MinioClient == nil {
		return nil, fmt.Errorf("MinIO client not initialized")
	}

	ctx := context.Background()
	
	// Get object from MinIO
	object, err := MinioClient.GetObject(ctx, "email-backups", minioPath, minio.GetObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to get email from MinIO: %v", err)
	}
	defer object.Close()

	// Read the JSON content
	jsonData, err := io.ReadAll(object)
	if err != nil {
		return nil, fmt.Errorf("failed to read email content: %v", err)
	}

	// Unmarshal JSON to email data structure
	var emailData types.ExchangeEmailData
	err = json.Unmarshal(jsonData, &emailData)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal email data: %v", err)
	}

	return &emailData, nil
}

// GetGmailEmailFromMinIO can be used for Gmail emails (placeholder for now)
func GetGmailEmailFromMinIO(minioPath string) (map[string]interface{}, error) {
	if MinioClient == nil {
		return nil, fmt.Errorf("MinIO client not initialized")
	}

	ctx := context.Background()
	
	object, err := MinioClient.GetObject(ctx, "email-backups", minioPath, minio.GetObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to get email from MinIO: %v", err)
	}
	defer object.Close()

	jsonData, err := io.ReadAll(object)
	if err != nil {
		return nil, fmt.Errorf("failed to read email content: %v", err)
	}

	var emailData map[string]interface{}
	err = json.Unmarshal(jsonData, &emailData)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal email data: %v", err)
	}

	return emailData, nil
}