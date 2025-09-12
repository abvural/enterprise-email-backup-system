# Manual build and test
Write-Host "Manual build and test..." -ForegroundColor Cyan

Set-Location backend

Write-Host "Building application..." -ForegroundColor Yellow
go build -v -o email-backend-test.exe .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green

Write-Host "`nStarting server..." -ForegroundColor Yellow
$process = Start-Process -FilePath ".\email-backend-test.exe" -PassThru -NoNewWindow -RedirectStandardOutput "server-output.log" -RedirectStandardError "server-error.log"

Write-Host "Server PID: $($process.Id)" -ForegroundColor Cyan
Write-Host "Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "`nTesting health endpoint..." -ForegroundColor Blue
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:8081/health" -Method GET -TimeoutSec 10
    Write-Host "✅ Health endpoint works!" -ForegroundColor Green
} catch {
    Write-Host "❌ Health endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTesting Exchange NTLM endpoint..." -ForegroundColor Blue
try {
    $ntlmResponse = Invoke-RestMethod -Uri "http://localhost:8081/test/exchange-ntlm" -Method GET -TimeoutSec 30
    Write-Host "✅ NTLM endpoint works!" -ForegroundColor Green
    Write-Host "Response: $($ntlmResponse | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ NTLM endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
}

Write-Host "`nServer output:" -ForegroundColor Yellow
try {
    Get-Content "server-output.log" | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
} catch {
    Write-Host "  No output file found" -ForegroundColor Gray
}

Write-Host "`nServer errors:" -ForegroundColor Yellow
try {
    Get-Content "server-error.log" | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
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
Write-Host "`n🎉 Manual test completed!" -ForegroundColor Cyan