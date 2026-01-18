# Automated Trading Strategy

This folder contains scripts for automated trading strategy execution and daily profit tracking.

## 📁 Files

- **`automated-trading-strategy.js`** - Main strategy script with RSI-based signals
- **`daily-profit-tracker.js`** - Daily P&L tracking and performance statistics
- **`instructions.md`** - Detailed agent instructions for strategy usage
- **`webapp/dashboard.html`** - Web-based investment monitoring dashboard
- **`strategy_signals.json`** - Generated trading signals (output)
- **`strategy.log`** - Execution log (output)
- **`daily-profit-data.json`** - Historical profit tracking data (output)

## 🚀 Quick Start

### 1. Generate Trading Signals
```bash
node automated-trading-strategy.js
```

This will:
- Analyze all watchlist stocks
- Calculate RSI indicators
- Generate buy/sell signals
- Save results to `strategy_signals.json`

### 2. Track Daily Profit
```bash
node daily-profit-tracker.js
```

This will:
- Calculate today's P&L (delivery + intraday)
- Track winning/losing days
- Calculate cumulative profit
- Save to `daily-profit-data.json`

### 3. View Dashboard
Open `webapp/dashboard.html` in your browser to see:
- Real-time portfolio value
- Active trading signals
- RSI indicators with visual charts
- Top holdings performance
- Today's P&L

## 📊 Strategy Parameters

Edit `automated-trading-strategy.js` to customize:

```javascript
const STRATEGY_CONFIG = {
  RSI_PERIOD: 14,              // RSI calculation period
  RSI_OVERSOLD: 30,            // Buy signal threshold
  RSI_OVERBOUGHT: 70,          // Sell signal threshold
  MAX_POSITION_SIZE: 0.05,     // 5% max per stock
  MIN_PROFIT_TARGET: 0.02,     // 2% profit target
  STOP_LOSS: -0.03,            // 3% stop loss
  MAX_TRADES_PER_DAY: 10,      // Daily trade limit
  MAX_INVESTMENT_PER_TRADE: 10000, // ₹10,000 per trade
  TRADING_SYMBOLS: [...]       // Your watchlist
};
```

## 🔄 Daily Automation

### Windows (Task Scheduler)
Run strategy every day at 9:30 AM IST (after market open):

```powershell
$action = New-ScheduledTaskAction -Execute "node" -Argument "C:\path\to\config\strategy\automated-trading-strategy.js"
$trigger = New-ScheduledTaskTrigger -Daily -At 9:30AM
Register-ScheduledTask -TaskName "KiteStrategy" -Action $action -Trigger $trigger
```

Run profit tracker at 3:45 PM IST (after market close):

```powershell
$action = New-ScheduledTaskAction -Execute "node" -Argument "C:\path\to\config\strategy\daily-profit-tracker.js"
$trigger = New-ScheduledTaskTrigger -Daily -At 3:45PM
Register-ScheduledTask -TaskName "KiteProfitTracker" -Action $action -Trigger $trigger
```

### Linux/Mac (Cron)
Add to crontab:

```bash
# Run strategy at 9:30 AM IST, Mon-Fri
30 9 * * 1-5 cd /path/to/Kite_API && node config/strategy/automated-trading-strategy.js

# Track profit at 3:45 PM IST, Mon-Fri
45 15 * * 1-5 cd /path/to/Kite_API && node config/strategy/daily-profit-tracker.js
```

## 📈 Understanding RSI

RSI (Relative Strength Index) is a momentum indicator:

- **RSI < 30**: Oversold - potential **BUY** signal
- **RSI 30-70**: Neutral - **HOLD**
- **RSI > 70**: Overbought - potential **SELL** signal

The strategy combines RSI with:
- Position sizing rules
- Stop-loss protection
- Profit targets
- Portfolio concentration limits

### RSI Implementation Note

⚠️ **Important**: The current implementation uses a **simplified RSI approximation** based on daily price movement rather than true RSI calculation. This is intentional for demonstration purposes and to avoid dependency on historical data API calls.

For production use, you should:
1. Fetch historical price data (requires instrument token mapping)
2. Use the `calculateRSI()` function with 14-period historical prices
3. Or integrate with a charting library that provides technical indicators

The simplified version provides reasonable signals for testing but may not match standard RSI values from trading platforms.

## 🎯 Trading Workflow

1. **Morning (9:30 AM)**:
   - Run `automated-trading-strategy.js`
   - Review signals in dashboard
   - Execute approved trades manually

2. **During Market Hours**:
   - Monitor positions
   - Check dashboard for updates
   - Execute exit signals if needed

3. **Evening (3:45 PM)**:
   - Run `daily-profit-tracker.js`
   - Review today's performance
   - Plan for next day

## 💡 Tips

1. **Start in Simulation**: Always test strategy in simulation mode first
2. **Review Signals**: Don't blindly execute all signals
3. **Track Performance**: Monitor win rate and adjust parameters
4. **Diversify**: Don't concentrate on single stock/sector
5. **Risk Management**: Always respect stop-losses
6. **Paper Trade**: Test for at least 2 weeks before going live

## ⚠️ Safety & Disclaimers

- Strategy generates **signals only** - you control execution
- All scripts run in simulation mode by default
- Manual confirmation required for real trades
- Past performance doesn't guarantee future results
- Trading involves financial risk
- Never invest more than you can afford to lose

## 📊 Performance Metrics

Track these metrics from `daily-profit-data.json`:

- **Win Rate**: Winning days / Total days
- **Average Daily Profit**: Total profit / Total days
- **Profit Factor**: Sum of winning days / Sum of losing days
- **Drawdown**: Largest peak-to-trough decline
- **Sharpe Ratio**: Risk-adjusted return

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| No signals generated | Market may be neutral, adjust RSI thresholds |
| API errors | Check access token validity |
| Dashboard not loading | Ensure strategy script has been run first |
| Missing dependencies | Run `npm install` in project root |

## 📚 Further Reading

- [RSI Indicator Explained](https://www.investopedia.com/terms/r/rsi.asp)
- [Kite Connect API Docs](https://kite.trade/docs/connect/v3/)
- [Position Sizing Strategies](https://www.investopedia.com/articles/trading/09/position-sizing.asp)
- [Risk Management](https://www.investopedia.com/articles/trading/09/risk-management.asp)
