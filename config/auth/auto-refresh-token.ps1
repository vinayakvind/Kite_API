# Auto-refresh Kite Connect access token using Google Chrome
# Usage: .\auto-refresh-token.ps1 [-RequestToken "token"]

param(
    [string]$RequestToken = ""
)

$ErrorActionPreference = "Stop"

# Paths
$settingsPath = "$env:APPDATA\Code\User\settings.json"
$chromePaths = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)

function Get-ChromePath {
    foreach ($p in $chromePaths) {
        if (Test-Path $p) { return $p }
    }
    return $null
}

function Read-Settings {
    $raw = Get-Content $settingsPath -Raw
    return $raw | ConvertFrom-Json
}

function Save-Settings($settings) {
    $settings | ConvertTo-Json -Depth 10 | Set-Content $settingsPath -Encoding UTF8
}

function Get-SHA256Hash($text) {
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($text)
    $hash = $sha256.ComputeHash($bytes)
    return [BitConverter]::ToString($hash).Replace("-", "").ToLower()
}

# Main
Write-Host "`n=== Kite Token Refresh ===" -ForegroundColor Cyan

# Step 1: Read settings
Write-Host "`n[1/5] Reading settings..." -ForegroundColor Yellow
$settings = Read-Settings
$apiKey = $settings.'kite.apiKey'
$apiSecret = $settings.'kite.apiSecret'

if (-not $apiKey -or -not $apiSecret) {
    Write-Host "ERROR: kite.apiKey or kite.apiSecret not found in settings" -ForegroundColor Red
    exit 1
}
Write-Host "      API Key: $($apiKey.Substring(0,4))****" -ForegroundColor Green

# Step 2: Open Chrome if no request token provided
if (-not $RequestToken) {
    Write-Host "`n[2/5] Launching Google Chrome..." -ForegroundColor Yellow
    $chromePath = Get-ChromePath
    if (-not $chromePath) {
        Write-Host "ERROR: Google Chrome not found" -ForegroundColor Red
        Write-Host "Please install Chrome or provide -RequestToken directly" -ForegroundColor Yellow
        exit 1
    }
    
    $loginUrl = "https://kite.zerodha.com/connect/login?api_key=$apiKey&v=3"
    Write-Host "      Opening: $loginUrl" -ForegroundColor Gray
    Start-Process $chromePath -ArgumentList $loginUrl
    
    Write-Host "`n[3/5] Complete login in Chrome..." -ForegroundColor Yellow
    Write-Host "      After login, you'll be redirected to a URL with request_token" -ForegroundColor Gray
    Write-Host "      Paste the FULL redirect URL or just the request_token below:" -ForegroundColor Cyan
    
    $input = Read-Host "`n      Enter URL or token"
    
    # Extract request_token from URL if full URL provided
    if ($input -match "request_token=([^&]+)") {
        $RequestToken = $Matches[1]
    } else {
        $RequestToken = $input.Trim()
    }
}

if (-not $RequestToken) {
    Write-Host "ERROR: No request_token provided" -ForegroundColor Red
    exit 1
}

Write-Host "      Request Token: $($RequestToken.Substring(0, [Math]::Min(8, $RequestToken.Length)))****" -ForegroundColor Green

# Step 4: Exchange for access token
Write-Host "`n[4/5] Exchanging for access token..." -ForegroundColor Yellow

$checksum = Get-SHA256Hash "$apiKey$RequestToken$apiSecret"
Write-Host "      Checksum: $($checksum.Substring(0,8))****" -ForegroundColor Gray

$body = @{
    api_key = $apiKey
    request_token = $RequestToken
    checksum = $checksum
}

try {
    $response = Invoke-RestMethod -Uri "https://api.kite.trade/session/token" `
        -Method Post `
        -Body $body `
        -ContentType "application/x-www-form-urlencoded" `
        -Headers @{ "X-Kite-Version" = "3" }
    
    $accessToken = $response.data.access_token
    
    if (-not $accessToken) {
        Write-Host "ERROR: No access_token in response" -ForegroundColor Red
        Write-Host ($response | ConvertTo-Json) -ForegroundColor Gray
        exit 1
    }
    
    Write-Host "      Access Token: $($accessToken.Substring(0,8))****" -ForegroundColor Green
    
} catch {
    Write-Host "ERROR: Token exchange failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Gray
    }
    exit 1
}

# Step 5: Save to settings
Write-Host "`n[5/5] Saving access token..." -ForegroundColor Yellow
$settings = Read-Settings
$settings | Add-Member -NotePropertyName "kite.accessToken" -NotePropertyValue $accessToken -Force
Save-Settings $settings

Write-Host "      Saved to: $settingsPath" -ForegroundColor Green

# Verify
Write-Host "`n=== Token Refresh Complete ===" -ForegroundColor Cyan
Write-Host "Testing connection..." -ForegroundColor Yellow

try {
    $headers = @{
        "X-Kite-Version" = "3"
        "Authorization" = "token $($apiKey):$accessToken"
    }
    $profile = Invoke-RestMethod -Uri "https://api.kite.trade/user/profile" -Headers $headers
    Write-Host "Connected as: $($profile.data.user_name) ($($profile.data.user_id))" -ForegroundColor Green
} catch {
    Write-Host "Warning: Connection test failed, but token was saved" -ForegroundColor Yellow
}

Write-Host "`nDone!" -ForegroundColor Cyan
