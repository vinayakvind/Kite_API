# Stock Trading Automation - Agent Instructions

## Purpose
Automate daily stock trading operations including portfolio analysis, recommendations generation, and optional order execution.

## Daily Automation Script
`config/automation/daily-runner.js`

## Usage

### Analysis Only (Safe Mode - Recommended)
```bash
node config/automation/daily-runner.js
```

This will:
1. Generate portfolio recommendations (BUY/SELL/HOLD)
2. Run strategic analysis for rebalancing
3. Track daily performance history
4. Highlight urgent actions needed

### With Auto-Execute (CAUTION: Places Real Orders)
```bash
node config/automation/daily-runner.js --auto-execute
```

⚠️ **WARNING**: This will automatically execute SELL orders marked as priority 1 (urgent). Only use when you trust the recommendation logic completely.

## What Gets Automated

### 1. Daily Recommendations Generation
- Analyzes all holdings
- Applies rule-based recommendations:
  - **SELL** if profit ≥25% (take profit)
  - **SELL** if loss ≥50% (cut loss)
  - **SELL** if sudden drop while profitable (protect gains)
  - **BUY** if recovering from dip (≥20% down, now rising)
  - **HOLD** otherwise

### 2. Strategic Portfolio Analysis
- Position sizing analysis
- Sector diversification check
- Risk concentration alerts
- Growth potential scoring
- Rebalancing suggestions

### 3. Historical Performance Tracking
- Daily snapshots of portfolio value
- P&L trend tracking
- Historical data for charting (last 365 days)
- Day-over-day change calculations

### 4. Urgent Action Detection
- Identifies high-priority sell recommendations
- Displays urgent actions clearly
- Optionally auto-executes with `--auto-execute` flag

## Scheduling for Daily Execution

### Windows (Task Scheduler)

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: Daily at 3:45 PM IST (after market close)
4. Action: Start a program
   - Program: `node`
   - Arguments: `"C:\path\to\Kite_API\config\automation\daily-runner.js"`
   - Start in: `C:\path\to\Kite_API`

### Linux/Mac (Cron)

```bash
# Edit crontab
crontab -e

# Add line (runs daily at 3:45 PM IST)
45 15 * * 1-5 cd /path/to/Kite_API && node config/automation/daily-runner.js
```

### Cloud Execution (AWS Lambda, Azure Functions, Google Cloud Functions)

Deploy `daily-runner.js` as a serverless function:
1. Package script with dependencies (`axios`, `node-fetch`)
2. Set environment variables for credentials
3. Configure CloudWatch/Azure Monitor trigger for daily execution
4. Review logs in cloud console

## Cloud Agent Setup

### What is a Cloud Agent?

A cloud agent is an automated system that runs trading operations on a schedule without requiring your local machine to be running. It can:
- Run 24/7 in the cloud
- Execute scheduled tasks reliably
- Send notifications via email/SMS
- Scale to handle multiple strategies
- Maintain detailed logs and audit trails

### Benefits of Cloud Agent

1. **Reliability**: Never miss a trading day
2. **Consistency**: Executes strategy exactly as programmed
3. **Accessibility**: View results from anywhere via web dashboard
4. **Scalability**: Can monitor multiple portfolios
5. **Automation**: Set it and forget it
6. **Cost-Effective**: Pay only for compute time used

### Setup Steps

#### Option 1: GitHub Actions (Free for public repos)

1. Add secrets to GitHub repository settings:
   - `KITE_API_KEY`
   - `KITE_ACCESS_TOKEN`

2. Create `.github/workflows/daily-trading.yml`:

```yaml
name: Daily Trading Automation

on:
  schedule:
    - cron: '15 10 * * 1-5'  # 3:45 PM IST (10:15 AM UTC) on weekdays
  workflow_dispatch:  # Allow manual trigger

jobs:
  run-automation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install axios
      
      - name: Create settings file
        run: |
          mkdir -p ~/.config/Code/User
          echo '{
            "kite.apiKey": "${{ secrets.KITE_API_KEY }}",
            "kite.accessToken": "${{ secrets.KITE_ACCESS_TOKEN }}"
          }' > ~/.config/Code/User/settings.json
      
      - name: Run daily automation
        run: node config/automation/daily-runner.js
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: trading-results
          path: |
            config/recommendations/recommendations.json
            config/analysis/analysis_summary.txt
            config/automation/history/
```

