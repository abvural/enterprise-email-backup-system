# Test Exchange NTLM endpoint manually
Write-Host "Testing Exchange NTLM endpoint manually..." -ForegroundColor Cyan

Write-Host "`nTesting health endpoint first..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:8081/health" -Method GET -TimeoutSec 10
    Write-Host "✅ Health endpoint works!" -ForegroundColor Green
    Write-Host "Response: $($healthResponse | ConvertTo-Json)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Health endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`nTesting NTLM Exchange endpoint..." -ForegroundColor Yellow
try {
    $ntlmResponse = Invoke-RestMethod -Uri "http://localhost:8081/test/exchange-ntlm" -Method GET -TimeoutSec 30 -Verbose
    Write-Host "✅ NTLM Exchange endpoint works!" -ForegroundColor Green
    Write-Host "Response: $($ntlmResponse | ConvertTo-Json)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ NTLM Exchange endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    
    # Try to get response details
    if ($_.Exception.Response) {
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response body: $responseBody" -ForegroundColor Yellow
        } catch {
            Write-Host "Could not read response body" -ForegroundColor Yellow
        }
    }
}

Write-Host "`nTesting with curl if available..." -ForegroundColor Yellow
try {
    $curlOutput = curl -s "http://localhost:8081/test/exchange-ntlm"
    Write-Host "Curl output: $curlOutput" -ForegroundColor Cyan
} catch {
    Write-Host "Curl not available or failed" -ForegroundColor Yellow
}

Write-Host "`n✅ Manual test completed!" -ForegroundColor Green