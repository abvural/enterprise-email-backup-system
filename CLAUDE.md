# CLAUDE.md - Enterprise Email Backup System

Bu dosya Claude Code'a Enterprise Email Backup System projesi hakkında rehberlik sağlar.

## 📌 PROJE HAKKINDA

**Enterprise Email Backup System**, kurumsal email yedekleme ve arşivleme çözümüdür. Gmail ve Exchange hesaplarından emailleri otomatik olarak yedekler, MinIO object storage'da saklar ve web arayüzü üzerinden erişim sağlar.

### 🎯 Temel Özellikler
- **Çoklu Email Provider Desteği**: Gmail (IMAP), Exchange (EWS), Office 365 (Graph API), Yahoo, Outlook.com, Custom IMAP
- **Güvenli Yedekleme**: MinIO S3-compatible object storage
- **OAuth2 Authentication**: Office 365, Yahoo ve Outlook.com için modern authentication
- **Incremental Sync**: İlk sync'ten sonra sadece yeni emailleri alır (100x performans)
- **Real-time Progress**: Server-Sent Events (SSE) ile canlı sync durumu
- **Modern Web Arayüzü**: React + TypeScript + Chakra UI
- **Enterprise Security**: JWT authentication, OAuth2, 7 günlük token süresi
- **PostgreSQL Database**: Hızlı arama ve indexleme

## 🚨 KRİTİK GELİŞTİRME KURALLARI

### ⚠️ EN ÖNEMLİ KURAL
**DİKKATLİ VE YAVAS İLERLE** - Acele etmeden, her adımı kontrol ederek ilerle
- Her kod parçasını yazdıktan sonra kontrol et
- Test et, çalıştır, doğrula
- Hata varsa düzelt, sonra devam et
- **Kaliteli kod yaz, hızlı değil**

### 🎯 MVP Odağı
- **Sadece çalışan bir proje** hedefi
- Gmail IMAP + Exchange EWS + Office 365 Graph API + Yahoo/Outlook IMAP + PostgreSQL + MinIO
- OAuth2 authentication desteği
- Gereksiz karmaşıklık ekleme
- Her feature test edilmeli

## 📋 BAĞLANTI BİLGİLERİ

### PostgreSQL (Dedicated Database)
```
Host: 172.25.1.148
Port: 5432  
User: postgres
Password: avural1234
Database: email_backup_mvp
```

### MinIO (Object Storage)
```
Endpoint: 172.17.12.85:9000
Access Key: myminioadmin
Secret Key: key0123456
Buckets: email-backups, email-attachments
```

### Gmail IMAP (Test Account)
```
Server: imap.gmail.com:993 (SSL)
Username: avuralvural7@gmail.com
App Password: cuohuikvrzatmyeh
```

### Exchange EWS (Test Account)  
```
EWS URL: https://exchange01.teknolojikutusu.com/EWS/Exchange.asmx
Username: unal.karaaslan@bilisimcenter.com
Password: swbeNi1
Domain: bilisimcenter.com
```

## 🏗️ PROJE YAPISI

### Backend (Go + Gin)
```
backend/
├── main.go                 # Entry point
├── config/
│   └── config.go          # Environment config
├── models/
│   ├── user.go           # User model
│   ├── email_account.go  # Email accounts
│   └── email_index.go    # Email metadata
├── handlers/
│   ├── auth.go           # Authentication
│   ├── accounts.go       # Email account management
│   └── emails.go         # Email operations
├── services/
│   ├── gmail_v1.go       # Gmail IMAP client
│   ├── exchange.go       # Exchange EWS client
│   ├── office365.go      # Office 365 Graph API client
│   ├── imap_general.go   # General IMAP client (Yahoo, Outlook, Custom)
│   └── storage.go        # MinIO operations
└── database/
    └── init_database.sql # DB schema
```

### Frontend (React + TypeScript)
```
frontend/
├── src/
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── EmailList.tsx
│   │   └── EmailDetail.tsx
│   ├── components/
│   │   └── common/
│   └── services/
│       └── api.ts
└── package.json
```

## 📊 DATABASE SCHEMA

### Database Tabloları
```sql
-- Users (authentication)
users (id, email, password_hash, created_at)

-- Email accounts (Gmail, Exchange, Office365, Yahoo, Outlook, Custom IMAP)  
email_accounts (id, user_id, provider, email, credentials, last_sync_date, imap_server, imap_port, security, auth_method, provider_settings, created_at)

-- Email index (fast search)
email_index (id, account_id, message_id, subject, sender, date, minio_path, has_attachments, attachment_count, folder)

-- OAuth tokens (OAuth2 authentication)
oauth_tokens (id, account_id, access_token, refresh_token, expires_at, token_type, scope, created_at, updated_at)
```

## 🔧 ENVIRONMENT VARIABLES

### .env Template
```env
# Database
DB_HOST=172.25.1.148
DB_PORT=5432
DB_USER=postgres  
DB_PASSWORD=avural1234
DB_NAME=email_backup_mvp

# MinIO
MINIO_ENDPOINT=172.17.12.85:9000
MINIO_ACCESS_KEY=myminioadmin
MINIO_SECRET_KEY=key0123456

# Gmail IMAP
GMAIL_IMAP_SERVER=imap.gmail.com
GMAIL_IMAP_PORT=993
GMAIL_USERNAME=avuralvural7@gmail.com
GMAIL_APP_PASSWORD=cuohuikvrzatmyeh

# Exchange EWS
EXCHANGE_SERVER_URL=https://exchange01.teknolojikutusu.com/EWS/Exchange.asmx
EXCHANGE_USERNAME=unal.karaaslan@bilisimcenter.com
EXCHANGE_PASSWORD=swbeNi1
EXCHANGE_DOMAIN=bilisimcenter.com

# Server
PORT=8080
GIN_MODE=debug
JWT_SECRET=EmailBackupMVP2025SecretKey!
```

