# Email Yedekleme Projesi - Detaylı Planlama

## 📋 Proje Özeti

### Amaç
Kullanıcıların farklı email provider'larından (Gmail, Office365, Exchange) email'lerini yedekleyip, modern bir web arayüzü ile yönetebilecekleri bir sistem geliştirmek.

### MVP Hedefleri
- Multi-provider email desteği (Gmail, Office365, Exchange, Generic IMAP)
- Object storage odaklı veri depolama (minimal PostgreSQL)
- Modern Office 365 tarzı kullanıcı arayüzü
- Windows ortamında lokal çalıştırma

---

## 🛠️ Teknoloji Stack

### Backend
- **Go**: Performanslı email işleme ve goroutines
- **Gin Framework**: REST API geliştirme
- **GORM**: Minimal PostgreSQL ORM

### Frontend  
- **React.js**: Modern UI framework
- **Office 365 Design System**: Microsoft Fluent UI components
- **TypeScript**: Type safety

### Veri Katmanı
- **PostgreSQL**: Minimal indexleme (sadece metadata)
- **MinIO**: Ana veri depolama (emails, attachments)

### Authentication
- **JWT**: Session management
- **OAuth2**: Gmail ve Office365 için
- **Azure AD**: Office365 integration

---

## 📧 Email Provider Desteği

### 1. Gmail (OAuth2 + IMAP)
```go
// Kütüphaneler
golang.org/x/oauth2/google
github.com/emersion/go-imap/v2

// Authentication Flow
1. OAuth2 consent screen
2. Access token alma
3. XOAUTH2 SASL format: base64("user=" + user + "^Aauth=Bearer " + token + "^A^A")
4. IMAP bağlantısı (imap.gmail.com:993)
```

**Konfigürasyon**:
```json
{
  "provider": "gmail",
  "client_id": "google_client_id",
  "client_secret": "google_client_secret", 
  "refresh_token": "encrypted_refresh_token",
  "access_token": "encrypted_access_token",
  "scope": "https://mail.google.com/"
}
```

### 2. Office 365 (Microsoft Graph API)
```go
// Kütüphaneler (EWS deprecated)
github.com/microsoftgraph/msgraph-sdk-go
github.com/Azure/azure-sdk-for-go/sdk/azidentity

// Authentication Flow  
1. Azure AD app registration
2. OAuth2 consent (delegated permissions)
3. Microsoft Graph API endpoints
4. /me/messages endpoint'i kullanma
```

**Konfigürasyon**:
```json
{
  "provider": "office365",
  "tenant_id": "azure_tenant_id",
  "client_id": "azure_client_id", 
  "client_secret": "encrypted_secret",
  "access_token": "encrypted_token",
  "refresh_token": "encrypted_refresh"
}
```

### 3. Exchange Server (Legacy EWS)
```go
// Kütüphane (Legacy support)
github.com/mhewedy/ews

// Authentication
1. NTLM veya Basic Auth (deprecated)
2. EWS endpoint discovery
3. Exchange Web Services API
```

**Konfigürasyon**:
```json
{
  "provider": "exchange",
  "server_url": "https://exchange.company.com/EWS/Exchange.asmx",
  "domain": "company.com",
  "username": "user",
  "password": "encrypted_password"
}
```

### 4. Generic IMAP/POP3
```go
// Kütüphane
github.com/emersion/go-imap/v2

// Standard IMAP auth
1. Username/password
2. SSL/TLS connection  
3. Folder enumeration
```

---

## 🏗️ Veri Mimarisi

### PostgreSQL (Minimal Usage)
```sql
-- Kullanıcı yönetimi
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Email hesap konfigürasyonları
CREATE TABLE email_accounts (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    provider VARCHAR(20), -- 'gmail', 'office365', 'exchange', 'imap'
    email_address VARCHAR(255),
    display_name VARCHAR(255),
    config JSONB, -- Provider-specific config (encrypted)
    oauth_tokens JSONB, -- Encrypted tokens
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP
);

-- Hızlı arama için index (minimal)
CREATE TABLE email_index (
    id UUID PRIMARY KEY,
    user_id UUID,
    email_account_id UUID,
    message_id VARCHAR(255), -- Email message-id header
    subject TEXT,
    sender_email VARCHAR(255),
    sender_name VARCHAR(255),
    recipient_emails TEXT[], -- Array of recipients
    folder VARCHAR(100), -- INBOX, SENT, DRAFTS
    has_attachments BOOLEAN,
    email_date TIMESTAMP,
    sync_date TIMESTAMP,
    minio_path VARCHAR(500) -- MinIO'daki JSON file path
);

-- Sync durumu
CREATE TABLE sync_status (
    email_account_id UUID PRIMARY KEY,
    last_successful_sync TIMESTAMP,
    last_sync_attempt TIMESTAMP,
    sync_in_progress BOOLEAN DEFAULT false,
    error_message TEXT,
    total_emails INTEGER DEFAULT 0,
    synced_emails INTEGER DEFAULT 0
);
```

