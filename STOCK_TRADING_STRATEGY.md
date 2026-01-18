# 📈 Stock Trading Strategy Implementation Guide

## Overview

This document describes the **automated stock trading strategy** implemented in the Kite API VS Code extension. The system provides daily buy/sell recommendations, monitors stock performance, and offers a comprehensive web dashboard for investment tracking.

## 🎯 Strategy Objectives

1. **Profit Maximization**: Identify and execute profit-taking opportunities
2. **Loss Minimization**: Cut losses early before they become catastrophic
3. **Portfolio Optimization**: Maintain balanced exposure across sectors
4. **Automation**: Reduce emotional decision-making through rule-based trading

## 🔄 Trading Strategy Logic

### Buy Signals

| Condition | Action | Rationale |
|-----------|--------|-----------|
| Stock down ≥20% AND showing recovery (positive day change) | **BUY** | Dip recovery opportunity - averaging down |
| Underweight high-quality stock in portfolio | **BUY** | Portfolio rebalancing |
| Strong momentum in profitable position | **BUY** | Momentum continuation |

### Sell Signals

| Condition | Action | Rationale |
|-----------|--------|-----------|
| Profit ≥25% | **SELL** | Take profit - lock in gains |
| Loss ≥50% | **SELL** | Cut loss - prevent further damage |
| Day drop ≥10% while in profit | **SELL** | Protect profit - prevent reversal |
| Position size >10% of portfolio | **SELL** (partial) | Reduce concentration risk |

### Hold Conditions

- Position within normal range (-20% to +25%)
- No extreme movements
- Adequate diversification
- Wait for clearer signal

## 📊 Daily Automation Workflow

### Step 1: Data Collection (9:00 AM - 3:30 PM)
- Market operates: 9:15 AM - 3:30 PM IST
- Holdings data refreshed continuously via Kite API
- Last prices updated in real-time

### Step 2: Analysis (After Market Close - 3:45 PM)
```bash
node config/automation/daily-runner.js
```

This performs:
1. **Portfolio Fetch**: Get current holdings from Kite API
2. **Recommendation Engine**: Apply trading rules to each stock
3. **Strategic Analysis**: Evaluate sector exposure, position sizing
4. **Performance Tracking**: Record daily snapshot for historical trends

### Step 3: Review & Execute (Evening)
- Review recommendations in web dashboard
- Manually approve high-priority actions
- Optional: Enable auto-execute for urgent sells only

### Step 4: Historical Tracking (Continuous)
- Daily performance snapshots saved
- P&L trends calculated
- Historical charts generated

## 📱 Web Dashboard Features

### Dashboard A: Recommendations View (`index.html`)

**URL**: `config/recommendations/webapp/index.html`

Features:
- ✅ Live portfolio summary (total value, P&L, stock count)
- 📊 Sortable table of all holdings
- 🎨 Color-coded recommendations (🔴 Sell, 🟢 Buy, 🟡 Hold)
- 🔍 Filter by action type
- 📱 Mobile-responsive design
- 📈 Real-time P&L calculations

### Dashboard B: Historical Performance (`dashboard.html`)

**URL**: `config/recommendations/webapp/dashboard.html`

Features:
- 📉 Interactive line chart of portfolio value over time
- 📊 Bar chart of daily P&L trends
- 📅 Period filters (7D, 1M, 3M, 6M, 1Y, All)
- 📈 Today's change with percentage
- 📊 Historical tracking up to 365 days
- 🔄 Auto-refresh from performance history

## 🤖 Cloud Agent Integration

### What is a Cloud Agent?

A cloud agent is an automated system that:
- Runs trading automation on a schedule (no manual intervention)
- Operates 24/7 in cloud infrastructure
- Sends notifications when actions are needed
- Maintains audit logs of all operations
- Scales to handle multiple portfolios

### Benefits

1. **Never Miss a Trading Day**: Runs even when your computer is off
2. **Consistent Execution**: No emotional decisions, pure rule-based
3. **Reliable Notifications**: Email/SMS alerts for urgent actions
4. **Audit Trail**: Complete history of all recommendations and trades
5. **Cost-Effective**: Serverless functions charge only for execution time

