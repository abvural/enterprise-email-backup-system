# Test Storage API endpoints

Write-Host "Testing Storage API Endpoints" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

# Login to get token
Write-Host "`n1. Logging in..." -ForegroundColor Yellow
$loginData = @{
    email = "admin@emailbackup.com"
    password = "Admin123!"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:8081/auth/login" -Method POST -Body $loginData -ContentType "application/json"
$token = $loginResponse.token

if ($token) {
    Write-Host "✅ Login successful, token obtained" -ForegroundColor Green
} else {
    Write-Host "❌ Login failed" -ForegroundColor Red
    exit 1
}

# Test storage total endpoint
Write-Host "`n2. Testing /api/storage/total..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    $storageResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/storage/total" -Method GET -Headers $headers
    Write-Host "✅ Storage total endpoint works!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    $storageResponse | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Storage total endpoint failed: $_" -ForegroundColor Red
}

# Test storage accounts endpoint
Write-Host "`n3. Testing /api/storage/accounts..." -ForegroundColor Yellow
try {
    $accountsResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/storage/accounts" -Method GET -Headers $headers
    Write-Host "✅ Storage accounts endpoint works!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    $accountsResponse | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Storage accounts endpoint failed: $_" -ForegroundColor Red
}

# Test recalculate endpoint
Write-Host "`n4. Testing /api/storage/recalculate-all..." -ForegroundColor Yellow
try {
    $recalcResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/storage/recalculate-all" -Method POST -Headers $headers
    Write-Host "✅ Recalculate endpoint works!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    $recalcResponse | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Recalculate endpoint failed: $_" -ForegroundColor Red
}

Write-Host "`n==============================" -ForegroundColor Cyan
Write-Host "Test completed!" -ForegroundColor Cyan