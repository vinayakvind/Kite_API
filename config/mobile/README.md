# 📱 Mobile Trading Triggers

Simple HTTP API server that enables mobile devices to trigger buy/sell orders based on daily recommendations.

## Quick Start

### 1. Start the Server

```bash
node config/mobile/mobile-triggers.js
```

Server runs on `http://localhost:3456` by default.

### 2. Access from Mobile

**On same WiFi network:**
1. Find your computer's IP address:
   - Windows: `ipconfig` (look for IPv4)
   - Mac/Linux: `ifconfig` or `ip addr`
2. On mobile browser, visit: `http://<your-ip>:3456`

**Example**: `http://192.168.1.100:3456`

---

## 📡 API Endpoints

### GET /status
Get portfolio status and recommendation counts.

**Response:**
```json
{
  "timestamp": "2026-01-18T10:30:00.000Z",
  "summary": {
    "totalInvested": 733026.92,
    "currentValue": 617258.24,
    "totalPnL": -115642.25,
    "totalPnLPercent": -15.79
  },
  "counts": {
    "total": 74,
    "sell": 6,
    "buy": 4,
    "hold": 64
  }
}
```

### GET /recommendations
Get full list of today's recommendations.

### POST /execute-sell
Execute all urgent (priority 1) sell orders automatically.

**Example:**
```bash
curl -X POST http://localhost:3456/execute-sell
```

### POST /execute-buy
Execute top buy recommendations.

**Body (optional):**
```json
{
  "count": 1
}
```

**Example:**
```bash
curl -X POST http://localhost:3456/execute-buy \
  -H "Content-Type: application/json" \
  -d '{"count": 2}'
```

### POST /execute-action
Execute a specific buy or sell order.

**Body:**
```json
{
  "action": "SELL",
  "symbol": "GENSOL-BZ",
  "qty": 20
}
```

**Example:**
```bash
curl -X POST http://localhost:3456/execute-action \
  -H "Content-Type: application/json" \
  -d '{"action": "SELL", "symbol": "GENSOL-BZ", "qty": 20}'
```

---

## 📱 Mobile Apps & Shortcuts

### iOS Shortcuts App

Create shortcuts to trigger orders:

1. Open **Shortcuts** app
2. Create new shortcut: **Execute Urgent Sells**
3. Add action: **Get Contents of URL**
   - URL: `http://<your-ip>:3456/execute-sell`
   - Method: POST
4. Add action: **Show Result**
5. Add to Home Screen

**More shortcuts:**
- Get Status
- Execute Buy Orders
- Execute Specific Sell

### Android (HTTP Shortcuts)

Install **HTTP Shortcuts** app from Play Store:

1. Create shortcut
2. Method: POST
3. URL: `http://<your-ip>:3456/execute-sell`
4. Add to Home Screen

### Tasker (Android)

Create automated tasks:

1. **Trigger**: Time (3:45 PM daily)
2. **Action**: HTTP Post to `/execute-sell`
3. **Notification**: Show result

---

## 🔔 Automation Ideas

### 1. Daily 3:45 PM Trigger

**iPhone:** Use **Shortcuts Automation**
- Time: 3:45 PM, Weekdays
- Action: Run "Execute Urgent Sells" shortcut
- Run automatically

**Android:** Use **Tasker** or **Automate**
- Profile: Time Context (3:45 PM, Mon-Fri)
- Task: HTTP Post to endpoint

### 2. Morning Notification

Get portfolio status every morning:

```bash
# Add to cron (Mac/Linux)
0 9 * * 1-5 curl http://localhost:3456/status | jq '.summary'
```

### 3. IFTTT Integration

Create IFTTT applet:
- Trigger: **Button widget** or **Time**
- Action: **Webhooks** → POST to trigger server

### 4. Telegram Bot

Simple Node.js Telegram bot:

```javascript
// bot.js
const TelegramBot = require('node-telegram-bot-api');
const http = require('http');

const bot = new TelegramBot('YOUR_BOT_TOKEN', {polling: true});

bot.onText(/\/sell/, (msg) => {
  http.get('http://localhost:3456/execute-sell', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      bot.sendMessage(msg.chat.id, `Executed: ${data}`);
    });
  });
});
```

---

## 🔒 Security Considerations

### ⚠️ WARNING

This server **executes real orders** with the `--confirm` flag. Always use on trusted networks only.

### Recommended Setup

1. **Local Network Only**: Don't expose to internet
2. **Firewall**: Block port 3456 from external access
3. **VPN**: Use VPN when accessing remotely
4. **Authentication**: Add basic auth for production use

### Add Basic Authentication (Optional)

Edit `mobile-triggers.js`:

```javascript
function handleRequest(req, res) {
  // Check Authorization header
  const auth = req.headers.authorization;
  if (!auth || auth !== 'Bearer your-secret-token') {
    res.writeHead(401);
    res.end('Unauthorized');
    return;
  }
  // ... rest of code
}
```

---

## 🚀 Advanced: Deploy to Cloud

### Heroku Deployment

```bash
# Add Procfile
echo "web: node config/mobile/mobile-triggers.js" > Procfile

# Deploy
heroku create my-kite-triggers
heroku config:set KITE_API_KEY=your_key
heroku config:set KITE_ACCESS_TOKEN=your_token
git push heroku main
```

### Docker Deployment

```dockerfile
FROM node:18
WORKDIR /app
COPY . .
EXPOSE 3456
CMD ["node", "config/mobile/mobile-triggers.js"]
```

---

## 📊 Usage Examples

### Check Status Before Market Close

```bash
# 3:30 PM - Check status
curl http://localhost:3456/status

# Output:
# {
#   "counts": {
#     "sell": 6,
#     "buy": 4
#   }
# }
```

### Execute Urgent Actions

```bash
# 3:45 PM - Execute urgent sells
curl -X POST http://localhost:3456/execute-sell

# Then execute top 2 buy recommendations
curl -X POST http://localhost:3456/execute-buy \
  -H "Content-Type: application/json" \
  -d '{"count": 2}'
```

### Specific Order

```bash
# Sell GENSOL-BZ immediately
curl -X POST http://localhost:3456/execute-action \
  -H "Content-Type: application/json" \
  -d '{"action": "SELL", "symbol": "GENSOL-BZ", "qty": 20}'
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Use different port
PORT=3457 node config/mobile/mobile-triggers.js
```

### Can't Access from Mobile

1. Check firewall settings
2. Verify IP address
3. Ensure on same WiFi network
4. Try `http` not `https`

### No Recommendations Found

Run recommendation generator first:

```bash
node config/recommendations/generate-recommendations.js
```

---

## 📚 Related Documentation

- [QUICK_START.md](../../QUICK_START.md) - Setup guide
- [STOCK_TRADING_STRATEGY.md](../../STOCK_TRADING_STRATEGY.md) - Trading strategy
- [config/automation/instructions.md](../automation/instructions.md) - Automation setup

---

## 🎯 Next Steps

1. Start the server
2. Test endpoints with curl
3. Create mobile shortcuts
4. Set up daily automation
5. Monitor execution logs

**Happy Mobile Trading!** 📱📈
