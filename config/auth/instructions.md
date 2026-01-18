# Auto-Refresh Token - Agent Instructions

## Purpose
Automatically refresh the Kite Connect access token by opening Google Chrome, handling login, and exchanging the request_token.

## Prerequisites
- Google Chrome installed at default location
- Valid `kite.apiKey` and `kite.apiSecret` in VS Code settings
- User must complete login manually (2FA)

## Script Location
`config/auth/auto-refresh-token.ps1`

## Usage

### Run Token Refresh
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\config\auth\auto-refresh-token.ps1
```

Or from any directory:
```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\vinay\Kite_API\config\auth\auto-refresh-token.ps1"
```

## Workflow

1. **Read Credentials**: Load `kite.apiKey` and `kite.apiSecret` from VS Code settings
2. **Launch Chrome**: Open Kite login URL in Google Chrome
3. **Wait for Login**: User completes login + 2FA manually
4. **Capture Redirect**: User pastes the redirect URL or request_token
5. **Exchange Token**: POST to `/session/token` with checksum
6. **Save Token**: Update `kite.accessToken` in VS Code settings.json

## Agent Workflow

> "My Kite token expired, refresh it"

Agent should:
1. Run `powershell -ExecutionPolicy Bypass -File config/auth/auto-refresh-token.ps1`
2. Wait for user to complete login
3. Confirm token was saved successfully
4. Test connection with a simple API call

## Manual Token Entry

If automated flow fails, user can:
1. Go to: `https://kite.zerodha.com/connect/login?api_key=YOUR_API_KEY`
2. Login and authorize
3. Copy `request_token` from redirect URL
4. Run: `.\config\auth\auto-refresh-token.ps1 -RequestToken "YOUR_TOKEN"`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Chrome not found | Install Chrome or set path in script |
| Invalid checksum | Verify api_secret is correct |
| Token expired immediately | Tokens expire at 7:30 AM next day - this is normal |
| 2FA timeout | Complete login faster, token request times out |

## Security Notes

- Access tokens are valid until 7:30 AM next trading day
- Never share your api_secret
- Tokens are stored in VS Code settings (local only)
- Script does not store passwords
