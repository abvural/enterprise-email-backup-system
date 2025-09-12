# Fix Go dependencies
Write-Host "Fixing Go dependencies..." -ForegroundColor Cyan

Set-Location backend

Write-Host "Running go mod tidy..." -ForegroundColor Yellow
try {
    go mod tidy
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependencies fixed!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to fix dependencies!" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nRunning go mod download..." -ForegroundColor Yellow
try {
    go mod download
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependencies downloaded!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to download dependencies!" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTrying to build..." -ForegroundColor Yellow
try {
    go build -o email-backend.exe .
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ Build failed!" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Build error: $($_.Exception.Message)" -ForegroundColor Red
}

Set-Location ..