# Kite API Token Generator Script
$apiKey = "x6ia1wobnx0hkhmt"
$apiSecret = "04dxq0ypfqkowefqzaaiycl7ksqwpnv3"

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Kite API Token Generator" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Generate and open login URL
$loginUrl = "https://kite.zerodha.com/connect/login?api_key=$apiKey"
Write-Host "Step 1: Opening Kite login page..." -ForegroundColor Yellow
Write-Host "URL: $loginUrl" -ForegroundColor Gray
Start-Process $loginUrl

Write-Host ""
Write-Host "Please log in with your Zerodha credentials in the browser." -ForegroundColor Green
Write-Host ""
Write-Host "After login, you will be redirected to a URL like:" -ForegroundColor Yellow
Write-Host "http://127.0.0.1/?request_token=XXXXX&action=login&status=success" -ForegroundColor Gray
Write-Host ""

# Step 2: Get request token from user
$requestToken = Read-Host "Paste the complete redirected URL or just the request_token"

# Extract token if full URL was pasted
if ($requestToken -match "request_token=([^&]+)") {
    $requestToken = $Matches[1]
    Write-Host "Extracted request_token: $requestToken" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 2: Exchanging request_token for access_token..." -ForegroundColor Yellow

# Step 3: Exchange request token for access token using checksum
try {
    # Generate checksum: SHA256(api_key + request_token + api_secret)
    $checksumString = $apiKey + $requestToken + $apiSecret
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    $hashBytes = $sha256.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($checksumString))
    $checksum = ($hashBytes | ForEach-Object { $_.ToString("x2") }) -join ""
    
    $body = "api_key=$apiKey&request_token=$requestToken&checksum=$checksum"

    $response = Invoke-RestMethod -Uri "https://api.kite.trade/session/token" -Method POST -Body $body -ContentType "application/x-www-form-urlencoded"
    
    $accessToken = $response.data.access_token
    
    Write-Host ""
    Write-Host "SUCCESS! Access token generated:" -ForegroundColor Green
    Write-Host $accessToken -ForegroundColor Cyan
    Write-Host ""
    
    # Step 4: Update VS Code settings
    Write-Host "Step 3: Updating VS Code settings..." -ForegroundColor Yellow
    
    $settingsPath = "$env:APPDATA\Code\User\settings.json"
    $settingsContent = Get-Content $settingsPath -Raw
    $settingsContent = $settingsContent -replace '"kite\.accessToken":\s*"[^"]*"', "`"kite.accessToken`": `"$accessToken`""
    $settingsContent | Set-Content $settingsPath
    
    Write-Host "Settings updated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "==================================" -ForegroundColor Cyan
    Write-Host "  All Done! You are ready to trade" -ForegroundColor Cyan
    Write-Host "==================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Now press F5 in VS Code to launch the extension!" -ForegroundColor Yellow
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual setup required. Your access token should be entered in settings." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to close..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
