# Gmail Integration Test Script
Write-Host "Testing Gmail Integration" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

# First register and get token
Write-Host "1. Registering test user..." -ForegroundColor Yellow
$registerBody = @{
    email = "testgmail@example.com"
    password = "123456"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-WebRequest -Uri "http://localhost:8081/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    $registerData = $registerResponse.Content | ConvertFrom-Json
    $token = $registerData.token
    Write-Host "✅ User registered successfully!" -ForegroundColor Green
    
    # Test adding Gmail account
    Write-Host ""
    Write-Host "2. Adding Gmail account..." -ForegroundColor Yellow
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $gmailBody = @{
        email = "avuralvural7@gmail.com"
        password = "cuohuikvrzatmyeh"
    } | ConvertTo-Json
    
    $gmailResponse = Invoke-WebRequest -Uri "http://localhost:8081/api/accounts/gmail" -Method POST -Body $gmailBody -ContentType "application/json" -Headers $headers
    Write-Host "✅ Gmail account added successfully!" -ForegroundColor Green
    
    $gmailData = $gmailResponse.Content | ConvertFrom-Json
    $accountId = $gmailData.account.id
    Write-Host "Account ID: $accountId" -ForegroundColor White
    
    # Test getting accounts
    Write-Host ""
    Write-Host "3. Getting user accounts..." -ForegroundColor Yellow
    $accountsResponse = Invoke-WebRequest -Uri "http://localhost:8081/api/accounts" -Method GET -Headers $headers
    Write-Host "✅ Accounts retrieved successfully!" -ForegroundColor Green
    Write-Host "Response: $($accountsResponse.Content)" -ForegroundColor White
    
    # Test email sync
    Write-Host ""
    Write-Host "4. Starting email sync..." -ForegroundColor Yellow
    $syncResponse = Invoke-WebRequest -Uri "http://localhost:8081/api/accounts/$accountId/sync" -Method POST -Headers $headers
    Write-Host "✅ Email sync completed successfully!" -ForegroundColor Green
    
    # Test getting emails
    Write-Host ""
    Write-Host "5. Getting emails..." -ForegroundColor Yellow
    $emailsResponse = Invoke-WebRequest -Uri "http://localhost:8081/api/accounts/$accountId/emails" -Method GET -Headers $headers
    Write-Host "✅ Emails retrieved successfully!" -ForegroundColor Green
    Write-Host "Response: $($emailsResponse.Content)" -ForegroundColor White
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Yellow
    }
}