### MinIO Storage Structure
```
Bucket: emails
├── {user_id}/
│   ├── {email_account_id}/
│   │   ├── INBOX/
│   │   │   ├── 2024/01/
│   │   │   │   ├── {message_id}.json (email metadata + content)
│   │   │   │   └── {message_id}.mbox (raw email backup)
│   │   │   └── 2024/02/...
│   │   ├── SENT/...
│   │   └── DRAFTS/...
│   └── attachments/
│       └── {message_id}/
│           ├── file1.pdf
│           └── image.jpg

Bucket: raw-backups  
├── {user_id}/
│   └── {email_account_id}/
│       ├── backup_2024_01_15.mbox
│       └── backup_2024_01_15.idx
```

### Email JSON Format (MinIO)
```json
{
  "message_id": "<unique-message-id@gmail.com>",
  "thread_id": "thread_abc123",
  "subject": "Email subject",
  "from": {
    "email": "sender@email.com", 
    "name": "Sender Name"
  },
  "to": [
    {"email": "recipient@email.com", "name": "Recipient Name"}
  ],
  "cc": [],
  "bcc": [],
  "date": "2024-01-15T10:30:00Z",
  "received_date": "2024-01-15T10:30:05Z",
  "folder": "INBOX",
  "labels": ["Important", "Work"],
  "flags": ["\\Seen", "\\Answered"],
  "headers": {
    "message-id": "<unique-message-id@gmail.com>",
    "in-reply-to": "<parent-message-id@gmail.com>",
    "references": "<ref1@gmail.com> <ref2@gmail.com>",
    "x-gmail-message-id": "123456789",
    "content-type": "multipart/mixed"
  },
  "body": {
    "text": "Plain text content...",
    "html": "<html><body>HTML content...</body></html>"
  },
  "attachments": [
    {
      "filename": "document.pdf",
      "content_type": "application/pdf", 
      "size": 524288,
      "minio_path": "attachments/{message_id}/document.pdf",
      "content_id": "attachment1"
    }
  ],
  "provider_metadata": {
    "gmail_thread_id": "gmail_specific_data",
    "office365_id": "office365_specific_data"
  },
  "sync_metadata": {
    "synced_at": "2024-01-15T10:35:00Z",
    "sync_version": 1,
    "provider": "gmail"
  }
}
```

---

## 🗂️ Proje Yapısı

```
emailprojectv2/
├── backend/
│   ├── cmd/
│   │   └── main.go                    # Application entry point
│   ├── internal/
│   │   ├── api/
│   │   │   ├── handlers/              # HTTP handlers
│   │   │   │   ├── auth.go
│   │   │   │   ├── users.go
│   │   │   │   ├── accounts.go
│   │   │   │   ├── emails.go
│   │   │   │   └── sync.go
│   │   │   ├── middleware/            # JWT, CORS, rate limiting
│   │   │   └── routes.go              # Route definitions
│   │   ├── models/                    # Database models (GORM)
│   │   │   ├── user.go
│   │   │   ├── email_account.go
│   │   │   ├── email_index.go
│   │   │   └── sync_status.go
│   │   ├── providers/                 # Email provider implementations
│   │   │   ├── interface.go           # EmailProvider interface
│   │   │   ├── gmail/
│   │   │   │   ├── client.go
│   │   │   │   ├── auth.go
│   │   │   │   └── sync.go
│   │   │   ├── office365/
│   │   │   │   ├── client.go
│   │   │   │   ├── auth.go
│   │   │   │   └── sync.go
│   │   │   ├── exchange/
│   │   │   │   ├── client.go
│   │   │   │   └── sync.go
│   │   │   └── imap/
│   │   │       ├── client.go
│   │   │       └── sync.go
│   │   ├── services/                  # Business logic
│   │   │   ├── auth_service.go
│   │   │   ├── email_service.go
│   │   │   ├── sync_service.go
│   │   │   └── storage_service.go
│   │   ├── storage/                   # MinIO operations
│   │   │   ├── minio_client.go
│   │   │   ├── email_storage.go
│   │   │   └── attachment_storage.go
│   │   ├── database/                  # Database operations
│   │   │   ├── connection.go
│   │   │   ├── migrations/
│   │   │   └── repository/
│   │   │       ├── user_repo.go
│   │   │       ├── account_repo.go
│   │   │       └── email_repo.go
│   │   ├── config/                    # Configuration management
│   │   │   ├── config.go
│   │   │   └── env.go
│   │   └── utils/                     # Utilities
│   │       ├── crypto.go              # Encryption/decryption
│   │       ├── email_parser.go        # Email parsing utilities
│   │       └── validator.go           # Input validation
│   ├── pkg/                          # Public packages
│   ├── scripts/                      # Setup scripts
│   │   ├── setup_db.sql
│   │   ├── start_minio.bat
│   │   └── dev_setup.bat
│   ├── go.mod
│   ├── go.sum
│   ├── .env.example
│   └── Dockerfile.dev
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/                # Reusable UI components
│   │   │   ├── auth/                  # Login, register
│   │   │   ├── accounts/              # Email account management
│   │   │   ├── emails/                # Email list, detail, compose
│   │   │   └── sync/                  # Sync status, progress
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── EmailList.tsx
│   │   │   ├── EmailDetail.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── AccountSetup.tsx
│   │   ├── services/
│   │   │   ├── api.ts                 # API client
│   │   │   ├── auth.ts                # Authentication
│   │   │   └── websocket.ts           # Real-time sync updates
│   │   ├── hooks/                     # Custom React hooks
│   │   ├── styles/                    # Office 365 themed CSS
│   │   ├── utils/
│   │   └── types/                     # TypeScript definitions
│   ├── package.json
│   └── tsconfig.json
├── docs/
│   ├── API.md                        # API documentation
│   ├── SETUP.md                      # Windows setup guide
│   ├── PROVIDERS.md                  # Email provider setup guides
│   └── ARCHITECTURE.md               # System architecture
├── .gitignore
├── README.md
└── PROJE_PLANLAMA.md                # Bu dosya
```

