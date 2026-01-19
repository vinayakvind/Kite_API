# 🏠 Local Setup Guide - Direct Execution

This guide helps you run everything locally on your machine without cloud dependencies, so you can see immediate responses and results.

## 📋 Prerequisites

1. **Node.js** installed (v14 or higher)
2. **VS Code** with Kite API credentials configured
3. **Terminal/Command Prompt** access

## ⚡ Quick Start - 3 Simple Steps

### Step 1: Configure Credentials

Open VS Code Settings (`Ctrl+,` or `Cmd+,`) and add:

```json
{
  "kite.apiKey": "your_api_key_here",
  "kite.accessToken": "your_access_token_here"
}
```

### Step 2: Generate Recommendations

```bash
# Navigate to project directory
cd path/to/Kite_API

# Generate today's recommendations
node config/recommendations/generate-recommendations.js
```

**You'll see output like:**
```
✅ Fetched 74 holdings from Kite API
📊 Analysis complete:
   - 6 SELL recommendations (2 urgent)
   - 4 BUY recommendations
   - 64 HOLD positions
✅ Saved to: portfolio_recommendations.csv
✅ Saved to: config/recommendations/recommendations.json
```

### Step 3: View Results

**Option A: Open Dashboard Locally**
```bash
# Just double-click this file:
config/recommendations/webapp/index.html
```

**Option B: Use Command Line**
```bash
# Windows
start config\recommendations\webapp\index.html

# Mac
open config/recommendations/webapp/index.html

# Linux
xdg-open config/recommendations/webapp/index.html
```

---

## 🎯 Common Operations

### 1. Check Portfolio Status

```bash
node config/recommendations/generate-recommendations.js
```

**Output shows:**
- Total stocks analyzed
- Current portfolio value
- Total P&L
- Recommendations breakdown

### 2. Execute a Sell Order

```bash
# Simulation mode (safe - no real order)
node config/sell/sell-stocks.js --symbol GENSOL-BZ --qty 20

# Real order (executes on Kite)
node config/sell/sell-stocks.js --symbol GENSOL-BZ --qty 20 --confirm
```

**You'll see output:**
```
📊 Stock: GENSOL-BZ
💰 Current Price: ₹22.29
📦 Quantity: 20
💵 Total Value: ₹445.80

[SIMULATION MODE] Order would be placed
OR
✅ Order placed successfully! Order ID: 123456789
```

### 3. Execute a Buy Order

```bash
# Simulation mode
node config/buy/buy-stocks.js --symbol BSOFT --qty 5

# Real order
node config/buy/buy-stocks.js --symbol BSOFT --qty 5 --confirm
```

### 4. Run Strategic Analysis

```bash
node config/analysis/strategic-analysis.js
```

**Output:**
```
📈 Portfolio Analysis Complete

Current Status:
- Total Value: ₹6,17,258
- Total P&L: -₹1,15,642 (-15.79%)
- Trend: Recovering

Top Opportunities:
1. BSOFT - Buy (dip recovery)
2. KFINTECH - Buy (averaging down)

Urgent Actions:
1. GENSOL-BZ - Sell immediately (-97.78%)
2. ITCHOTELS - Sell immediately (-65.4%)
```

### 5. Track Daily Performance

```bash
node config/automation/track-daily-performance.js
```

**Output:**
```
📊 Performance Tracking
Date: 2026-01-19
Portfolio Value: ₹6,17,258
Total P&L: -₹1,15,642 (-15.79%)
Stocks: 74

✅ Saved to: config/automation/performance_history.json
```

---

## 📱 Local Mobile Trigger Server

### Start Server Locally

```bash
node config/mobile/mobile-triggers.js
```

**You'll see:**
```
🚀 Mobile Triggers API running on http://localhost:3456
📱 Access from mobile: http://192.168.1.100:3456
📖 API docs: http://localhost:3456/

⚠️  WARNING: This server executes REAL orders!
   Only use on trusted networks
```

### Find Your IP Address

**Windows:**
```bash
ipconfig
# Look for IPv4 Address (e.g., 192.168.1.100)
```

**Mac/Linux:**
```bash
ifconfig
# or
ip addr
# Look for inet (e.g., 192.168.1.100)
```

### Use from Mobile Browser

1. On your mobile, open browser
2. Go to: `http://192.168.1.100:3456` (use your actual IP)
3. You'll see the API dashboard

### Test API Endpoints

```bash
# Get portfolio status
curl http://localhost:3456/status

# Get recommendations
curl http://localhost:3456/recommendations

# Execute urgent sells (simulation)
curl -X POST http://localhost:3456/execute-sell

# Execute specific order
curl -X POST http://localhost:3456/execute-action \
  -H "Content-Type: application/json" \
  -d '{"action": "SELL", "symbol": "GENSOL-BZ", "qty": 20}'
```

