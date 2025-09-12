# Email Yedekleme Projesi - MVP Plan

## 🎯 MVP Hedefi
**Sadece çalışan bir proje** - 1-2 haftada Gmail ve Exchange 2019 email'lerini yedekleyip görüntüleyebilen sistem.

## 📌 GERÇEK BAĞLANTI BİLGİLERİ

### ✅ Mevcut Altyapı
- **PostgreSQL**: 172.25.1.148:5432 (Yeni dedicated database)
  - User: postgres
  - Password: avural1234
  - Database: email_backup_mvp (oluşturulacak)
- **MinIO**: 172.17.12.85:9000 adresinde çalışıyor
  - Access Key: myminioadmin
  - Secret Key: key0123456

### 📧 Test Email Hesapları
- **Gmail IMAP**: avuralvural7@gmail.com
  - Username: avuralvural7@gmail.com
  - Password: cuohuikvrzatmyeh (16 karakterli app password)
  - IMAP Server: imap.gmail.com:993 (SSL)
- **Exchange EWS**: unal.karaaslan@bilisimcenter.com
  - Username: unal.karaaslan@bilisimcenter.com
  - Password: swbeNi1  
  - EWS URL: https://exchange01.teknolojikutusu.com/EWS/Exchange.asmx

---

## ⚡ MVP Kapsamı (Minimum)

### Backend
- **Go + Gin** framework
- **PostgreSQL** (3 tablo: users, email_accounts, email_index)
- **MinIO** temel storage
- **JWT** basit auth
- **Gmail IMAP** ve **Exchange 2019 EWS**
- Temel error handling

### Frontend
- **React.js** + TypeScript
- Basit modern UI
- Login/Register sayfası
- Gmail ve Exchange hesap bağlama
- Email listesi

### Özellikler
- ✅ Kullanıcı kayıt/giriş
- ✅ Gmail IMAP (App Password) ve Exchange EWS bağlantısı
- ✅ Temel email sync (IMAP + EWS)
- ✅ Email listeleme
- ✅ Attachment görüntüleme

---

## 🗃️ Minimal Database (PostgreSQL)

```sql
-- Kullanıcılar
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Email hesapları (Gmail + Exchange)
CREATE TABLE email_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    email VARCHAR(255) NOT NULL,
    provider VARCHAR(20), -- 'gmail' or 'exchange'
    -- Gmail OAuth2 fields
    access_token TEXT,
    refresh_token TEXT,
    -- Exchange EWS fields
    server_url VARCHAR(500),
    domain VARCHAR(100),
    username VARCHAR(255),
    password TEXT, -- encrypted
    -- Common fields
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Email index (hızlı arama için)
CREATE TABLE email_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES email_accounts(id),
    message_id VARCHAR(255) NOT NULL,
    subject TEXT,
    sender_email VARCHAR(255),
    sender_name VARCHAR(255),
    date TIMESTAMP,
    folder VARCHAR(50) DEFAULT 'INBOX',
    minio_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📁 Minimal Proje Yapısı

```
emailprojectv2/
├── backend/
│   ├── main.go                    # Entry point
│   ├── config/
│   │   └── config.go              # Env variables
│   ├── models/
│   │   ├── user.go
│   │   ├── email_account.go
│   │   └── email_index.go
│   ├── handlers/
│   │   ├── auth.go                # Login/register
│   │   ├── accounts.go            # Gmail bağlama
│   │   └── emails.go              # Email listesi
│   ├── services/
│   │   ├── auth.go
│   │   ├── gmail.go               # Gmail IMAP
│   │   ├── exchange.go            # Exchange EWS
│   │   └── storage.go             # MinIO
│   └── go.mod
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── EmailList.tsx
│   │   ├── components/
│   │   │   └── common/
│   │   ├── services/
│   │   │   └── api.ts
│   │   └── App.tsx
│   └── package.json
└── README.md
```

---

## 🔧 Minimal Go Dependencies

```go
// go.mod
module emailprojectv2

go 1.21

require (
    github.com/gin-gonic/gin v1.9.1
    gorm.io/gorm v1.25.5
    gorm.io/driver/postgres v1.5.4
    github.com/minio/minio-go/v7 v7.0.63
    github.com/golang-jwt/jwt/v5 v5.0.0
    golang.org/x/oauth2 v0.15.0
    github.com/emersion/go-imap/v2 v2.0.0-beta.1
    github.com/mhewedy/ews v1.0.1        # Exchange EWS
    github.com/google/uuid v1.4.0
    github.com/joho/godotenv v1.4.0
)
```

---

## 🚀 MVP API Endpoints (Minimal)

```
# Auth
POST /auth/register
POST /auth/login