---

## 📦 Go Kütüphaneleri ve Versiyonlar

### Core Dependencies
```go
// go.mod
module emailprojectv2

go 1.21

require (
    // Web Framework
    github.com/gin-gonic/gin v1.9.1
    github.com/gin-contrib/cors v1.4.0
    
    // Database
    gorm.io/gorm v1.25.5
    gorm.io/driver/postgres v1.5.4
    
    // MinIO Object Storage
    github.com/minio/minio-go/v7 v7.0.63
    
    // Authentication & JWT
    github.com/golang-jwt/jwt/v5 v5.0.0
    golang.org/x/crypto v0.15.0
    
    // Gmail OAuth2
    golang.org/x/oauth2 v0.15.0
    google.golang.org/api v0.152.0
    
    // Office365 Graph API
    github.com/microsoftgraph/msgraph-sdk-go v1.28.0
    github.com/Azure/azure-sdk-for-go/sdk/azidentity v1.4.0
    
    // Exchange EWS (Legacy)
    github.com/mhewedy/ews v1.0.1
    
    // Email Processing
    github.com/emersion/go-imap/v2 v2.0.0-beta.1
    github.com/emersion/go-sasl v0.0.0-20231106173351-e73c9f7bad43
    github.com/emersion/go-message v0.17.0
    
    // Configuration
    github.com/joho/godotenv v1.4.0
    github.com/spf13/viper v1.17.0
    
    // Utilities
    github.com/google/uuid v1.4.0
    github.com/rs/zerolog v1.31.0
    golang.org/x/text v0.14.0
)
```

---

## 🔧 Provider Interface Design

### EmailProvider Interface
```go
package providers

import (
    "context"
    "time"
)

type EmailProvider interface {
    // Authentication
    Authenticate(ctx context.Context, config AuthConfig) error
    RefreshToken(ctx context.Context) error
    IsAuthenticated() bool
    
    // Connection
    Connect(ctx context.Context) error
    Disconnect() error
    TestConnection() error
    
    // Folder Operations
    GetFolders(ctx context.Context) ([]Folder, error)
    
    // Email Operations  
    GetEmails(ctx context.Context, folder string, since time.Time) ([]EmailHeader, error)
    GetEmailDetail(ctx context.Context, messageID string) (*EmailDetail, error)
    GetEmailRaw(ctx context.Context, messageID string) ([]byte, error)
    
    // Attachment Operations
    GetAttachment(ctx context.Context, messageID, attachmentID string) ([]byte, error)
    
    // Sync Operations
    GetLastSyncTime(folder string) time.Time
    SetLastSyncTime(folder string, t time.Time)
    
    // Provider Info
    GetProviderType() ProviderType
    GetProviderInfo() ProviderInfo
}

type ProviderType string
const (
    ProviderGmail     ProviderType = "gmail"
    ProviderOffice365 ProviderType = "office365" 
    ProviderExchange  ProviderType = "exchange"
    ProviderIMAP      ProviderType = "imap"
)

type AuthConfig struct {
    Provider     ProviderType `json:"provider"`
    ClientID     string       `json:"client_id,omitempty"`
    ClientSecret string       `json:"client_secret,omitempty"`
    AccessToken  string       `json:"access_token,omitempty"`
    RefreshToken string       `json:"refresh_token,omitempty"`
    Username     string       `json:"username,omitempty"`
    Password     string       `json:"password,omitempty"`
    ServerURL    string       `json:"server_url,omitempty"`
    ServerPort   int          `json:"server_port,omitempty"`
    UseTLS       bool         `json:"use_tls,omitempty"`
    TenantID     string       `json:"tenant_id,omitempty"`
}

type Folder struct {
    ID       string `json:"id"`
    Name     string `json:"name"`
    FullName string `json:"full_name"`
    Type     string `json:"type"` // INBOX, SENT, DRAFTS, TRASH
    Count    int    `json:"count"`
    Unread   int    `json:"unread"`
}

type EmailHeader struct {
    MessageID    string    `json:"message_id"`
    Subject      string    `json:"subject"`
    From         Contact   `json:"from"`
    To           []Contact `json:"to"`
    Date         time.Time `json:"date"`
    Folder       string    `json:"folder"`
    HasAttachments bool    `json:"has_attachments"`
    IsRead       bool      `json:"is_read"`
    Size         int64     `json:"size"`
}

type Contact struct {
    Email string `json:"email"`
    Name  string `json:"name"`
}
```

