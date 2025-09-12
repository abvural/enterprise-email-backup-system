package storage

import (
	"context"
	"fmt"
	"log"

	"emailprojectv2/config"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

var MinioClient *minio.Client

func ConnectMinio(cfg *config.Config) error {
	client, err := minio.New(cfg.MinIO.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.MinIO.AccessKey, cfg.MinIO.SecretKey, ""),
		Secure: cfg.MinIO.UseSSL,
	})
	if err != nil {
		return fmt.Errorf("failed to create MinIO client: %v", err)
	}

	MinioClient = client

	// Test connection
	ctx := context.Background()
	
	// Check if client can list buckets (basic connectivity test)
	_, err = client.ListBuckets(ctx)
	if err != nil {
		return fmt.Errorf("failed to connect to MinIO: %v", err)
	}

	log.Println("✅ MinIO bağlantısı başarılı!")

	// Create buckets if they don't exist
	if err := createBucketIfNotExists(ctx, cfg.MinIO.BucketEmails); err != nil {
		return fmt.Errorf("failed to create emails bucket: %v", err)
	}

	if err := createBucketIfNotExists(ctx, cfg.MinIO.BucketAttachments); err != nil {
		return fmt.Errorf("failed to create attachments bucket: %v", err)
	}

	return nil
}

func createBucketIfNotExists(ctx context.Context, bucketName string) error {
	exists, err := MinioClient.BucketExists(ctx, bucketName)
	if err != nil {
		return err
	}

	if !exists {
		err = MinioClient.MakeBucket(ctx, bucketName, minio.MakeBucketOptions{})
		if err != nil {
			return err
		}
		log.Printf("✅ MinIO bucket '%s' oluşturuldu", bucketName)
	} else {
		log.Printf("✅ MinIO bucket '%s' mevcut", bucketName)
	}

	return nil
}