# Gmail Account
POST /accounts/gmail/connect    # OAuth2 başlat
GET  /accounts/gmail/callback   # OAuth2 callback

# Exchange Account
POST /accounts/exchange/connect # EWS credentials
POST /accounts/exchange/test    # Test EWS connection

# Common
GET  /accounts                  # Bağlı hesapları listele

# Emails  
POST /accounts/:id/sync         # Gmail sync başlat
GET  /accounts/:id/emails       # Email listesi
GET  /emails/:id                # Email detayı
```

---

## ⚙️ Environment Variables (.env)

```env
# Database (YENİ DEDICATED POSTGRESQL)
DB_HOST=172.25.1.148
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=avural1234
DB_NAME=email_backup_mvp

# MinIO (MEVCUT KURULUM)
MINIO_ENDPOINT=172.17.12.85:9000
MINIO_ACCESS_KEY=myminioadmin
MINIO_SECRET_KEY=key0123456
MINIO_USE_SSL=false
MINIO_BUCKET_EMAILS=email-backups
MINIO_BUCKET_ATTACHMENTS=email-attachments

# JWT
JWT_SECRET=EmailBackupMVP2025SecretKey!
JWT_EXPIRY=24h

# Test Kullanıcıları (email-backup-saas'tan)
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=Test123456!
ADMIN_USER_EMAIL=admin@example.com
ADMIN_USER_PASSWORD=Admin123456!

# Gmail IMAP (APP PASSWORD - OAuth2 yerine)
GMAIL_IMAP_SERVER=imap.gmail.com
GMAIL_IMAP_PORT=993
GMAIL_IMAP_SSL=true
GMAIL_USERNAME=avuralvural7@gmail.com
GMAIL_APP_PASSWORD=cuohuikvrzatmyeh  # 16 karakterli app password

# Exchange EWS (GERÇEK HESAP BİLGİLERİ)
EXCHANGE_SERVER_URL=https://exchange01.teknolojikutusu.com/EWS/Exchange.asmx
EXCHANGE_DOMAIN=bilisimcenter.com
EXCHANGE_TEST_EMAIL=unal.karaaslan@bilisimcenter.com
EXCHANGE_USERNAME=unal.karaaslan@bilisimcenter.com
EXCHANGE_PASSWORD=swbeNi1