#### Option 2: AWS Lambda

1. Create Lambda function
2. Set environment variables for credentials
3. Use EventBridge to trigger daily at 3:45 PM IST
4. Deploy code:

```javascript
// lambda-handler.js
const { execSync } = require('child_process');

exports.handler = async (event) => {
  try {
    // Set credentials in environment
    process.env.APPDATA = '/tmp';
    
    // Run automation
    const output = execSync('node config/automation/daily-runner.js', {
      encoding: 'utf8'
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, output })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
```

#### Option 3: Docker Container

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY . .
RUN npm install

# Set cron job
RUN echo "45 15 * * 1-5 cd /app && node config/automation/daily-runner.js" > /etc/crontabs/root

CMD ["crond", "-f"]
```

Deploy to any cloud provider (AWS ECS, Google Cloud Run, Azure Container Instances).

## Agent Workflow Example

### Morning: Portfolio Review
> "What's my portfolio status?"

Agent runs:
1. `node config/recommendations/generate-recommendations.js`
2. Opens `config/recommendations/webapp/index.html`
3. Summarizes urgent actions

### Mid-Day: Check Opportunities
> "Any buying opportunities today?"

Agent:
1. Checks recommendations for BUY signals
2. Verifies available margin
3. Presents filtered list with reasons

### Evening: Execute Trades
> "Execute today's sell recommendations"

Agent:
1. Reviews SELL recommendations
2. Confirms each order with user
3. Executes via `config/sell/sell-stocks.js --confirm`
4. Logs results

### Weekly: Strategic Review
> "Analyze my portfolio for rebalancing"

Agent:
1. Runs `config/analysis/strategic-analysis.js`
2. Reviews `rebalance_suggestions.csv`
3. Presents top 5 rebalancing actions

## Safety Features

1. **Simulation by Default**: All order scripts require `--confirm` flag
2. **Dual Confirmation**: Auto-execute only affects priority 1 urgent sells
3. **Audit Logging**: All operations logged with timestamps
4. **Error Handling**: Graceful failure with detailed error messages
5. **Rate Limiting**: Respects API rate limits
6. **Market Hours Check**: Validates orders during trading hours

## Monitoring & Alerts

### Set Up Notifications (Future Enhancement)

```javascript
// In daily-runner.js, add notification function
async function sendNotification(message) {
  // Email via SendGrid/AWS SES
  // SMS via Twilio
  // Push via Pushover/Pushbullet
  // Webhook to Discord/Slack
}
```

### Health Checks

Monitor these files for issues:
- `config/automation/history/run-YYYY-MM-DD.json` - Daily execution logs
- `config/automation/performance_history.json` - Portfolio trends
- `config/recommendations/recommendations.json` - Latest recommendations

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Token expired | Run `powershell -File config/auth/auto-refresh-token.ps1` |
| No recommendations | Check if holdings API returns data |
| Automation not running | Verify cron/task scheduler configuration |
| Orders failing | Check margin, market hours, symbol validity |

## Best Practices

1. **Start with Analysis Only**: Run for 2-4 weeks without auto-execute
2. **Review Manually**: Check recommendations before enabling auto-execute
3. **Limit Auto-Execute**: Only for well-tested scenarios (e.g., stop-loss)
4. **Backup Data**: Archive `performance_history.json` regularly
5. **Monitor Logs**: Review daily execution logs weekly
6. **Update Strategy**: Refine recommendation rules based on performance

## Customization

Edit recommendation rules in `config/recommendations/generate-recommendations.js`:

```javascript
// Example: Change profit-taking threshold
if (pnlPercent >= 30) {  // Changed from 25 to 30
  action = 'SELL';
  reason = 'Take profit (≥30% gain)';
}
```

Edit portfolio analysis config in `config/analysis/strategic-analysis.js`:

```javascript
const CONFIG = {
  MAX_POSITION_SIZE: 0.15,      // 15% instead of 10%
  PROFIT_BOOK_THRESHOLD: 0.30,  // 30% instead of 25%
  // ... customize other thresholds
};
```
