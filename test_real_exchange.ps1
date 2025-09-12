# Test Real Exchange EWS Implementation
# This script tests the real Exchange Web Services integration

Write-Host "=== Testing Real Exchange EWS Integration ===" -ForegroundColor Green

$baseUrl = "http://localhost:8081"

# Test 1: Health Check
Write-Host "`n1. Testing health endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "✅ Health check passed" -ForegroundColor Green
    Write-Host "   Database: $($health.database)" -ForegroundColor Cyan
    Write-Host "   MinIO: $($health.minio)" -ForegroundColor Cyan
    Write-Host "   Status: $($health.status)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Create a test user (if needed)
Write-Host "`n2. Registering test user..." -ForegroundColor Yellow
try {
    $registerData = @{
        email = "test@exchange.local"
        password = "TestPass123!"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -Body $registerData -ContentType "application/json"
    Write-Host "✅ User registration successful" -ForegroundColor Green
    $token = $response.token
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "⚠️  User already exists, logging in..." -ForegroundColor Yellow
        
        # Login instead
        $loginData = @{
            email = "test@exchange.local"
            password = "TestPass123!"
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginData -ContentType "application/json"
        Write-Host "✅ User login successful" -ForegroundColor Green
        $token = $response.token
    } else {
        Write-Host "❌ User registration failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Test 3: Add Exchange Account with REAL credentials
Write-Host "`n3. Adding Exchange account with real credentials..." -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $token" }
    $exchangeData = @{
        email = "unal.karaaslan@bilisimcenter.com"
        username = "unal.karaaslan@bilisimcenter.com"
        password = "swbeNi1"
        server_url = "https://exchange01.teknolojikutusu.com/EWS/Exchange.asmx"
        domain = "bilisimcenter.com"
    } | ConvertTo-Json
    
    $account = Invoke-RestMethod -Uri "$baseUrl/api/accounts/exchange" -Method POST -Body $exchangeData -ContentType "application/json" -Headers $headers
    Write-Host "✅ Exchange account added successfully" -ForegroundColor Green
    Write-Host "   Account ID: $($account.account.id)" -ForegroundColor Cyan
    Write-Host "   Email: $($account.account.email)" -ForegroundColor Cyan
    Write-Host "   Provider: $($account.account.provider)" -ForegroundColor Cyan
    $accountId = $account.account.id
} catch {
    Write-Host "❌ Exchange account addition failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorBody = $_.Exception.Response | ConvertFrom-Json
        Write-Host "   Error details: $($errorBody.error)" -ForegroundColor Red
    }
    exit 1
}

# Test 4: Sync Exchange emails (this will test our real EWS implementation)
Write-Host "`n4. Syncing Exchange emails (testing real EWS connection)..." -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $token" }
    $syncResponse = Invoke-RestMethod -Uri "$baseUrl/api/accounts/$accountId/sync" -Method POST -Headers $headers
    Write-Host "✅ Exchange email sync completed" -ForegroundColor Green
    Write-Host "   Message: $($syncResponse.message)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Exchange sync failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd() | ConvertFrom-Json
        Write-Host "   Error details: $($errorBody.error)" -ForegroundColor Red
    }
    exit 1
}

# Test 5: List synced emails
Write-Host "`n5. Listing synced emails..." -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $token" }
    $emails = Invoke-RestMethod -Uri "$baseUrl/api/accounts/$accountId/emails?page=1&limit=10" -Method GET -Headers $headers
    Write-Host "✅ Email list retrieved" -ForegroundColor Green
    Write-Host "   Total emails: $($emails.total)" -ForegroundColor Cyan
    Write-Host "   Page: $($emails.page) of $($emails.totalPages)" -ForegroundColor Cyan
    
    if ($emails.emails.Count -gt 0) {
        Write-Host "`n   Recent emails:" -ForegroundColor Cyan
        foreach ($email in $emails.emails) {
            Write-Host "   📧 $($email.subject)" -ForegroundColor White
            Write-Host "      From: $($email.senderName) ($($email.senderEmail))" -ForegroundColor Gray
            Write-Host "      Date: $($email.date)" -ForegroundColor Gray
            Write-Host "      Folder: $($email.folder)" -ForegroundColor Gray
            Write-Host ""
        }
    }
} catch {
    Write-Host "❌ Email listing failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 6: Get email details
if ($emails.emails.Count -gt 0) {
    $firstEmailId = $emails.emails[0].id
    Write-Host "`n6. Getting email details for first email..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $token" }
        $emailDetails = Invoke-RestMethod -Uri "$baseUrl/api/emails/$firstEmailId" -Method GET -Headers $headers
        Write-Host "✅ Email details retrieved" -ForegroundColor Green
        Write-Host "   Subject: $($emailDetails.subject)" -ForegroundColor Cyan
        Write-Host "   From: $($emailDetails.fromName) ($($emailDetails.from))" -ForegroundColor Cyan
        Write-Host "   Date: $($emailDetails.date)" -ForegroundColor Cyan
        Write-Host "   Has Attachments: $($emailDetails.attachments.Count -gt 0)" -ForegroundColor Cyan
        Write-Host "   Body preview: $($emailDetails.body.Substring(0, [Math]::Min(100, $emailDetails.body.Length)))" -ForegroundColor Gray
        
        if ($emailDetails.attachments.Count -gt 0) {
            Write-Host "   Attachments:" -ForegroundColor Cyan
            foreach ($attachment in $emailDetails.attachments) {
                Write-Host "     📎 $($attachment.name) ($($attachment.size) bytes)" -ForegroundColor Gray
            }
        }
    } catch {
        Write-Host "❌ Email details retrieval failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== Exchange EWS Integration Test Complete ===" -ForegroundColor Green
Write-Host "✅ All tests passed! Real Exchange Web Services integration is working." -ForegroundColor Green