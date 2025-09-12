# Auth Endpoint Test Script
Write-Host "Testing Auth Endpoints" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan

# Test registration
Write-Host "1. Testing user registration..." -ForegroundColor Yellow
$registerBody = @{
    email = "test@example.com"
    password = "123456"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-WebRequest -Uri "http://localhost:8081/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    Write-Host "✅ Registration successful!" -ForegroundColor Green
    Write-Host "Response: $($registerResponse.Content)" -ForegroundColor White
    
    # Parse token from response
    $registerData = $registerResponse.Content | ConvertFrom-Json
    $token = $registerData.token
    
    # Test login
    Write-Host ""
    Write-Host "2. Testing user login..." -ForegroundColor Yellow
    $loginBody = @{
        email = "test@example.com"
        password = "123456"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:8081/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "Response: $($loginResponse.Content)" -ForegroundColor White
    
    # Test protected endpoint
    Write-Host ""
    Write-Host "3. Testing protected endpoint..." -ForegroundColor Yellow
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $meResponse = Invoke-WebRequest -Uri "http://localhost:8081/api/me" -Method GET -Headers $headers
    Write-Host "✅ Protected endpoint successful!" -ForegroundColor Green
    Write-Host "Response: $($meResponse.Content)" -ForegroundColor White
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Yellow
    }
}