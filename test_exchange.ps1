# Exchange Integration Test Script
Write-Host "Testing Exchange Integration" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# First register and get token
Write-Host "1. Registering test user..." -ForegroundColor Yellow
$registerBody = @{
    email = "testexchange@example.com"
    password = "123456"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-WebRequest -Uri "http://localhost:8081/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    $registerData = $registerResponse.Content | ConvertFrom-Json
    $token = $registerData.token
    Write-Host "✅ User registered successfully!" -ForegroundColor Green
    
    # Test adding Exchange account
    Write-Host ""
    Write-Host "2. Adding Exchange account..." -ForegroundColor Yellow
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $exchangeBody = @{
        email = "unal.karaaslan@bilisimcenter.com"
        password = "swbeNi1"
        server_url = "https://exchange01.teknolojikutusu.com/EWS/Exchange.asmx"
        domain = "bilisimcenter.com"
        username = "unal.karaaslan@bilisimcenter.com"
    } | ConvertTo-Json
    
    $exchangeResponse = Invoke-WebRequest -Uri "http://localhost:8081/api/accounts/exchange" -Method POST -Body $exchangeBody -ContentType "application/json" -Headers $headers
    Write-Host "✅ Exchange account added successfully!" -ForegroundColor Green
    
    $exchangeData = $exchangeResponse.Content | ConvertFrom-Json
    $accountId = $exchangeData.account.id
    Write-Host "Account ID: $accountId" -ForegroundColor White
    
    # Test getting accounts
    Write-Host ""
    Write-Host "3. Getting user accounts..." -ForegroundColor Yellow
    $accountsResponse = Invoke-WebRequest -Uri "http://localhost:8081/api/accounts" -Method GET -Headers $headers
    Write-Host "✅ Accounts retrieved successfully!" -ForegroundColor Green
    Write-Host "Response: $($accountsResponse.Content)" -ForegroundColor White
    
    # Test email sync
    Write-Host ""
    Write-Host "4. Starting Exchange email sync..." -ForegroundColor Yellow
    $syncResponse = Invoke-WebRequest -Uri "http://localhost:8081/api/accounts/$accountId/sync" -Method POST -Headers $headers
    Write-Host "✅ Exchange email sync completed successfully!" -ForegroundColor Green
    
    # Test getting emails
    Write-Host ""
    Write-Host "5. Getting Exchange emails..." -ForegroundColor Yellow
    $emailsResponse = Invoke-WebRequest -Uri "http://localhost:8081/api/accounts/$accountId/emails" -Method GET -Headers $headers
    Write-Host "✅ Exchange emails retrieved successfully!" -ForegroundColor Green
    Write-Host "Response: $($emailsResponse.Content)" -ForegroundColor White
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Yellow
    }
}