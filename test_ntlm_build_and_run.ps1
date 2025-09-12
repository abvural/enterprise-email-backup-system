# Build and Test NTLM Exchange Implementation
Write-Host "Building and Testing NTLM Exchange Implementation..." -ForegroundColor Cyan

$backendDir = "backend"
$executable = "email-backend.exe"

# Change to backend directory
Set-Location $backendDir

Write-Host "`nBuilding Go application..." -ForegroundColor Yellow
try {
    # Build the application
    go build -o $executable .
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ Build failed!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Build error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`nStarting server in background..." -ForegroundColor Yellow
try {
    # Start the server in background
    $job = Start-Job -ScriptBlock { 
        Set-Location $using:PWD
        & ".\$using:executable"
    }
    
    Write-Host "✅ Server started (Job ID: $($job.Id))" -ForegroundColor Green
    Write-Host "Waiting for server to initialize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    # Test health endpoint
    Write-Host "`nTesting health endpoint..." -ForegroundColor Blue
    try {
        $healthResponse = Invoke-RestMethod -Uri "http://localhost:8081/health" -Method GET -TimeoutSec 10
        Write-Host "✅ Health check successful!" -ForegroundColor Green
        Write-Host "Status: $($healthResponse.status)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Server might not be ready yet..." -ForegroundColor Yellow
    }
    
    # Test NTLM Exchange endpoint
    Write-Host "`nTesting NTLM Exchange endpoint..." -ForegroundColor Blue
    try {
        $ntlmResponse = Invoke-RestMethod -Uri "http://localhost:8081/test/exchange-ntlm" -Method GET -TimeoutSec 30
        Write-Host "✅ NTLM Exchange test successful!" -ForegroundColor Green
        Write-Host "Status: $($ntlmResponse.status)" -ForegroundColor Green
        Write-Host "Message: $($ntlmResponse.message)" -ForegroundColor Green
        
        if ($ntlmResponse.config) {
            Write-Host "Configuration:" -ForegroundColor Cyan
            Write-Host "  Server: $($ntlmResponse.config.server)" -ForegroundColor Cyan
            Write-Host "  Username: $($ntlmResponse.config.username)" -ForegroundColor Cyan
            Write-Host "  Domain: $($ntlmResponse.config.domain)" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "❌ NTLM Exchange test failed: $($_.Exception.Message)" -ForegroundColor Red
        
        # Try to get more details from the response
        if ($_.Exception.Response) {
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $responseBody = $reader.ReadToEnd()
                Write-Host "Response body: $responseBody" -ForegroundColor Yellow
            } catch {
                Write-Host "Could not read response details" -ForegroundColor Yellow
            }
        }
    }
    
    Write-Host "`nChecking server logs..." -ForegroundColor Blue
    $jobOutput = Receive-Job -Job $job -Keep
    if ($jobOutput) {
        Write-Host "Server output:" -ForegroundColor Cyan
        $jobOutput | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    }
    
} finally {
    Write-Host "`nCleaning up..." -ForegroundColor Yellow
    
    # Stop the background job
    if ($job) {
        Stop-Job -Job $job -PassThru | Remove-Job
        Write-Host "✅ Server stopped" -ForegroundColor Green
    }
    
    # Clean up executable if needed
    # Remove-Item $executable -ErrorAction SilentlyContinue
}

Write-Host "`n🎉 NTLM Exchange test completed!" -ForegroundColor Cyan
Set-Location ..