## 📈 DEVELOPMENT WORKFLOW

### Phase 1: Backend Foundation ✅ TAMAMLANDI
1. ✅ Project structure created
2. ✅ Go module initialization  
3. ✅ PostgreSQL connection & schema
4. ✅ MinIO connection test
5. ✅ Basic auth (JWT)

### Phase 2: Email Integration ✅ TAMAMLANDI
1. ✅ Gmail IMAP client implementation
2. ✅ Exchange EWS client implementation  
3. ✅ Email sync services
4. ✅ MinIO storage operations
5. ✅ Incremental sync optimization

### Phase 3: Frontend ✅ TAMAMLANDI
1. ✅ React project setup
2. ✅ Authentication UI
3. ✅ Dashboard with account list
4. ✅ Email list and detail views
5. ✅ Real-time sync progress modal
6. ✅ Responsive design

## ⚠️ ÖNEMLİ HATIRLATMALAR

### Test Edilen Bağlantılar
- ✅ PostgreSQL: 172.25.1.148:5432 (Çalışıyor)
- ✅ MinIO: 172.17.12.85:9000 (Çalışıyor)
- ✅ Gmail IMAP: Başarıyla test edildi
- ✅ Exchange EWS: NTLM auth ile çalışıyor

### Son Yapılan Geliştirmeler (Ocak 2025)
- ✅ Sync Progress Modal entegrasyonu tamamlandı
- ✅ SSE (Server-Sent Events) ile real-time sync takibi
- ✅ Token authentication sorunları çözüldü
- ✅ Incremental sync implementasyonu (100x performans artışı)
- ✅ LastSyncDate tracking ve optimizasyonu
- ✅ Playwright E2E test altyapısı kuruldu
- ✅ GitHub repository oluşturuldu ve production-ready hale getirildi
- ✅ Duplicate email detection sistemi
- ✅ Exchange EWS date filtering desteği
- ✅ **Office 365 desteği eklendi** (Microsoft Graph API)
- ✅ **Yahoo Mail desteği eklendi** (IMAP + App Password)
- ✅ **Outlook.com desteği eklendi** (IMAP + OAuth2)
- ✅ **Custom IMAP server desteği eklendi**
- ✅ **OAuth2/XOAUTH2 authentication implementasyonu**
- ✅ **Provider configuration sistemi kuruldu**

### YapılMAyacaklar
- ❌ Complex email parsing
- ❌ Real-time sync (MVP'de manual sync)
- ❌ Advanced search (Basic search yeterli)
- ❌ Email compose/send (Sadece backup)

## 🎯 SUCCESS CRITERIA

MVP başarılı sayılacak eğer:
1. ✅ Kullanıcı giriş yapabilir
2. ✅ Gmail hesabını bağlayabilir (IMAP)
3. ✅ Exchange hesabını bağlayabilir (EWS)
4. ✅ Office 365 hesabını bağlayabilir (Graph API)
5. ✅ Yahoo Mail hesabını bağlayabilir (IMAP)
6. ✅ Outlook.com hesabını bağlayabilir (IMAP)
7. ✅ Custom IMAP server bağlayabilir
8. ✅ Email'leri senkronize edebilir (tüm provider'lar için)
9. ✅ Email listesini görüntüleyebilir
10. ✅ Email detayını okuyabilir
11. ✅ Attachment'ları indirebilir

---

## 📚 REFERENCE DOCUMENTS

- **MVP_PLAN.md**: Detaylı proje planı
- **backend/init_database.sql**: Database schema
- **test_postgresql.ps1**: PostgreSQL connection test
- **test_minio.ps1**: MinIO connection test

---

## 🚀 ÇALIŞTIRMA TALİMATLARI

### Backend Başlatma
```bash
cd backend
go build -o email-backend-fixed.exe main.go
./email-backend-fixed.exe
# Port: 8081
```

### Frontend Başlatma
```bash
cd frontend
npm install
npm run dev
# Port: 5173
```

### Test Credentials
- **Admin User**: admin@emailbackup.com / Admin123!
- **Exchange Test**: unal.karaaslan@bilisimcenter.com
- **Gmail Test**: avuralvural7@gmail.com

## 🔍 ÖNEMLİ NOTLAR

### Incremental Sync Çalışma Mantığı
1. **İlk Sync**: Tüm emailleri alır, LastSyncDate kaydeder
2. **Sonraki Sync'ler**: Sadece LastSyncDate'ten sonraki emailleri alır
3. **Performans**: 10,000 email için ilk sync 45dk, sonraki sync'ler 30sn

### Token Management
- JWT token `auth_token` key'i ile localStorage'da saklanır
- Token süresi: 7 gün
- SSE bağlantıları query parameter ile token alır

### GitHub Repository
- **URL**: https://github.com/abvural/enterprise-email-backup-system
- **Branch**: master
- **CI/CD**: GitHub Actions ready

---

**Son Güncelleme**: 13 Ocak 2025  
**Versiyon**: Production v2.0  
**Status**: ✅ Production Ready with Multi-Provider Support

**UNUTMA: DİKKATLİ VE YAVAS İLERLE!** ⚠️