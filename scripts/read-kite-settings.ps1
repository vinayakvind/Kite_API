$settingsPath = "$env:APPDATA\Code\User\settings.json"
if (-Not (Test-Path $settingsPath)) { Write-Output "{}"; exit 0 }
$s = Get-Content $settingsPath -Raw | ConvertFrom-Json
$obj = [PSCustomObject]@{
    apiKey = $s.'kite.apiKey'
    apiSecret = $s.'kite.apiSecret'
    accessToken = $s.'kite.accessToken'
}
$obj | ConvertTo-Json -Compress
