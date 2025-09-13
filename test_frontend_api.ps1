# PowerShell script to test frontend API calls
Write-Host "Testing Frontend Storage Statistics Integration" -ForegroundColor Green

# Test 1: Login to get authentication token
Write-Host "`n1. Testing login..." -ForegroundColor Yellow
try {
    $loginData = @{
        email = "admin@emailbackup.com"
        password = "Admin123!"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8081/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    $authToken = $loginResponse.token
    Write-Host "✓ Login successful, token received" -ForegroundColor Green
    
    # Set up headers for authenticated requests
    $headers = @{
        "Authorization" = "Bearer $authToken"
        "Content-Type" = "application/json"
    }
    
    # Test 2: Get accounts
    Write-Host "`n2. Testing /api/accounts..." -ForegroundColor Yellow
    try {
        $accountsResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/accounts" -Method GET -Headers $headers
        $accountCount = $accountsResponse.accounts.Count
        Write-Host "✓ Accounts endpoint working: $accountCount accounts found" -ForegroundColor Green
        
        # Test 3: Test storage endpoint (should return 404)
        Write-Host "`n3. Testing /api/storage/total (should fail with 404)..." -ForegroundColor Yellow
        try {
            $storageResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/storage/total" -Method GET -Headers $headers
            Write-Host "✗ Unexpected: Storage endpoint returned data" -ForegroundColor Red
        } catch {
            if ($_.Exception.Response.StatusCode -eq 404) {
                Write-Host "✓ Expected 404 - Storage endpoint not available" -ForegroundColor Green
                
                # Test 4: Simulate frontend mock data
                Write-Host "`n4. Simulating frontend mock data generation..." -ForegroundColor Yellow
                
                function Format-Bytes($bytes) {
                    if ($bytes -eq 0) { return "0 B" }
                    $k = 1024
                    $sizes = @("B", "KB", "MB", "GB", "TB", "PB")
                    $i = [Math]::Floor([Math]::Log($bytes) / [Math]::Log($k))
                    $value = [Math]::Round($bytes / [Math]::Pow($k, $i), 1)
                    return "$value $($sizes[$i])"
                }
                
                $mockStats = @{
                    total_emails = $accountCount * 150
                    total_size = $accountCount * 524288000
                    content_size = $accountCount * 419430400
                    attachment_size = $accountCount * 104857600
                    attachment_count = $accountCount * 25
                    total_accounts = $accountCount
                    last_calculated = "mock-data-" + (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                    formatted = @{
                        total_size = Format-Bytes($accountCount * 524288000)
                        content_size = Format-Bytes($accountCount * 419430400)
                        attachment_size = Format-Bytes($accountCount * 104857600)
                    }
                }
                
                Write-Host "✓ Mock storage stats generated:" -ForegroundColor Green
                Write-Host "  - Accounts: $($mockStats.total_accounts)" -ForegroundColor Cyan
                Write-Host "  - Total Emails: $($mockStats.total_emails)" -ForegroundColor Cyan
                Write-Host "  - Total Size: $($mockStats.formatted.total_size)" -ForegroundColor Cyan
                Write-Host "  - Content Size: $($mockStats.formatted.content_size)" -ForegroundColor Cyan
                Write-Host "  - Attachments: $($mockStats.attachment_count) ($($mockStats.formatted.attachment_size))" -ForegroundColor Cyan
                Write-Host "  - Is Mock: $($mockStats.last_calculated.Contains('mock-data'))" -ForegroundColor Cyan
                
            } else {
                Write-Host "✗ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        
        # Test 5: Test recalculate endpoint (should fail with 404)
        Write-Host "`n5. Testing /api/storage/recalculate-all (should fail with 404)..." -ForegroundColor Yellow
        try {
            $recalcResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/storage/recalculate-all" -Method POST -Headers $headers
            Write-Host "✗ Unexpected: Recalculate endpoint returned data" -ForegroundColor Red
        } catch {
            if ($_.Exception.Response.StatusCode -eq 404) {
                Write-Host "✓ Expected 404 - Recalculate endpoint not available" -ForegroundColor Green
                Write-Host "✓ Frontend should show 'Refresh' button and use mock data" -ForegroundColor Green
            } else {
                Write-Host "✗ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        
    } catch {
        Write-Host "✗ Accounts endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure backend is running on port 8081" -ForegroundColor Yellow
}

Write-Host "`n=== Summary ===" -ForegroundColor Green
Write-Host "Frontend should now:" -ForegroundColor White
Write-Host "1. Show 'Estimated data - Storage API not available' message" -ForegroundColor Yellow
Write-Host "2. Display mock storage statistics based on account count" -ForegroundColor Yellow
Write-Host "3. Show 'Refresh' button instead of 'Recalculate'" -ForegroundColor Yellow
Write-Host "4. Handle 404 errors gracefully without crashing" -ForegroundColor Yellow

Write-Host "`nFrontend URL: http://localhost:5180" -ForegroundColor Cyan
Write-Host "Test credentials: admin@emailbackup.com / Admin123!" -ForegroundColor Cyan