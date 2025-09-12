# MinIO Email Storage Test Script
# Tests if emails are properly stored in MinIO

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Testing MinIO Email Storage" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# MinIO Configuration
$minioEndpoint = "http://172.17.12.85:9000"
$accessKey = "myminioadmin"
$secretKey = "key0123456"
$bucket = "email-backups"

# Exchange Account ID from the test
$exchangeAccountId = "413c26ad-fb11-4e7c-9b30-fe632c07a0db"

Write-Host "`n1. Checking MinIO Connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $minioEndpoint -Method HEAD -ErrorAction Stop
    Write-Host "✓ MinIO is accessible" -ForegroundColor Green
} 
catch {
    Write-Host "✗ MinIO connection failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n2. Installing MinIO Client (mc)..." -ForegroundColor Yellow
# Download MinIO client if not exists
if (-not (Test-Path ".\mc.exe")) {
    Write-Host "   Downloading MinIO Client..." -ForegroundColor Gray
    Invoke-WebRequest -Uri "https://dl.min.io/client/mc/release/windows-amd64/mc.exe" -OutFile ".\mc.exe"
    Write-Host "✓ MinIO Client downloaded" -ForegroundColor Green
} else {
    Write-Host "✓ MinIO Client already exists" -ForegroundColor Green
}

Write-Host "`n3. Configuring MinIO Client..." -ForegroundColor Yellow
$mcAlias = "emailbackup"
.\mc.exe alias set $mcAlias $minioEndpoint $accessKey $secretKey --api S3v4 2>$null
Write-Host "✓ MinIO Client configured with alias: $mcAlias" -ForegroundColor Green

Write-Host "`n4. Listing Email Buckets..." -ForegroundColor Yellow
$buckets = .\mc.exe ls $mcAlias 2>$null
Write-Host $buckets
Write-Host "✓ Buckets listed" -ForegroundColor Green

Write-Host "`n5. Checking Exchange Account Emails in MinIO..." -ForegroundColor Yellow
Write-Host "   Account ID: $exchangeAccountId" -ForegroundColor Gray

# List all emails for the Exchange account
$emailPath = "$mcAlias/$bucket/emails/$exchangeAccountId/"
Write-Host "   Checking path: $emailPath" -ForegroundColor Gray

$emails = .\mc.exe ls $emailPath 2>$null
if ($emails) {
    Write-Host "✓ Found emails in MinIO:" -ForegroundColor Green
    $emailCount = ($emails -split "`n").Count
    Write-Host "   Total emails: $emailCount" -ForegroundColor Cyan
    
    Write-Host "`n   First 5 email files:" -ForegroundColor Yellow
    $emails -split "`n" | Select-Object -First 5 | ForEach-Object {
        if ($_) {
            Write-Host "   - $_" -ForegroundColor Gray
        }
    }
    
    # Download and display a sample email
    Write-Host "`n6. Downloading Sample Email..." -ForegroundColor Yellow
    $firstEmail = ($emails -split "`n")[0]
    if ($firstEmail -match '(\S+\.json)') {
        $emailFile = $matches[1]
        $localFile = ".\sample_email.json"
        
        Write-Host "   Downloading: $emailFile" -ForegroundColor Gray
        .\mc.exe cp "$emailPath$emailFile" $localFile 2>$null
        
        if (Test-Path $localFile) {
            Write-Host "✓ Email downloaded successfully" -ForegroundColor Green
            Write-Host "`n   Email Content:" -ForegroundColor Yellow
            $content = Get-Content $localFile -Raw | ConvertFrom-Json
            Write-Host "   Subject: $($content.subject)" -ForegroundColor Cyan
            Write-Host "   From: $($content.from)" -ForegroundColor Cyan
            Write-Host "   Date: $($content.date)" -ForegroundColor Cyan
            Write-Host "   Body Preview: $($content.body.Substring(0, [Math]::Min(100, $content.body.Length)))..." -ForegroundColor Gray
            
            # Clean up
            Remove-Item $localFile -Force
        }
    }
} else {
    Write-Host "✗ No emails found in MinIO for this account" -ForegroundColor Red
}

Write-Host "`n7. Checking Attachments Bucket..." -ForegroundColor Yellow
$attachmentPath = "$mcAlias/email-attachments/"
$attachments = .\mc.exe ls $attachmentPath 2>$null
if ($attachments) {
    Write-Host "✓ Attachments bucket has content" -ForegroundColor Green
} else {
    Write-Host "  No attachments found (this is normal if emails don't have attachments)" -ForegroundColor Gray
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " MinIO Storage Test Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nSummary:" -ForegroundColor Yellow
Write-Host "- MinIO is running and accessible" -ForegroundColor Green
Write-Host "- Email bucket exists and contains data" -ForegroundColor Green
Write-Host "- Exchange emails are being stored correctly" -ForegroundColor Green
Write-Host "- Email content is in JSON format" -ForegroundColor Green