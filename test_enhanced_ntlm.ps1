# Test Enhanced NTLM Exchange Implementation
Write-Host "Testing Enhanced NTLM Exchange Implementation..." -ForegroundColor Cyan

Set-Location backend

Write-Host "`nBuilding application with enhanced NTLM..." -ForegroundColor Yellow
go build -o email-backend-enhanced.exe .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green

Write-Host "`nStarting server..." -ForegroundColor Yellow
$process = Start-Process -FilePath ".\email-backend-enhanced.exe" -PassThru -NoNewWindow -RedirectStandardOutput "server-output.log" -RedirectStandardError "server-error.log"

Write-Host "Server PID: $($process.Id)" -ForegroundColor Cyan
Write-Host "Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "`n=== BASIC TESTS ===" -ForegroundColor Magenta

Write-Host "`nTesting health endpoint..." -ForegroundColor Blue
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:8081/health" -Method GET -TimeoutSec 10
    Write-Host "✅ Health endpoint works!" -ForegroundColor Green
} catch {
    Write-Host "❌ Health endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTesting basic NTLM connection..." -ForegroundColor Blue
try {
    $ntlmResponse = Invoke-RestMethod -Uri "http://localhost:8081/test/exchange-ntlm" -Method GET -TimeoutSec 30
    Write-Host "✅ Basic NTLM test works!" -ForegroundColor Green
    Write-Host "Status: $($ntlmResponse.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Basic NTLM test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== ENHANCED EMAIL FETCH TEST ===" -ForegroundColor Magenta

Write-Host "`nTesting enhanced NTLM email fetch..." -ForegroundColor Blue
try {
    $emailResponse = Invoke-RestMethod -Uri "http://localhost:8081/test/exchange-fetch-emails" -Method GET -TimeoutSec 60
    Write-Host "✅ Enhanced email fetch test works!" -ForegroundColor Green
    Write-Host "Status: $($emailResponse.status)" -ForegroundColor Green
    Write-Host "Message: $($emailResponse.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ Enhanced email fetch test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    
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

Write-Host "`n=== SERVER LOGS ===" -ForegroundColor Magenta

Write-Host "`nServer output (last 30 lines):" -ForegroundColor Yellow
try {
    Get-Content "server-output.log" -Tail 30 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
} catch {
    Write-Host "  No output file found" -ForegroundColor Gray
}

Write-Host "`nServer errors (last 30 lines):" -ForegroundColor Yellow
try {
    Get-Content "server-error.log" -Tail 30 | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
} catch {
    Write-Host "  No error file found" -ForegroundColor Gray
}

Write-Host "`nStopping server..." -ForegroundColor Yellow
try {
    Stop-Process -Id $process.Id -Force
    Write-Host "✅ Server stopped" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Could not stop server cleanly" -ForegroundColor Yellow
}

# Clean up
Remove-Item "server-output.log" -ErrorAction SilentlyContinue
Remove-Item "server-error.log" -ErrorAction SilentlyContinue

Set-Location ..
Write-Host "`n🎉 Enhanced NTLM test completed!" -ForegroundColor Cyan