---

## 🔐 Güvenlik ve Encryption

### Token Storage
```go
// Encryption for sensitive data
package utils

import (
    "crypto/aes"
    "crypto/cipher"
    "crypto/rand"
    "encoding/base64"
    "errors"
)

// AES-256 encryption for storing OAuth tokens
func EncryptToken(token string, key []byte) (string, error) {
    block, err := aes.NewCipher(key)
    if err != nil {
        return "", err
    }
    
    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return "", err
    }
    
    nonce := make([]byte, gcm.NonceSize())
    if _, err := rand.Read(nonce); err != nil {
        return "", err
    }
    
    ciphertext := gcm.Seal(nonce, nonce, []byte(token), nil)
    return base64.StdEncoding.EncodeToString(ciphertext), nil
}

func DecryptToken(encryptedToken string, key []byte) (string, error) {
    // Decryption implementation
}
```

### Environment Variables
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=emailuser
DB_PASSWORD=strong_password
DB_NAME=emailbackup

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Encryption
ENCRYPTION_KEY=32-byte-encryption-key-for-tokens

# Gmail OAuth2
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret

# Office 365
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# Server
PORT=8080
GIN_MODE=debug
```

---

## 🚀 API Tasarımı

### REST Endpoints
```
# Authentication
POST   /api/v1/auth/login
POST   /api/v1/auth/register  
POST   /api/v1/auth/refresh
DELETE /api/v1/auth/logout

# User Management
GET    /api/v1/user/profile
PUT    /api/v1/user/profile
DELETE /api/v1/user/account

# Email Accounts
GET    /api/v1/accounts                    # List user's email accounts
POST   /api/v1/accounts                    # Add new email account
GET    /api/v1/accounts/:id                # Get account details
PUT    /api/v1/accounts/:id                # Update account
DELETE /api/v1/accounts/:id                # Delete account
POST   /api/v1/accounts/:id/test           # Test connection

# OAuth Flow
GET    /api/v1/auth/gmail/authorize        # Start Gmail OAuth
GET    /api/v1/auth/gmail/callback         # Gmail OAuth callback
GET    /api/v1/auth/office365/authorize    # Start Office365 OAuth
GET    /api/v1/auth/office365/callback     # Office365 OAuth callback

# Sync Operations
POST   /api/v1/accounts/:id/sync           # Start sync
GET    /api/v1/accounts/:id/sync/status    # Get sync status
DELETE /api/v1/accounts/:id/sync           # Cancel sync

# Email Operations
GET    /api/v1/accounts/:id/emails         # List emails (paginated)
GET    /api/v1/accounts/:id/emails/:msgid  # Get email detail
GET    /api/v1/accounts/:id/emails/:msgid/raw # Get raw email (.eml)
GET    /api/v1/accounts/:id/emails/:msgid/attachments/:attid # Download attachment

# Folders
GET    /api/v1/accounts/:id/folders        # List folders

# Search  
GET    /api/v1/search?q=query&account=:id  # Search emails