---

## 📊 View Dashboards Locally

### Dashboard 1: Recommendations

**File:** `config/recommendations/webapp/index.html`

**How to open:**
1. Navigate to folder in File Explorer/Finder
2. Double-click `index.html`
3. Opens in default browser

**What you see:**
- All 74 stocks in a table
- Filter by SELL/BUY/HOLD
- Portfolio summary cards
- Color-coded recommendations

### Dashboard 2: Historical Performance

**File:** `config/recommendations/webapp/dashboard.html`

**How to open:**
1. Navigate to folder
2. Double-click `dashboard.html`

**What you see:**
- Portfolio value chart
- P&L trend chart
- Period filters (7D, 1M, 3M, etc.)

---

## 🔄 Daily Automation (Local)

### Manual Daily Workflow

Run these commands every day at 3:45 PM (after market close):

```bash
# Step 1: Generate recommendations
node config/automation/daily-runner.js

# Step 2: Open dashboard
open config/recommendations/webapp/index.html

# Step 3: Review and execute orders
node config/sell/sell-stocks.js --symbol GENSOL-BZ --qty 20 --confirm
```

### Automated with Task Scheduler (Windows)

1. Open **Task Scheduler**
2. Create Basic Task
3. Name: "Kite Daily Analysis"
4. Trigger: Daily at 3:45 PM
5. Action: Start a program
   - Program: `node`
   - Arguments: `config/automation/daily-runner.js`
   - Start in: `C:\path\to\Kite_API`

### Automated with Cron (Mac/Linux)

```bash
# Edit crontab
crontab -e

# Add this line (runs at 3:45 PM on weekdays)
45 15 * * 1-5 cd /path/to/Kite_API && node config/automation/daily-runner.js
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module"

**Solution:**
```bash
npm install
```

### Issue: "No recommendations available"

**Solution:**
```bash
# Generate recommendations first
node config/recommendations/generate-recommendations.js
```

### Issue: "Kite API credentials not found"

**Solution:**
1. Open VS Code Settings
2. Search for "kite"
3. Add `kite.apiKey` and `kite.accessToken`

### Issue: "Port 3456 already in use"

**Solution:**
```bash
# Use different port
PORT=3457 node config/mobile/mobile-triggers.js
```

### Issue: "Dashboard shows no data"

**Solution:**
```bash
# Generate recommendations first
node config/recommendations/generate-recommendations.js

# Then open dashboard
open config/recommendations/webapp/index.html
```

---

## 📂 File Locations (Quick Reference)

```
Kite_API/
├── config/
│   ├── recommendations/
│   │   ├── generate-recommendations.js    ← Generate recommendations
│   │   └── webapp/
│   │       ├── index.html                 ← Main dashboard
│   │       └── dashboard.html             ← Historical dashboard
│   ├── buy/
│   │   └── buy-stocks.js                  ← Execute buy orders
│   ├── sell/
│   │   └── sell-stocks.js                 ← Execute sell orders
│   ├── analysis/
│   │   └── strategic-analysis.js          ← Portfolio analysis
│   ├── automation/
│   │   ├── daily-runner.js                ← Daily automation
│   │   └── track-daily-performance.js     ← Performance tracking
│   └── mobile/
│       └── mobile-triggers.js             ← Mobile API server
├── portfolio_recommendations.csv          ← Latest recommendations (CSV)
└── config/recommendations/recommendations.json  ← Latest recommendations (JSON)
```

---

## ✅ Verification Checklist

- [ ] Node.js installed (`node --version`)
- [ ] VS Code credentials configured
- [ ] Generated recommendations (`generate-recommendations.js`)
- [ ] Opened dashboard (double-click `index.html`)
- [ ] Can see portfolio data in dashboard
- [ ] Tested simulation order (without `--confirm`)
- [ ] Mobile server starts (`mobile-triggers.js`)
- [ ] Can access mobile server from browser

---

## 🎯 Next Steps

1. **Daily routine:** Run `daily-runner.js` after market close
2. **Review:** Open `index.html` to see recommendations
3. **Execute:** Run buy/sell scripts with `--confirm` flag
4. **Track:** Performance history builds up over time
5. **Mobile:** Use trigger server for remote execution

---

## 📞 Need Help?

All commands run locally and show immediate output in your terminal. No cloud dependencies needed!

**Common Questions:**

**Q: Do I need internet?**
A: Yes, only to fetch data from Kite API. All processing is local.

**Q: Where is data stored?**
A: In your local project directory (CSV and JSON files).

**Q: Can I run offline?**
A: No, you need internet to fetch live stock prices from Kite.

**Q: Is my data secure?**
A: Yes, everything runs on your machine. No data sent to cloud.

---

**You're all set for local operation!** 🎉
