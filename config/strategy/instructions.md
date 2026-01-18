# Automated Trading Strategy - Agent Instructions

## Purpose
Execute automated trading strategy based on RSI (Relative Strength Index) technical indicators for daily profit generation.

## Script Location
`config/strategy/automated-trading-strategy.js`

## Strategy Overview

This automated trading strategy uses RSI-based signals to identify buy and sell opportunities:

### Key Features
- **RSI-Based Signals**: Identifies oversold (buy) and overbought (sell) conditions
- **Risk Management**: Automatic stop-loss and profit targets
- **Position Sizing**: Limits exposure per stock (5% max)
- **Daily Trade Limits**: Maximum 10 trades per day
- **Investment Caps**: ₹10,000 maximum per trade

### Strategy Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `RSI_PERIOD` | 14 | RSI calculation period |
| `RSI_OVERSOLD` | 30 | Buy signal threshold (oversold) |
| `RSI_OVERBOUGHT` | 70 | Sell signal threshold (overbought) |
| `MAX_POSITION_SIZE` | 5% | Maximum portfolio weight per stock |
| `MIN_PROFIT_TARGET` | 2% | Minimum profit before selling |
| `STOP_LOSS` | -3% | Automatic stop loss trigger |
| `MAX_TRADES_PER_DAY` | 10 | Daily trade limit |
| `MAX_INVESTMENT_PER_TRADE` | ₹10,000 | Max capital per trade |

## Usage

### Simulation Mode (Default - Safe)
```bash
node config/strategy/automated-trading-strategy.js
```

This will:
- Analyze all watchlist stocks
- Generate trading signals
- Save report to `strategy_signals.json`
- **NOT place any real orders**

### Live Mode (Manual Execution Required)
```bash
node config/strategy/automated-trading-strategy.js --live
```

**Note**: Even in live mode, this script only generates signals. You must manually execute trades using:
```bash
node config/buy/buy-stocks.js --symbol <SYMBOL> --qty <QTY> --confirm
node config/sell/sell-stocks.js --symbol <SYMBOL> --qty <QTY> --confirm
```

## Signal Generation Logic

### BUY Signals
Generated when:
1. Stock not currently held
2. RSI < 30 (oversold condition)
3. Available cash for purchase
4. Within daily trade limit

### SELL Signals
Generated when:
1. Stock currently held, AND one of:
   - RSI > 70 (overbought - book profits)
   - P&L <= -3% (stop loss triggered)
   - P&L >= 2% AND RSI > 60 (profit target + momentum)
   - Position size > 5% (reduce concentration)

## Output Files

### `strategy_signals.json`
Complete trading signals with analysis data:
```json
{
  "timestamp": "2024-01-18T08:00:00Z",
  "mode": "simulation",
  "portfolioValue": 500000,
  "availableCash": 50000,
  "signals": [
    {
      "symbol": "INFY",
      "signal": "BUY",
      "lastPrice": 1450.50,
      "rsi": 28.5,
      "suggestedQty": 6,
      "reason": "RSI oversold (28.50), good entry point"
    }
  ],
  "summary": {
    "buySignals": 3,
    "sellSignals": 2,
    "totalSignals": 5
  }
}
```

### `strategy.log`
Timestamped execution log for audit trail

## Agent Workflow

### User Request: "Run daily trading strategy"

Agent should:
1. **Run Strategy Analysis**:
   ```bash
   node config/strategy/automated-trading-strategy.js
   ```

2. **Review Signals**: 
   - Check `strategy_signals.json`
   - Identify high-priority signals

3. **Present Recommendations**:
   ```
   📊 Today's Trading Signals
   
   🟢 BUY Recommendations:
   - INFY: ₹1,450.50 (RSI: 28.5) - Qty: 6
   - TCS: ₹3,200.00 (RSI: 29.8) - Qty: 3
   
   🔴 SELL Recommendations:
   - RELIANCE: ₹2,450.00 (RSI: 72.3) - Qty: 20 (Book profits)
   
   Total Buy Value: ₹18,303
   Total Sell Value: ₹49,000
   Net Cash Impact: +₹30,697
   ```

4. **Request Confirmation**: Ask user to approve trades

5. **Execute Approved Trades**:
   ```bash
   node config/buy/buy-stocks.js --symbol INFY --qty 6 --confirm
   node config/sell/sell-stocks.js --symbol RELIANCE --qty 20 --confirm
   ```

6. **Track Results**: Log execution to `strategy.log`

## Customization

Edit `automated-trading-strategy.js` to modify:

### Watchlist Symbols
```javascript
TRADING_SYMBOLS: [
  'INFY', 'TCS', 'WIPRO', 'HDFCBANK', 'RELIANCE', 
  'BAJFINANCE', 'ASIANPAINT', 'TITAN', 'MARUTI'
]
```

### Risk Parameters
```javascript
MAX_POSITION_SIZE: 0.05,        // 5% per stock
MIN_PROFIT_TARGET: 0.02,        // 2% profit
STOP_LOSS: -0.03,               // 3% loss
MAX_INVESTMENT_PER_TRADE: 10000 // ₹10,000
```

## Safety Features

1. **Simulation Mode Default**: Never places real orders without explicit `--live` flag
2. **Manual Execution**: Even in live mode, requires manual trade execution
3. **Position Limits**: Automatic enforcement of position size limits
4. **Stop Loss**: Automatic identification of stop loss triggers
5. **Daily Limits**: Maximum trades per day cap
6. **Audit Trail**: Complete logging of all signals and decisions

## Scheduling for Daily Automation

### Windows (Task Scheduler)
```powershell
# Run at 9:30 AM IST daily (after market open)
schtasks /create /tn "KiteStrategy" /tr "node C:\path\to\config\strategy\automated-trading-strategy.js" /sc daily /st 09:30
```

### Linux/Mac (Cron)
```bash
# Add to crontab (9:30 AM IST daily)
30 9 * * 1-5 cd /path/to/Kite_API && node config/strategy/automated-trading-strategy.js
```

## Best Practices

1. **Run During Market Hours**: 9:15 AM - 3:30 PM IST
2. **Review Signals Manually**: Don't blindly execute all signals
3. **Monitor Performance**: Track win rate and adjust parameters
4. **Start Small**: Test with lower investment amounts initially
5. **Diversify**: Don't concentrate on single stock/sector
6. **Update Watchlist**: Regularly review and update TRADING_SYMBOLS

## Risk Warnings

⚠️ **Important Disclaimers**:
- Trading involves financial risk
- Past performance doesn't guarantee future results
- RSI is one indicator - not infallible
- Always review signals before executing
- Never invest more than you can afford to lose
- Markets can remain irrational longer than you can remain solvent

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No signals generated | Market may be neutral, try different RSI thresholds |
| API errors | Check access token validity |
| Low buy signals | Increase `RSI_OVERSOLD` threshold (e.g., 35) |
| Too many signals | Decrease thresholds or reduce watchlist |
| Historical data errors | Script uses simplified RSI based on daily OHLC |

## Performance Monitoring

Track strategy performance by analyzing:
1. Win rate (profitable trades / total trades)
2. Average profit per trade
3. Maximum drawdown
4. Sharpe ratio
5. Daily P&L consistency

Create a separate tracking script to log executed trades and outcomes.
