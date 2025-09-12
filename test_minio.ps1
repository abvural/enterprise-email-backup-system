# MinIO Bağlantı Test Script
Write-Host "MinIO Bağlantı Testi" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host ""

$MinIO_Endpoint = "172.17.12.85:9000"
$Access_Key = "myminioadmin"
$Secret_Key = "key0123456"

Write-Host "Bağlantı Bilgileri:" -ForegroundColor Yellow
Write-Host "  Endpoint: $MinIO_Endpoint"
Write-Host "  Access Key: $Access_Key"
Write-Host "  Secret Key: $Secret_Key"
Write-Host ""

# Test network connectivity first
Write-Host "1. Network bağlantısı test ediliyor..." -ForegroundColor Yellow
$Host_IP = "172.17.12.85"
$Port = "9000"

$testConnection = Test-NetConnection -ComputerName $Host_IP -Port $Port

if ($testConnection.TcpTestSucceeded) {
    Write-Host "✅ Port $Port açık ve erişilebilir!" -ForegroundColor Green
} else {
    Write-Host "❌ Port $Port'a erişilemiyor!" -ForegroundColor Red
    Write-Host "MinIO servisinin çalıştığından emin olun." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "2. MinIO HTTP endpoint testi..." -ForegroundColor Yellow

try {
    # MinIO health check endpoint
    $response = Invoke-WebRequest -Uri "http://$MinIO_Endpoint/minio/health/live" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ MinIO servisi çalışıyor!" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ MinIO health check başarısız, ancak port açık" -ForegroundColor Yellow
    Write-Host "MinIO Console'a erişebilirsiniz:" -ForegroundColor Cyan
    Write-Host "  http://$MinIO_Endpoint" -ForegroundColor White
}

Write-Host ""
Write-Host "3. MinIO Console erişimi:" -ForegroundColor Yellow
Write-Host "  URL: http://$MinIO_Endpoint" -ForegroundColor White
Write-Host "  Access Key: $Access_Key" -ForegroundColor White
Write-Host "  Secret Key: $Secret_Key" -ForegroundColor White
Write-Host ""
Write-Host "Browser'da yukarıdaki URL'i açarak MinIO Console'a giriş yapabilirsiniz." -ForegroundColor Green