# Server
PORT=8080
GIN_MODE=debug  # Production'da "release" yapılacak
```

---

## 📅 MVP Development Steps

### Faz 1: Backend Temel (2 gün)
- [ ] Go project setup
- [ ] PostgreSQL connection (GORM)
- [ ] JWT auth (register/login)
- [ ] MinIO connection test

### Faz 2: Gmail Integration (2 gün)
- [ ] Gmail OAuth2 flow
- [ ] IMAP connection test
- [ ] Email fetch basic
- [ ] MinIO'ya JSON kaydetme

### Faz 3: Exchange 2019 Integration (2 gün)
- [ ] Exchange EWS client
- [ ] NTLM/Basic authentication
- [ ] Email fetch via EWS
- [ ] MinIO'ya JSON kaydetme

### Faz 4: Frontend Basic (2 gün)
- [ ] React setup
- [ ] Login/Register UI
- [ ] Dashboard layout
- [ ] Email list component

### Faz 5: Integration (1 gün)
- [ ] Frontend-backend bağlantısı
- [ ] Gmail account bağlama UI
- [ ] Email listesi gösterme

### Faz 6: Test & Fix (1 gün)
- [ ] End-to-end test
- [ ] Bug fixes
- [ ] Basic error handling

**Toplam: ~10-12 gün**

---

## 🔄 Email Provider Flows (Minimal)

### Gmail IMAP Flow (App Password)
```go
// 1. IMAP connection: imap.gmail.com:993 (SSL)
// 2. Login: avuralvural7@gmail.com / cuohuikvrzatmyeh
// 3. INBOX, SENT, DRAFTS folder'larını oku
// 4. Email'leri JSON'a çevir
// 5. MinIO'ya kaydet
// 6. PostgreSQL'e index kaydet
```

### Exchange EWS Flow
```go
// 1. EWS connection: https://exchange01.teknolojikutusu.com/EWS/Exchange.asmx
// 2. Basic authentication: unal.karaaslan@bilisimcenter.com / swbeNi1
// 3. EWS GetItem requests (Inbox, Sent, Drafts)
// 4. Email'leri JSON'a çevir
// 5. MinIO'ya kaydet
// 6. PostgreSQL'e index kaydet
```

---

## 📱 Frontend UI Flow (Minimal)

```
1. Login/Register
2. Dashboard (bağlı hesaplar)
3. "Gmail Hesabı Bağla" / "Exchange Hesabı Bağla" butonları
4. Gmail: OAuth2 popup/redirect | Exchange: Credentials form
5. Hesap eklendi
6. "Sync" butonu
7. Email listesi göster
8. Email detayına tıkla
```

---

## 🚫 MVP'de OLMAYACAKLAR (Sonra ekleriz)

### Email Providers
- ❌ Office 365
- ❌ Generic IMAP

### Features
- ❌ Real-time sync
- ❌ Advanced search
- ❌ Bulk operations
- ❌ Multiple folders
- ❌ Email compose/send

### Technical
- ❌ Rate limiting
- ❌ Circuit breaker
- ❌ Health checks
- ❌ Comprehensive testing
- ❌ WebSocket
- ❌ Advanced error handling
- ❌ Performance optimization

### UI/UX
- ❌ Advanced Office365 design
- ❌ Responsive mobile
- ❌ Keyboard shortcuts
- ❌ Drag & drop
- ❌ Dark mode

---

## ✅ MVP Success Criteria

1. **Kullanıcı kayıt olabilir**
2. **Gmail hesabını OAuth2 ile bağlayabilir**
3. **Exchange 2019 hesabını EWS ile bağlayabilir**
4. **Email'leri senkronize edebilir (Gmail + Exchange)**
5. **Email listesini görüntüleyebilir**
6. **Email detayını okuyabilir**
7. **Attachment'ları görüntüleyebilir**

**Bu 7 özellik çalışırsa MVP başarılı!**

---

## 🎯 Next Steps (MVP sonrası)

### V1.1
- Office365 desteği
- Multiple folder support
- Search functionality

### V1.2  
- Advanced UI components
- Performance optimization
- Multiple folder support

### V1.3
- Real-time sync
- Mobile responsive
- Comprehensive testing

---

## 🔗 KAYNAK PROJELER

### email-backup-saas Projesi
- **Lokasyon**: C:\Users\avural\Documents\Github\email-backup-saas
- **PostgreSQL**: Port 5435'te çalışıyor
- **Test Kullanıcıları**: Hazır ve test edilmiş
- **Docker Compose**: Backend servisleri için kullanılıyor

### Kullanılacak Bilgiler
1. **Database Schema**: email-backup-saas'tan adapt edilecek
2. **JWT Implementation**: Çalışan auth sistemi var
3. **Test Users**: Aynı kullanıcılar kullanılacak
4. **Docker Infrastructure**: PostgreSQL container'ı paylaşılacak

---

## 📝 ÖNEMLİ NOTLAR

### 🚨 GELİŞTİRME KURALLARI
⚠️ **DİKKATLİ VE YAVAS İLERLE** - Acele etmeden, her adımı kontrol ederek ilerle
- Her kod parçasını yazdıktan sonra kontrol et
- Test et, çalıştır, doğrula
- Hata varsa düzelt, sonra devam et
- Kaliteli kod yaz, hızlı değil

### Bağlantı Detayları
- **PostgreSQL**: 172.25.1.148:5432 (Yeni dedicated DB)
- **MinIO**: 172.17.12.85:9000 (myminioadmin/key0123456)
- **Frontend Port**: 3000 (React default)
- **Backend Port**: 8080 (Gin default)

### Öncelikler
1. ✅ PostgreSQL ve MinIO zaten çalışıyor ve test edildi
2. ✅ Gmail IMAP ve Exchange EWS credentials hazır
3. ✅ Tüm test hesapları mevcut
4. ⚠️ Her adımı dikkatli test ederek ilerle

---

**Odak: Sadece çalışan bir proje!** 🚀

**Mevcut Altyapı Kullanılacak - Gereksiz Kurulum Yok!**