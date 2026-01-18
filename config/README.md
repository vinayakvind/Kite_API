# Kite API Operations Configuration

This folder contains organized scripts and agent instruction prompts for all trading operations.

## 📁 Folder Structure

```
config/
├── README.md                 # This file - master index
├── automation/               # Daily automation & cloud agent
│   ├── daily-runner.js
│   ├── track-daily-performance.js
│   ├── instructions.md
│   └── history/
├── buy/                      # Buy stock operations
│   ├── buy-stocks.js
│   └── instructions.md
├── sell/                     # Sell stock operations
│   ├── sell-stocks.js
│   └── instructions.md
├── recommendations/          # Stock recommendations & webview
│   ├── webapp/
│   │   ├── index.html
│   │   └── dashboard.html
│   ├── generate-recommendations.js
│   └── instructions.md
├── auth/                     # Authentication & token refresh
│   ├── auto-refresh-token.ps1
│   └── instructions.md
├── analysis/                 # Strategic AI analysis
│   ├── strategic-analysis.js
│   └── instructions.md
└── history/                  # Sold stocks tracking
    ├── track-sold-stocks.js
    ├── sold_stocks.json
    └── instructions.md
```

## 🚀 Quick Start

| Operation | Command |
|-----------|---------|
| **Daily automation** | `node config/automation/daily-runner.js` |
| Buy stocks | `node config/buy/buy-stocks.js --symbol INFY --qty 10 [--confirm]` |
| Sell stocks | `node config/sell/sell-stocks.js --symbol OLAELEC --qty 100 [--confirm]` |
| View recommendations | Open `config/recommendations/webapp/index.html` in browser |
| View historical dashboard | Open `config/recommendations/webapp/dashboard.html` in browser |
| Refresh token | `powershell -File config/auth/auto-refresh-token.ps1` |
| Run AI analysis | `node config/analysis/strategic-analysis.js` |
| Track performance | `node config/automation/track-daily-performance.js` |
| Track sold stocks | `node config/history/track-sold-stocks.js` |

## 🤖 Agent Instructions

Each subfolder contains an `instructions.md` file with prompts that any AI agent can follow to perform the operation safely and correctly.

## 🎯 Daily Automation Features

The `automation/` folder provides:

1. **Daily Runner** (`daily-runner.js`):
   - Runs all trading operations automatically
   - Generates recommendations
   - Performs strategic analysis
   - Tracks historical performance
   - Identifies urgent actions
   - Optional auto-execute mode for high-priority sells

2. **Performance Tracking** (`track-daily-performance.js`):
   - Records daily portfolio snapshots
   - Calculates day-over-day changes
   - Maintains 365-day history
   - Powers historical charts

3. **Cloud Agent Integration**:
   - GitHub Actions setup guide
   - AWS Lambda deployment
   - Docker container support
   - Automated scheduling options

See `automation/instructions.md` for complete setup guide and `STOCK_TRADING_STRATEGY.md` in the root folder for comprehensive documentation.

## ⚠️ Safety Notes

- All order scripts run in **simulation mode** by default
- Add `--confirm` flag only when you want to place real orders
- Always verify order details before confirming
- Token refresh requires manual login approval
