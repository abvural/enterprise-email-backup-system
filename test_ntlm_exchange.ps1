# Test NTLM Exchange Connection
Write-Host "Testing NTLM Exchange Connection..." -ForegroundColor Cyan

# Exchange credentials
$exchangeUrl = "https://exchange01.teknolojikutusu.com/EWS/Exchange.asmx"
$username = "unal.karaaslan@bilisimcenter.com"
$domain = "bilisimcenter.com"

Write-Host "Exchange Server: $exchangeUrl" -ForegroundColor Yellow
Write-Host "Username: $username" -ForegroundColor Yellow
Write-Host "Domain: $domain" -ForegroundColor Yellow

# Create authentication test
Write-Host "`nTesting different authentication methods..." -ForegroundColor Green

# Test 1: Basic connectivity check
Write-Host "`n1. Testing basic connectivity..." -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri $exchangeUrl -Method POST -TimeoutSec 30 -UseBasicParsing
    Write-Host "✅ Server is reachable" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Server connectivity failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Check if NTLM is supported
Write-Host "`n2. Checking authentication methods..." -ForegroundColor Blue
try {
    $credential = New-Object System.Management.Automation.PSCredential($username, (ConvertTo-SecureString "swbeNi1" -AsPlainText -Force))
    $response = Invoke-WebRequest -Uri $exchangeUrl -Method POST -Credential $credential -Authentication Basic -TimeoutSec 30 -UseBasicParsing
    Write-Host "✅ Basic Auth response: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Basic Auth failed: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "This is expected if NTLM is required" -ForegroundColor Yellow
}

# Test 3: Try with different username formats
Write-Host "`n3. Testing username formats..." -ForegroundColor Blue
$userFormats = @(
    "$domain\unal.karaaslan",
    "unal.karaaslan@$domain", 
    "unal.karaaslan",
    "$username"
)

foreach ($user in $userFormats) {
    Write-Host "Testing format: $user" -ForegroundColor Cyan
    try {
        $credential = New-Object System.Management.Automation.PSCredential($user, (ConvertTo-SecureString "swbeNi1" -AsPlainText -Force))
        $response = Invoke-WebRequest -Uri $exchangeUrl -Method POST -Credential $credential -TimeoutSec 30 -UseBasicParsing
        Write-Host "✅ Success with format: $user (Status: $($response.StatusCode))" -ForegroundColor Green
        break
    } catch {
        Write-Host "❌ Failed with format: $user - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n4. Creating SOAP test request..." -ForegroundColor Blue

$soapBody = @"
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" 
               xmlns:t="http://schemas.microsoft.com/exchange/services/2006/types" 
               xmlns:m="http://schemas.microsoft.com/exchange/services/2006/messages">
  <soap:Header>
  </soap:Header>
  <soap:Body>
    <m:FindItem Traversal="Shallow">
      <m:ItemShape>
        <t:BaseShape>IdOnly</t:BaseShape>
      </m:ItemShape>
      <m:ParentFolderIds>
        <t:DistinguishedFolderId Id="inbox"/>
      </m:ParentFolderIds>
    </m:FindItem>
  </soap:Body>
</soap:Envelope>
"@

Write-Host "Testing SOAP FindItem request..." -ForegroundColor Cyan

foreach ($user in $userFormats) {
    Write-Host "SOAP test with format: $user" -ForegroundColor Cyan
    try {
        $credential = New-Object System.Management.Automation.PSCredential($user, (ConvertTo-SecureString "swbeNi1" -AsPlainText -Force))
        $headers = @{
            "Content-Type" = "text/xml; charset=utf-8"
            "SOAPAction" = ""
            "User-Agent" = "PowerShell-Exchange-Test/1.0"
        }
        
        $response = Invoke-WebRequest -Uri $exchangeUrl -Method POST -Body $soapBody -Headers $headers -Credential $credential -TimeoutSec 30 -UseBasicParsing
        Write-Host "✅ SOAP Success with format: $user (Status: $($response.StatusCode))" -ForegroundColor Green
        Write-Host "Response length: $($response.Content.Length) bytes" -ForegroundColor Green
        
        # Check if response contains expected SOAP structure
        if ($response.Content -like "*FindItemResponse*") {
            Write-Host "✅ Valid SOAP response detected!" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Response doesn't contain expected SOAP structure" -ForegroundColor Yellow
        }
        break
    } catch {
        Write-Host "❌ SOAP failed with format: $user - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nNTLM Exchange test completed!" -ForegroundColor Cyan
Write-Host "Now testing with Go application..." -ForegroundColor Yellow