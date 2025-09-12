package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Database  DatabaseConfig
	MinIO     MinIOConfig
	JWT       JWTConfig
	Server    ServerConfig
	Exchange  ExchangeConfig
	Gmail     GmailConfig
	Office365 Office365Config
	Yahoo     YahooConfig
	Outlook   OutlookConfig
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
}

type MinIOConfig struct {
	Endpoint        string
	AccessKey       string
	SecretKey       string
	UseSSL          bool
	BucketEmails    string
	BucketAttachments string
}

type JWTConfig struct {
	Secret string
	Expiry string
}

type ServerConfig struct {
	Port    string
	GinMode string
}

type ExchangeConfig struct {
	ServerURL string
	Username  string
	Password  string
	Domain    string
}

type GmailConfig struct {
	IMAPServer  string
	IMAPPort    string
	Username    string
	AppPassword string
}

type Office365Config struct {
	TenantID     string
	ClientID     string
	ClientSecret string
	RedirectURL  string
}

type YahooConfig struct {
	ClientID     string
	ClientSecret string
	RedirectURL  string
}

type OutlookConfig struct {
	ClientID     string
	ClientSecret string
	RedirectURL  string
}

func Load() *Config {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	return &Config{
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", ""),
			DBName:   getEnv("DB_NAME", "email_backup_mvp"),
		},
		MinIO: MinIOConfig{
			Endpoint:          getEnv("MINIO_ENDPOINT", "localhost:9000"),
			AccessKey:         getEnv("MINIO_ACCESS_KEY", "minioadmin"),
			SecretKey:         getEnv("MINIO_SECRET_KEY", "minioadmin"),
			UseSSL:            getEnv("MINIO_USE_SSL", "false") == "true",
			BucketEmails:      getEnv("MINIO_BUCKET_EMAILS", "email-backups"),
			BucketAttachments: getEnv("MINIO_BUCKET_ATTACHMENTS", "email-attachments"),
		},
		JWT: JWTConfig{
			Secret: getEnv("JWT_SECRET", "EmailBackupMVP2025SecretKey!"),
			Expiry: getEnv("JWT_EXPIRY", "24h"),
		},
		Server: ServerConfig{
			Port:    getEnv("PORT", "8080"),
			GinMode: getEnv("GIN_MODE", "debug"),
		},
		Exchange: ExchangeConfig{
			ServerURL: getEnv("EXCHANGE_SERVER_URL", ""),
			Username:  getEnv("EXCHANGE_USERNAME", ""),
			Password:  getEnv("EXCHANGE_PASSWORD", ""),
			Domain:    getEnv("EXCHANGE_DOMAIN", ""),
		},
		Gmail: GmailConfig{
			IMAPServer:  getEnv("GMAIL_IMAP_SERVER", "imap.gmail.com"),
			IMAPPort:    getEnv("GMAIL_IMAP_PORT", "993"),
			Username:    getEnv("GMAIL_USERNAME", ""),
			AppPassword: getEnv("GMAIL_APP_PASSWORD", ""),
		},
		Office365: Office365Config{
			TenantID:     getEnv("OFFICE365_TENANT_ID", "common"),
			ClientID:     getEnv("OFFICE365_CLIENT_ID", ""),
			ClientSecret: getEnv("OFFICE365_CLIENT_SECRET", ""),
			RedirectURL:  getEnv("OFFICE365_REDIRECT_URL", "http://localhost:8080/api/oauth/office365/callback"),
		},
		Yahoo: YahooConfig{
			ClientID:     getEnv("YAHOO_CLIENT_ID", ""),
			ClientSecret: getEnv("YAHOO_CLIENT_SECRET", ""),
			RedirectURL:  getEnv("YAHOO_REDIRECT_URL", "http://localhost:8080/api/oauth/yahoo/callback"),
		},
		Outlook: OutlookConfig{
			ClientID:     getEnv("OUTLOOK_CLIENT_ID", ""),
			ClientSecret: getEnv("OUTLOOK_CLIENT_SECRET", ""),
			RedirectURL:  getEnv("OUTLOOK_REDIRECT_URL", "http://localhost:8080/api/oauth/outlook/callback"),
		},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}