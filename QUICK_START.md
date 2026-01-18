# 🚀 Quick Start Guide: Stock Trading Automation

This guide will help you get started with automated stock trading using the Kite API extension.

## Prerequisites

✅ **You Need:**
- Zerodha trading account ([Sign up](https://zerodha.com))
- Kite Connect API access ([Register](https://developers.kite.trade/signup))
- VS Code with this extension installed
- Node.js installed (v16 or higher)

## Step 1: Configure Credentials

1. Open VS Code Settings (`Ctrl+,` or `Cmd+,`)
2. Search for "Kite"
3. Set these values:
   - **Kite: Api Key** - Your API key from Kite Connect dashboard
   - **Kite: Api Secret** - Your API secret
   - **Kite: Access Token** - Your access token (see below)

### Getting Access Token

```bash
# Run this script to generate access token
powershell -File get-kite-token.ps1

# Or use the token refresh script
powershell -File config/auth/auto-refresh-token.ps1
```

Follow the prompts to log in and authorize the app.

## Step 2: Test Connection

1. Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Run: `Kite: Connect to API`
3. Verify status bar shows: ✅ **Kite Connected**

## Step 3: View Your Portfolio

Run these commands from the Command Palette:

```
Kite: Get Holdings       # View your stocks
Kite: Get Positions      # View open positions
Kite: Get Profile        # View account details
```

## Step 4: Generate Recommendations

```bash
# Open terminal in VS Code (Ctrl+` or Cmd+`)
node config/recommendations/generate-recommendations.js
```

Then open the web dashboard:
```bash
# Windows
start config/recommendations/webapp/index.html

# Mac
open config/recommendations/webapp/index.html

# Linux
xdg-open config/recommendations/webapp/index.html
```

## Step 5: Run Daily Automation

```bash
# Safe mode (analysis only - recommended for first run)
node config/automation/daily-runner.js
```

This will:
- ✅ Generate recommendations (BUY/SELL/HOLD)
- ✅ Perform strategic analysis
- ✅ Track historical performance
- ✅ Show urgent actions needed

**Output Files:**
- `config/recommendations/recommendations.json` - Full recommendations
- `config/recommendations/summary.txt` - Human-readable summary
- `config/analysis/analysis_summary.txt` - Strategic insights
- `config/automation/performance_history.json` - Historical data

## Step 6: View Dashboards

### Dashboard A: Current Recommendations
Open: `config/recommendations/webapp/index.html`

Features:
- 🟢 BUY signals
- 🔴 SELL signals
- 🟡 HOLD recommendations
- Filter and sort options

### Dashboard B: Historical Performance
Open: `config/recommendations/webapp/dashboard.html`

Features:
- 📈 Portfolio value chart
- 📊 P&L trend chart
- 📅 Period filters (7D to 1Y)

## Step 7: Execute Trades (Optional)

### Simulation Mode (Safe)
```bash
# Test buy order
node config/buy/buy-stocks.js --symbol INFY --qty 10

# Test sell order
node config/sell/sell-stocks.js --symbol INFY --qty 5
```

### Live Trading (Real Money!)
```bash
# Real buy order - CAUTION!
node config/buy/buy-stocks.js --symbol INFY --qty 10 --confirm

# Real sell order - CAUTION!
node config/sell/sell-stocks.js --symbol INFY --qty 5 --confirm
```

⚠️ **Always verify order details before using `--confirm` flag!**

## Step 8: Schedule Daily Automation

### Windows (Task Scheduler)

1. Open Task Scheduler
2. Create Basic Task: "Kite Daily Automation"
3. Trigger: Daily at 3:45 PM
4. Action: Start a program
   - Program: `node`
   - Arguments: `"C:\path\to\Kite_API\config\automation\daily-runner.js"`
   - Start in: `C:\path\to\Kite_API`

### Mac/Linux (Cron)

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 3:45 PM)
45 15 * * 1-5 cd /path/to/Kite_API && node config/automation/daily-runner.js
```

### GitHub Actions (Cloud)

1. Copy `config/automation/github-actions-workflow.example.yml` to `.github/workflows/daily-trading.yml`
2. Add secrets to GitHub repository:
   - `KITE_API_KEY`
   - `KITE_ACCESS_TOKEN`
3. Commit and push
4. Workflow runs automatically daily at 3:45 PM IST

## Usage Patterns

### Daily Routine

**Morning:**
```bash
# Check yesterday's recommendations
start config/recommendations/webapp/index.html
```

**Evening (after market close):**
```bash
# Generate fresh recommendations
node config/automation/daily-runner.js

# Review urgent actions
start config/recommendations/webapp/dashboard.html
```

**Execute trades (if needed):**
```bash
# Follow recommendations from dashboard
node config/sell/sell-stocks.js --symbol GENSOL-BZ --qty 20 --confirm
```

### Weekly Review

```bash
# Run strategic analysis
node config/analysis/strategic-analysis.js

# Review rebalancing suggestions
cat config/analysis/rebalance_suggestions.csv
```

## Safety Tips

1. ✅ **Start with Simulation**: Run for 2-4 weeks without `--confirm`
2. ✅ **Review Before Execute**: Always check recommendations manually
3. ✅ **Small Positions**: Start with small quantities
4. ✅ **Monitor Daily**: Check execution logs regularly
5. ✅ **Backup Data**: Save `performance_history.json` periodically

## Troubleshooting

### Token Expired
```
Error: TokenException
```
**Fix:**
```bash
powershell -File config/auth/auto-refresh-token.ps1
```

### No Recommendations Generated
```
No holdings found
```
**Fix:** Ensure you have stocks in your Demat account

### Dashboard Not Loading
**Fix:**
```bash
# Generate data first
node config/recommendations/generate-recommendations.js
node config/automation/track-daily-performance.js
```

### Script Errors
```
Cannot find module 'axios'
```
**Fix:**
```bash
npm install axios
```

## Next Steps

1. 📖 Read **[Stock Trading Strategy Guide](STOCK_TRADING_STRATEGY.md)** for detailed documentation
2. 🤖 See **[Cloud Agent Setup](config/automation/instructions.md)** for automated execution
3. 🔧 Customize rules in `config/recommendations/generate-recommendations.js`
4. 📊 Set up notifications (email/SMS) in `config/automation/daily-runner.js`

## Getting Help

- **Extension Issues**: Open issue on GitHub
- **Kite API Issues**: [Kite Connect Forum](https://kite.trade/forum)
- **Trading Questions**: [Zerodha TradingQ&A](https://tradingqna.com)

---

**Happy Trading! 📈**

Remember: This is for educational purposes. Trading involves risk. Only trade with money you can afford to lose.