### Setup Options

#### Option 1: GitHub Actions (Easiest)

**Pros**: Free for public repos, easy setup, integrated with Git
**Cost**: Free

See `config/automation/instructions.md` for complete setup guide.

#### Option 2: AWS Lambda

**Pros**: Highly scalable, reliable, integrates with AWS services
**Cost**: ~$0.01/day (essentially free under free tier)

Deploy with EventBridge scheduler to trigger daily.

#### Option 3: Azure Functions

**Pros**: Good Windows integration, easy deployment from VS Code
**Cost**: ~$0.01/day (free tier covers it)

#### Option 4: Google Cloud Functions

**Pros**: Simple pricing, generous free tier
**Cost**: ~$0.01/day

#### Option 5: Docker Container

**Pros**: Run anywhere (AWS ECS, GCP Cloud Run, Azure Container Instances)
**Cost**: Varies by provider

Deploy the entire application as a container with cron scheduler.

### Mobile Operation

**Q: Can the cloud agent operate from mobile?**

**A: Yes!** The cloud agent runs independently of any device. You can:

1. **View Results on Mobile**:
   - Access web dashboard via GitHub Pages or cloud hosting
   - Receive notifications via email/SMS
   - Use mobile browser to view recommendations

2. **Manual Approval on Mobile**:
   - Set up webhook endpoints for mobile notifications
   - Use GitHub Actions workflow dispatch to trigger from mobile
   - Access cloud provider dashboard on mobile browser

3. **Fully Automated Mode**:
   - Enable `--auto-execute` for hands-free operation
   - Agent runs daily without any interaction
   - Review execution logs later

## 📈 Investment Tracking System

### Historical Performance Tracking

**Script**: `config/automation/track-daily-performance.js`

Tracks:
- Daily portfolio value
- Total P&L (absolute and percentage)
- Stock count
- Day-over-day change

**Data Storage**: `config/automation/performance_history.json`

**Retention**: Last 365 days

### Recommendation History

Each run of the daily automation saves:
- `config/recommendations/recommendations.json` - Current recommendations
- `config/automation/history/run-YYYY-MM-DD.json` - Execution log
- `config/analysis/analysis_summary.txt` - Strategic analysis summary

### Web-Based Portfolio Tracking

**Primary Dashboard**: `config/recommendations/webapp/dashboard.html`

Features:
1. **Performance Tab**:
   - Portfolio value chart (line graph)
   - P&L trend chart (bar graph)
   - Summary cards with trends
   - Period selector (7D to 1Y)

2. **Recommendations Tab**:
   - Embedded live recommendations view
   - Actionable buy/sell/hold signals
   - Detailed reasoning for each recommendation

### Mobile-Friendly Access

All dashboards are responsive:
- Touch-friendly buttons
- Horizontal scrolling on small screens
- Simplified view on mobile
- Fast loading with minimal dependencies

## 🔐 Security Best Practices

1. **Never Commit Credentials**: API keys/tokens stay in VS Code settings
2. **Use Environment Variables**: For cloud deployments
3. **Enable 2FA**: On Zerodha account
4. **Rotate Tokens**: Access tokens expire daily - refresh regularly
5. **Audit Logs**: Review execution history regularly
6. **Start with Simulation**: Test for 2-4 weeks before live trading
7. **Limit Auto-Execute**: Only enable for well-tested scenarios

## 📋 Daily Operations Checklist

### Morning (Before Market Opens)
- [ ] Check if access token needs refresh
- [ ] Review yesterday's recommendations
- [ ] Check for pending orders

### During Market Hours (Optional)
- [ ] Monitor major positions
- [ ] Watch for breaking news on holdings
- [ ] Check intraday P&L if needed

### Evening (After Market Close)
- [ ] Run daily automation (or let scheduled task do it)
- [ ] Review new recommendations
- [ ] Execute urgent sell orders if any
- [ ] Check portfolio balance in dashboard