# Statistics
GET    /api/v1/accounts/:id/stats          # Account statistics
GET    /api/v1/user/stats                  # User overall statistics
```

### WebSocket for Real-time Updates
```
ws://localhost:8080/ws/sync/:account_id
```

---

## 📅 Geliştirme Roadmap

### Faz 1: Temel Altyapı (1-2 hafta)
- [ ] Go backend kurulumu (Gin + GORM)
- [ ] PostgreSQL database setup ve migrations
- [ ] MinIO kurulumu ve connection
- [ ] JWT authentication sistemi
- [ ] Temel API endpoints (auth, user management)
- [ ] React frontend kurulumu
- [ ] Basic routing ve layout

### Faz 2: Gmail Entegrasyonu (1-2 hafta)  
- [ ] Gmail OAuth2 flow implementasyonu
- [ ] IMAP client kurulumu (go-imap)
- [ ] XOAUTH2 SASL authentication
- [ ] Gmail email sync servisi
- [ ] Email JSON format ve MinIO storage
- [ ] Frontend Gmail account bağlama UI

### Faz 3: Email Görüntüleme (1 hafta)
- [ ] Email listeleme API ve UI
- [ ] Email detay görüntüleme
- [ ] Attachment download
- [ ] Basic search functionality
- [ ] Pagination ve filtering

### Faz 4: Office 365 Entegrasyonu (2 hafta)
- [ ] Azure AD app registration
- [ ] Microsoft Graph SDK integration
- [ ] Office 365 OAuth2 flow
- [ ] Graph API email sync
- [ ] Frontend Office365 account setup

### Faz 5: Exchange Legacy Support (1 hafta)
- [ ] EWS client implementation
- [ ] Exchange server discovery
- [ ] NTLM authentication
- [ ] Exchange sync servisi

### Faz 6: Sync Engine İyileştirmeler (1 hafta)
- [ ] Parallel sync (goroutines)
- [ ] Incremental sync
- [ ] Error handling ve retry logic
- [ ] Sync progress tracking
- [ ] Real-time WebSocket updates

### Faz 7: UI/UX İyileştirmeler (1 hafta)
- [ ] Office 365 design system
- [ ] Responsive design
- [ ] Advanced search filters
- [ ] Bulk operations
- [ ] Keyboard shortcuts

### Faz 8: Testing ve Stabilizasyon (1 hafta)
- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance optimizations
- [ ] Error handling improvements
- [ ] Documentation completion

---

## 🧪 Testing Stratejisi

### Unit Tests
```go
// Test structure
backend/
├── internal/
│   ├── providers/
│   │   ├── gmail/
│   │   │   ├── client_test.go
│   │   │   └── auth_test.go
│   │   └── office365/
│   │       └── client_test.go
│   ├── services/
│   │   ├── email_service_test.go
│   │   └── sync_service_test.go
│   └── storage/
│       └── email_storage_test.go
```

### Integration Tests
- Database operations
- MinIO storage operations  
- Email provider connections (with mock servers)
- API endpoints (with test database)

### E2E Tests
- Complete OAuth flows
- Full sync operations
- Frontend user journeys

### Test Data
```
testdata/
├── emails/
│   ├── sample_gmail.json
│   ├── sample_office365.json
│   └── sample_exchange.json
├── raw_emails/
│   ├── simple.eml
│   ├── with_attachments.eml
│   └── multipart.eml
└── configs/
    ├── test_gmail_config.json
    └── test_office365_config.json
```

---

## 💻 Windows Lokal Deployment

### Sistem Gereksinimleri
- Windows 10/11
- Go 1.21+
- Node.js 18+ (frontend için)
- PostgreSQL 14+
- Git

### Kurulum Adımları

#### 1. PostgreSQL Kurulumu
```batch
REM PostgreSQL installer download
REM https://www.postgresql.org/download/windows/

REM Database oluşturma
createdb -U postgres emailbackup
psql -U postgres -d emailbackup -f scripts/setup_db.sql
```

#### 2. MinIO Kurulumu
```batch
REM MinIO Windows binary download
wget https://dl.min.io/server/minio/release/windows-amd64/minio.exe

REM MinIO başlatma scripti
REM scripts/start_minio.bat
set MINIO_ROOT_USER=minioadmin
set MINIO_ROOT_PASSWORD=minioadmin
minio.exe server ./minio-data --address ":9000" --console-address ":9001"
```

#### 3. Backend Kurulumu
```batch
REM Dependency kurulumu
go mod download

REM Environment variables
copy .env.example .env
REM .env dosyasını düzenle

REM Database migrations
go run cmd/main.go migrate

REM Backend başlatma
go run cmd/main.go server
```

#### 4. Frontend Kurulumu
```batch
cd frontend
npm install
npm start
```

#### 5. Development Scripts
```batch
REM scripts/dev_setup.bat
@echo off
echo Setting up Email Backup Project...

echo Starting PostgreSQL...
net start postgresql-x64-14

echo Starting MinIO...  
start /B minio.exe server ./minio-data --address ":9000" --console-address ":9001"

echo Starting Backend...
cd backend
start /B go run cmd/main.go server

echo Starting Frontend...
cd ../frontend  
start /B npm start

