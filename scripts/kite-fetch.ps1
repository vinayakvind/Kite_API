param(
    [string]$endpoint = "user/profile"
)
$settingsPath = "$env:APPDATA\Code\User\settings.json"
if (-Not (Test-Path $settingsPath)) { Write-Error "settings.json not found"; exit 1 }
$s = Get-Content $settingsPath -Raw | ConvertFrom-Json
$apiKey = $s.'kite.apiKey'
$accessToken = $s.'kite.accessToken'
if (-not $apiKey -or -not $accessToken) { Write-Error "Missing apiKey or accessToken"; exit 1 }
$headers = @{
    'X-Kite-Version' = '3'
    'Authorization' = "token $($apiKey):$($accessToken)"
}
$url = "https://api.kite.trade/$endpoint"
try {
    $resp = Invoke-RestMethod -Uri $url -Headers $headers -Method Get -ErrorAction Stop
    $resp | ConvertTo-Json -Depth 10
} catch {
    Write-Error $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $body = $reader.ReadToEnd()
        Write-Output $body
    }
    exit 1
}
