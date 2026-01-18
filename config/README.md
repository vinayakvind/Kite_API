# Kite API Operations Configuration

This folder contains organized scripts and agent instruction prompts for all trading operations.

## 📁 Folder Structure

```
config/
├── README.md                 # This file - master index
├── buy/                      # Buy stock operations
│   ├── buy-stocks.js
│   └── instructions.md
├── sell/                     # Sell stock operations
│   ├── sell-stocks.js
│   └── instructions.md
├── recommendations/          # Stock recommendations & webview
│   ├── webapp/
│   │   └── index.html
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
| Buy stocks | `node config/buy/buy-stocks.js --symbol INFY --qty 10 [--confirm]` |
| Sell stocks | `node config/sell/sell-stocks.js --symbol OLAELEC --qty 100 [--confirm]` |
| View recommendations | Open `config/recommendations/webapp/index.html` in browser |
| Refresh token | `powershell -File config/auth/auto-refresh-token.ps1` |
| Run AI analysis | `node config/analysis/strategic-analysis.js` |
| Track sold stocks | `node config/history/track-sold-stocks.js` |

## 🤖 Agent Instructions

Each subfolder contains an `instructions.md` file with prompts that any AI agent can follow to perform the operation safely and correctly.

## ⚠️ Safety Notes

- All order scripts run in **simulation mode** by default
- Add `--confirm` flag only when you want to place real orders
- Always verify order details before confirming
- Token refresh requires manual login approval