echo All services started!
echo Backend: http://localhost:8080
echo Frontend: http://localhost:3000
echo MinIO Console: http://localhost:9001
```

---

## 📚 GitHub Research Notları

### Önemli Bulgular
1. **EWS Deprecation**: Microsoft EWS'yi deprecated etti, Graph API kullanılmalı
2. **OAuth2 Zorunluluğu**: Gmail ve Office365 için OAuth2 şart (Basic auth deprecated)
3. **XOAUTH2 Format**: Gmail IMAP için özel SASL format gerekli
4. **Token Security**: OAuth tokens şifrelenmeli ve güvenli saklanmalı

### Proven Patterns
- **Mbox + Index**: Email backup için `.mbox` + `.idx` index pattern
- **Directory Structure**: `user/account/folder/year/month/` hiyerarşisi
- **Provider Interface**: Pluggable provider architecture
- **Goroutine Sync**: Paralel email senkronizasyonu için goroutines

### Önerilen Kütüphaneler
- `github.com/emersion/go-imap/v2`: Modern IMAP client
- `github.com/microsoftgraph/msgraph-sdk-go`: Official Graph SDK
- `golang.org/x/oauth2`: Standard OAuth2 implementation
- `github.com/minio/minio-go/v7`: MinIO client

### Dikkat Edilecek Hususlar
- Gmail IMAP rate limiting (250 request/user/second)
- Office365 throttling limits  
- Exchange server version compatibility
- Token refresh mechanisms
- Large attachment handling

---

## 🛡️ Hata Önleme ve Kod Kalitesi Stratejileri

### 1. Clean Architecture ve Design Patterns

#### **Katmanlı Mimari**
```go
// Dependency injection ile loose coupling
type EmailService struct {
    repo     Repository
    storage  StorageService
    logger   Logger
    config   Config
}

// Interface segregation - küçük, focused interfaces
type EmailReader interface {
    GetEmails(ctx context.Context, folder string) ([]Email, error)
}

type EmailWriter interface {
    SaveEmail(ctx context.Context, email Email) error
}
```

#### **Repository Pattern**
```go
// Database operations abstraction
type EmailRepository interface {
    Create(ctx context.Context, email *EmailIndex) error
    GetByMessageID(ctx context.Context, messageID string) (*EmailIndex, error)
    List(ctx context.Context, filter EmailFilter) ([]EmailIndex, error)
}

// Mock implementation for testing
type MockEmailRepository struct{}
```

### 2. Type Safety ve Validation

#### **Strict Typing**
```go
// Custom types for domain concepts
type MessageID string
type ProviderType string
type FolderName string

// Value objects with validation
type EmailAddress struct {
    value string
}

func NewEmailAddress(email string) (EmailAddress, error) {
    if !isValidEmail(email) {
        return EmailAddress{}, ErrInvalidEmail
    }
    return EmailAddress{value: email}, nil
}
```

#### **Input Validation**
```go
// Gin binding with validation tags
type CreateAccountRequest struct {
    Provider    ProviderType `json:"provider" binding:"required,oneof=gmail office365 exchange imap"`
    Email       string       `json:"email" binding:"required,email"`
    DisplayName string       `json:"display_name" binding:"required,max=100"`
}

// Custom validators
func validateProviderConfig(sl validator.StructLevel) {
    config := sl.Current().Interface().(AuthConfig)
    // Provider-specific validation logic
}
```

### 3. Error Handling Patterns

#### **Structured Error Types**
```go
// Custom error types
type EmailError struct {
    Type      string    `json:"type"`
    Message   string    `json:"message"`
    Details   map[string]interface{} `json:"details,omitempty"`
    Timestamp time.Time `json:"timestamp"`
    TraceID   string    `json:"trace_id"`
}

// Error constants
var (
    ErrAuthenticationFailed = &EmailError{Type: "auth_failed"}
    ErrConnectionTimeout    = &EmailError{Type: "connection_timeout"}
    ErrRateLimitExceeded   = &EmailError{Type: "rate_limit"}
)
```

#### **Error Wrapping ve Context**
```go
// Error context preservation
func (s *GmailProvider) Connect(ctx context.Context) error {
    if err := s.authenticate(ctx); err != nil {
        return fmt.Errorf("gmail authentication failed for %s: %w", 
            s.config.Email, err)
    }
    
    if err := s.testConnection(ctx); err != nil {
        return fmt.Errorf("gmail connection test failed: %w", err)
    }
    
    return nil
}
```

### 4. Context ve Timeout Management

#### **Context Propagation**
```go
// Her external call için context
func (s *SyncService) SyncAccount(ctx context.Context, accountID string) error {
    // Timeout kontrolü
    if ctx.Err() != nil {
        return ctx.Err()
    }
    
    // Child context with timeout
    syncCtx, cancel := context.WithTimeout(ctx, 30*time.Minute)
    defer cancel()
    
    return s.performSync(syncCtx, accountID)
}

