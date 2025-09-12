# PostgreSQL Bağlantı Test Script
Write-Host "PostgreSQL Bağlantı Testi" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

$Host_IP = "172.25.1.148"
$Port = "5432"
$User = "postgres"
$Password = "avural1234"

Write-Host "Bağlantı Bilgileri:" -ForegroundColor Yellow
Write-Host "  Host: $Host_IP" 
Write-Host "  Port: $Port"
Write-Host "  User: $User"
Write-Host ""

# Test network connectivity
Write-Host "1. Network bağlantısı test ediliyor..." -ForegroundColor Yellow
$testConnection = Test-NetConnection -ComputerName $Host_IP -Port $Port

if ($testConnection.TcpTestSucceeded) {
    Write-Host "✅ Port $Port açık ve erişilebilir!" -ForegroundColor Green
} else {
    Write-Host "❌ Port $Port'a erişilemiyor!" -ForegroundColor Red
    Write-Host "Lütfen PostgreSQL servisinin çalıştığından ve firewall ayarlarından emin olun." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "2. PostgreSQL bağlantısı için SQL script oluşturuluyor..." -ForegroundColor Yellow

# Create database script
$sqlScript = @"
-- Check PostgreSQL version
SELECT version();

-- Create database if not exists
SELECT 'CREATE DATABASE email_backup_mvp'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'email_backup_mvp');

-- List existing databases
SELECT datname FROM pg_database WHERE datistemplate = false;
"@

$sqlScript | Out-File -FilePath "check_postgres.sql" -Encoding UTF8

Write-Host "✅ SQL script oluşturuldu: check_postgres.sql" -ForegroundColor Green
Write-Host ""
Write-Host "PostgreSQL'e bağlanmak için:" -ForegroundColor Cyan
Write-Host "  psql -h $Host_IP -p $Port -U $User" -ForegroundColor White
Write-Host "  Password: $Password" -ForegroundColor White
Write-Host ""
Write-Host "Veya pgAdmin/DBeaver gibi bir GUI tool kullanabilirsiniz." -ForegroundColor Yellow