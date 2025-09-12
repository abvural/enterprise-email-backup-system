# CLAUDE.md - Email Backup MVP

Bu dosya Claude Code'a Email Backup MVP projesi hakkında rehberlik sağlar.

## 🚨 KRİTİK GELİŞTİRME KURALLARI

### ⚠️ EN ÖNEMLİ KURAL
**DİKKATLİ VE YAVAS İLERLE** - Acele etmeden, her adımı kontrol ederek ilerle
- Her kod parçasını yazdıktan sonra kontrol et
- Test et, çalıştır, doğrula
- Hata varsa düzelt, sonra devam et
- **Kaliteli kod yaz, hızlı değil**

### 🎯 MVP Odağı
- **Sadece çalışan bir proje** hedefi
- Gmail IMAP + Exchange EWS + PostgreSQL + MinIO
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
│   ├── gmail.go          # Gmail IMAP client
│   ├── exchange.go       # Exchange EWS client
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

### Minimal 3 Tablo
```sql
-- Users (authentication)
users (id, email, password_hash, created_at)

-- Email accounts (Gmail + Exchange)  
email_accounts (id, user_id, provider, email, credentials, created_at)

-- Email index (fast search)
email_index (id, account_id, message_id, subject, sender, date, minio_path)
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

### Phase 1: Backend Foundation (Current)
1. ✅ Project structure created
2. 🔄 Go module initialization  
3. ⏳ PostgreSQL connection & schema
4. ⏳ MinIO connection test
5. ⏳ Basic auth (JWT)

### Phase 2: Email Integration
1. Gmail IMAP client implementation
2. Exchange EWS client implementation  
3. Email sync services
4. MinIO storage operations

### Phase 3: Frontend  
1. React project setup
2. Authentication UI
3. Dashboard with account list
4. Email list and detail views

## ⚠️ ÖNEMLİ HATIRLATMALAR

### Test Edilen Bağlantılar
- ✅ PostgreSQL: 172.25.1.148:5432 (Port açık, erişilebilir)
- ✅ MinIO: 172.17.12.85:9000 (Servis çalışıyor)
- ⏳ Gmail IMAP: Test edilecek
- ⏳ Exchange EWS: Test edilecek

### Yapılacaklar Listesi  
- [ ] Go dependencies kurulumu
- [ ] Database schema oluşturma
- [ ] MinIO bucket setup
- [ ] Gmail IMAP connection test
- [ ] Exchange EWS connection test
- [ ] JWT authentication implementation

### YapılMAyacaklar
- ❌ OAuth2 (App Password kullanıyoruz)
- ❌ Complex email parsing
- ❌ Real-time sync (MVP'de manual sync)
- ❌ Advanced search (Basic search yeterli)
- ❌ Email compose/send (Sadece backup)

## 🎯 SUCCESS CRITERIA

MVP başarılı sayılacak eğer:
1. ✅ Kullanıcı giriş yapabilir
2. ✅ Gmail hesabını bağlayabilir (IMAP)
3. ✅ Exchange hesabını bağlayabilir (EWS)
4. ✅ Email'leri senkronize edebilir
5. ✅ Email listesini görüntüleyebilir
6. ✅ Email detayını okuyabilir
7. ✅ Attachment'ları indirebilir

---

## 📚 REFERENCE DOCUMENTS

- **MVP_PLAN.md**: Detaylı proje planı
- **backend/init_database.sql**: Database schema
- **test_postgresql.ps1**: PostgreSQL connection test
- **test_minio.ps1**: MinIO connection test

---

**Son Güncelleme**: Ocak 2025  
**Versiyon**: MVP v1.0  
**Status**: Development Phase 1 🚧

**UNUTMA: DİKKATLİ VE YAVAS İLERLE!** ⚠️