// Graceful shutdown
func (s *Server) Shutdown(ctx context.Context) error {
    // Active sync'leri cancel et
    s.syncService.CancelAllSyncs()
    
    // Server'ı kapat
    return s.httpServer.Shutdown(ctx)
}
```

### 5. Database Safety

#### **Transaction Management**
```go
// Atomic operations
func (r *EmailRepository) SaveEmailWithAttachments(ctx context.Context, 
    email *EmailIndex, attachments []Attachment) error {
    
    return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
        if err := tx.Create(email).Error; err != nil {
            return fmt.Errorf("failed to save email: %w", err)
        }
        
        for _, att := range attachments {
            att.EmailID = email.ID
            if err := tx.Create(&att).Error; err != nil {
                return fmt.Errorf("failed to save attachment: %w", err)
            }
        }
        
        return nil
    })
}
```

#### **SQL Injection Prevention**
```go
// Parameterized queries (GORM otomatik yapar)
// Raw queries için manual escaping
func (r *EmailRepository) SearchEmails(ctx context.Context, query string) ([]EmailIndex, error) {
    var emails []EmailIndex
    
    // Safe parameterized query
    err := r.db.WithContext(ctx).
        Where("subject ILIKE ? OR sender_email ILIKE ?", 
            "%"+query+"%", "%"+query+"%").
        Find(&emails).Error
    
    return emails, err
}
```

### 6. Storage ve Encryption Safety

#### **MinIO Operations**
```go
// Atomic file operations
func (s *EmailStorage) SaveEmail(ctx context.Context, email *Email) error {
    // Temporary file first
    tempPath := s.getTempPath(email.MessageID)
    finalPath := s.getFinalPath(email.MessageID)
    
    // Write to temp
    if err := s.writeToMinIO(ctx, tempPath, email); err != nil {
        return fmt.Errorf("failed to write temp file: %w", err)
    }
    
    // Atomic move
    if err := s.moveInMinIO(ctx, tempPath, finalPath); err != nil {
        s.cleanupTemp(ctx, tempPath)
        return fmt.Errorf("failed to move file: %w", err)
    }
    
    return nil
}
```

#### **Token Encryption**
```go
// Secure token handling
type TokenManager struct {
    encryptionKey []byte
    cipher        cipher.AEAD
}

func (tm *TokenManager) EncryptToken(token string) (string, error) {
    nonce := make([]byte, tm.cipher.NonceSize())
    if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
        return "", fmt.Errorf("failed to generate nonce: %w", err)
    }
    
    encrypted := tm.cipher.Seal(nonce, nonce, []byte(token), nil)
    return base64.StdEncoding.EncodeToString(encrypted), nil
}
```

### 7. Rate Limiting ve Circuit Breaker

#### **Provider-Specific Rate Limiting**
```go
// Gmail rate limiter (250 req/user/second)
type RateLimiter struct {
    limiters map[string]*rate.Limiter
    mu       sync.RWMutex
}

func (rl *RateLimiter) Allow(userID string) bool {
    rl.mu.RLock()
    limiter, exists := rl.limiters[userID]
    rl.mu.RUnlock()
    
    if !exists {
        rl.mu.Lock()
        limiter = rate.NewLimiter(rate.Limit(200), 200) // 200 req/sec buffer
        rl.limiters[userID] = limiter
        rl.mu.Unlock()
    }
    
    return limiter.Allow()
}
```

#### **Circuit Breaker Pattern**
```go
// External service failure protection
type CircuitBreaker struct {
    maxFailures int
    failures    int
    lastFailTime time.Time
    state       CircuitState
    mu          sync.RWMutex
}

func (cb *CircuitBreaker) Execute(fn func() error) error {
    if !cb.canExecute() {
        return ErrCircuitOpen
    }
    
    err := fn()
    cb.onResult(err)
    return err
}
```

### 8. Logging ve Monitoring

#### **Structured Logging**
```go
// Consistent log format
type Logger struct {
    logger *zerolog.Logger
}

func (l *Logger) SyncStarted(accountID, provider string) {
    l.logger.Info().
        Str("event", "sync_started").
        Str("account_id", accountID).
        Str("provider", provider).
        Time("timestamp", time.Now()).
        Msg("email sync started")
}

func (l *Logger) SyncError(accountID string, err error) {
    l.logger.Error().
        Str("event", "sync_error").
        Str("account_id", accountID).
        Err(err).
        Time("timestamp", time.Now()).
        Msg("email sync failed")
}
```

#### **Health Checks**
```go
// Service health monitoring
type HealthChecker struct {
    db      *gorm.DB
    minio   *minio.Client
    cache   *redis.Client
}

func (hc *HealthChecker) Check(ctx context.Context) HealthStatus {
    status := HealthStatus{Status: "healthy"}
    
    // Database check
    if err := hc.db.WithContext(ctx).Exec("SELECT 1").Error; err != nil {
        status.Status = "unhealthy"
        status.Errors = append(status.Errors, "database: "+err.Error())
    }
    
    // MinIO check
    if _, err := hc.minio.ListBuckets(ctx); err != nil {
        status.Status = "unhealthy"  
        status.Errors = append(status.Errors, "minio: "+err.Error())
    }
    
    return status
}
```

### 9. Testing Strategy

#### **Test Doubles**
```go
// Mock implementations for testing
type MockEmailProvider struct {
    emails []Email
    errors map[string]error
}

func (m *MockEmailProvider) GetEmails(ctx context.Context, folder string) ([]Email, error) {
    if err, exists := m.errors[folder]; exists {
        return nil, err
    }
    return m.emails, nil
}

