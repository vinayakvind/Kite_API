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
├── strategy/                 # Automated trading strategy (NEW)
│   ├── automated-trading-strategy.js
│   ├── instructions.md
│   ├── webapp/
│   │   └── dashboard.html   # Investment monitoring dashboard
│   └── strategy_signals.json
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
| **Automated Strategy** | `node config/strategy/automated-trading-strategy.js` |
| **Strategy Dashboard** | Open `config/strategy/webapp/dashboard.html` in browser |
| Buy stocks | `node config/buy/buy-stocks.js --symbol INFY --qty 10 [--confirm]` |
| Sell stocks | `node config/sell/sell-stocks.js --symbol OLAELEC --qty 100 [--confirm]` |
| View recommendations | Open `config/recommendations/webapp/index.html` in browser |
| Refresh token | `powershell -File config/auth/auto-refresh-token.ps1` |
| Run AI analysis | `node config/analysis/strategic-analysis.js` |
| Track sold stocks | `node config/history/track-sold-stocks.js` |

## 🤖 Agent Instructions

Each subfolder contains an `instructions.md` file with prompts that any AI agent can follow to perform the operation safely and correctly.

## 🎯 Automated Trading Strategy (NEW)

The **automated-trading-strategy** implements an RSI-based daily trading system:

### Features
- **RSI Technical Analysis**: Identifies oversold (buy) and overbought (sell) conditions
- **Risk Management**: Automatic stop-loss (-3%) and profit targets (+2%)
- **Position Sizing**: Maximum 5% portfolio weight per stock
- **Daily Trade Limits**: Cap of 10 trades per day
- **Investment Caps**: ₹10,000 maximum per individual trade

### Quick Start
```bash
# Run in simulation mode (safe, no real trades)
node config/strategy/automated-trading-strategy.js

# View results in web dashboard
open config/strategy/webapp/dashboard.html
```

### Output Files
- `strategy_signals.json` - Trading signals with buy/sell recommendations
- `strategy.log` - Timestamped execution log
- Web dashboard displays portfolio value, RSI indicators, and active signals

### Integration
Strategy generates signals that can be executed via existing buy/sell scripts:
```bash
# Execute a buy signal
node config/buy/buy-stocks.js --symbol INFY --qty 6 --confirm

# Execute a sell signal
node config/sell/sell-stocks.js --symbol RELIANCE --qty 20 --confirm
```

## ⚠️ Safety Notes

- All order scripts run in **simulation mode** by default
- Add `--confirm` flag only when you want to place real orders
- Always verify order details before confirming
- Token refresh requires manual login approval
- Strategy script generates signals only - manual execution required for safety