### Weekly Review
- [ ] Run strategic analysis
- [ ] Review sector exposure
- [ ] Check for rebalancing opportunities
- [ ] Update strategy rules if needed

## 🛠️ Customization Guide

### Adjust Trading Rules

Edit `config/recommendations/generate-recommendations.js`:

```javascript
// Example: More aggressive profit-taking
if (pnlPercent >= 20) {  // Changed from 25%
  action = 'SELL';
  reason = 'Take profit (≥20% gain)';
  priority = 1;
}

// Example: Tighter stop-loss
} else if (pnlPercent <= -30) {  // Changed from -50%
  action = 'SELL';
  reason = 'Cut loss (>30% down)';
  priority = 1;
}
```

### Adjust Portfolio Analysis

Edit `config/analysis/strategic-analysis.js`:

```javascript
const CONFIG = {
  MAX_POSITION_SIZE: 0.12,       // 12% instead of 10%
  MIN_POSITION_SIZE: 0.01,       // 1% instead of 0.5%
  PROFIT_BOOK_THRESHOLD: 0.30,   // 30% instead of 25%
  LOSS_CUT_THRESHOLD: -0.40,     // -40% instead of -50%
  HIGH_CONCENTRATION: 0.10,      // 10% instead of 8%
};
```

### Add Custom Notifications

Edit `config/automation/daily-runner.js` to add notification function:

```javascript
const nodemailer = require('nodemailer');

async function sendEmail(subject, body) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: 'your-email@example.com',
    subject,
    text: body
  });
}
```

## 📖 Usage Examples

### Example 1: Check Daily Recommendations

```bash
# Generate fresh recommendations
node config/recommendations/generate-recommendations.js

# Open dashboard in browser
start config/recommendations/webapp/index.html  # Windows
open config/recommendations/webapp/index.html   # Mac
```

### Example 2: Run Full Daily Automation

```bash
# Safe mode (analysis only)
node config/automation/daily-runner.js

# With auto-execute (CAUTION)
node config/automation/daily-runner.js --auto-execute
```

### Example 3: View Historical Performance

```bash
# Track today's performance
node config/automation/track-daily-performance.js

# Open historical dashboard
start config/recommendations/webapp/dashboard.html
```

### Example 4: Manual Trading

```bash
# Buy stock (simulation)
node config/buy/buy-stocks.js --symbol INFY --qty 10

# Buy stock (live)
node config/buy/buy-stocks.js --symbol INFY --qty 10 --confirm

# Sell stock (simulation)
node config/sell/sell-stocks.js --symbol OLAELEC --qty 100

# Sell stock (live)
node config/sell/sell-stocks.js --symbol OLAELEC --qty 100 --confirm
```

## 🔧 Troubleshooting

### Token Expired
```
Error: TokenException
```
**Solution**: Run `powershell -File config/auth/auto-refresh-token.ps1`

### No Holdings Data
```
No holdings found
```
**Solution**: Check if you have any stocks in your Demat account

### Automation Not Running
**Solution**: 
- Verify cron/task scheduler configuration
- Check script paths are absolute
- Ensure Node.js is in system PATH

### Charts Not Loading
**Solution**:
- Run `node config/automation/track-daily-performance.js` first
- Wait for at least 2 days of data
- Check `performance_history.json` exists

## 📚 Additional Resources

- **Kite Connect API Docs**: https://kite.trade/docs/connect/v3/
- **GitHub Actions Docs**: https://docs.github.com/actions
- **Chart.js Docs**: https://www.chartjs.org/docs/
- **Zerodha Trader Forums**: https://tradingqna.com/

## 🚀 Future Enhancements

- [ ] ML-based recommendation engine
- [ ] Real-time WebSocket streaming
- [ ] Options trading strategies
- [ ] Multi-account support
- [ ] Advanced technical indicators (RSI, MACD, Bollinger Bands)
- [ ] Backtesting framework
- [ ] Risk management rules (max daily loss, circuit breakers)
- [ ] Tax calculation and reporting

---

**Happy Trading! 📈**

Remember: Past performance does not guarantee future results. Trade responsibly and only with money you can afford to lose.