// Test factories
func NewTestEmail() *Email {
    return &Email{
        MessageID: "test@example.com",
        Subject:   "Test Email",
        From:      Contact{Email: "sender@test.com"},
    }
}
```

#### **Integration Test Setup**
```go
// Test database setup
func SetupTestDB(t *testing.T) *gorm.DB {
    db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
    require.NoError(t, err)
    
    // Auto migrate for tests
    err = db.AutoMigrate(&EmailIndex{}, &EmailAccount{}, &User{})
    require.NoError(t, err)
    
    return db
}
```

### 10. Security Best Practices

#### **API Security**
```go
// Rate limiting middleware
func RateLimitMiddleware(limiter *RateLimiter) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID := getUserID(c)
        if !limiter.Allow(userID) {
            c.JSON(http.StatusTooManyRequests, gin.H{
                "error": "rate limit exceeded"})
            c.Abort()
            return
        }
        c.Next()
    }
}

// Input sanitization
func SanitizeInput(input string) string {
    // HTML escape
    escaped := html.EscapeString(input)
    // SQL injection prevention (additional to parameterized queries)
    return strings.ReplaceAll(escaped, "'", "''")
}
```

#### **Secrets Management**
```go
// Environment-based secrets
type Config struct {
    JWTSecret      string `mapstructure:"JWT_SECRET" validate:"required,min=32"`
    EncryptionKey  string `mapstructure:"ENCRYPTION_KEY" validate:"required,len=32"`
    GmailClientID  string `mapstructure:"GMAIL_CLIENT_ID"`
}

// No secrets in logs
func (c AuthConfig) String() string {
    return fmt.Sprintf("AuthConfig{Provider: %s, Email: %s, HasToken: %t}",
        c.Provider, c.Email, c.AccessToken != "")
}
```

### 11. Performance Optimization

#### **Connection Pooling**
```go
// Database connection pool
func NewDatabase(config DatabaseConfig) (*gorm.DB, error) {
    db, err := gorm.Open(postgres.Open(config.DSN), &gorm.Config{
        Logger: logger.Default.LogMode(logger.Silent),
    })
    if err != nil {
        return nil, err
    }
    
    sqlDB, err := db.DB()
    if err != nil {
        return nil, err
    }
    
    // Connection pool settings
    sqlDB.SetMaxIdleConns(10)
    sqlDB.SetMaxOpenConns(100)
    sqlDB.SetConnMaxLifetime(time.Hour)
    
    return db, nil
}
```

#### **Memory Management**
```go
// Large file streaming
func (s *EmailStorage) StreamLargeEmail(ctx context.Context, path string) (io.ReadCloser, error) {
    // Stream instead of loading into memory
    object, err := s.minio.GetObject(ctx, s.bucket, path, minio.GetObjectOptions{})
    if err != nil {
        return nil, fmt.Errorf("failed to get object: %w", err)
    }
    
    return object, nil
}
```

### 12. Configuration Management

#### **Environment-based Config**
```go
type Config struct {
    Database DatabaseConfig `mapstructure:"database"`
    MinIO    MinIOConfig    `mapstructure:"minio"`
    Providers ProvidersConfig `mapstructure:"providers"`
}

func LoadConfig() (*Config, error) {
    viper.SetConfigName("config")
    viper.SetConfigType("yaml")
    viper.AddConfigPath(".")
    viper.AutomaticEnv()
    
    if err := viper.ReadInConfig(); err != nil {
        return nil, fmt.Errorf("failed to read config: %w", err)
    }
    
    var config Config
    if err := viper.Unmarshal(&config); err != nil {
        return nil, fmt.Errorf("failed to unmarshal config: %w", err)
    }
    
    if err := validateConfig(&config); err != nil {
        return nil, fmt.Errorf("invalid config: %w", err)
    }
    
    return &config, nil
}
```

---

## 📖 Referanslar

### Resmi Dokümantasyonlar
- [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/)
- [Gmail API](https://developers.google.com/gmail/api)
- [IMAP RFC](https://tools.ietf.org/html/rfc3501)
- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)

### GitHub Repositories
- [mlnoga/go-imap-backup](https://github.com/mlnoga/go-imap-backup)
- [aler9/howto-gmail-imap-oauth2](https://github.com/aler9/howto-gmail-imap-oauth2)  
- [emersion/go-imap](https://github.com/emersion/go-imap)
- [microsoftgraph/msgraph-sdk-go](https://github.com/microsoftgraph/msgraph-sdk-go)

### Teknik Makaleler  
- [XOAUTH2 SASL Mechanism](https://developers.google.com/gmail/imap/xoauth2-protocol)
- [Exchange Web Services Deprecation](https://techcommunity.microsoft.com/t5/exchange-team-blog/retirement-of-basic-authentication-in-exchange-online/ba-p/3609437)

---

**Son Güncellenme**: 2024-01-15  
**Versiyon**: 1.0  
**Durum**: Planlama Tamamlandı ✅