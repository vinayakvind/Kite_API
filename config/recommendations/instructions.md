# Stock Recommendations - Agent Instructions

## Purpose
Generate and display buy/sell/hold recommendations for the portfolio with a nice web interface.

## Components
1. **generate-recommendations.js** - Analyzes portfolio and generates recommendations
2. **webapp/index.html** - Interactive web dashboard to view recommendations

## Script Location
`config/recommendations/`

## Usage

### Generate Recommendations
```bash
node config/recommendations/generate-recommendations.js
```

This will:
1. Fetch current holdings from Kite API
2. Analyze each stock using rule-based criteria
3. Save results to `recommendations.json`
4. Generate updated `webapp/data.js` for the web dashboard

### View Web Dashboard
Open in browser:
```
config/recommendations/webapp/index.html
```

Or serve locally:
```bash
npx serve config/recommendations/webapp
```

## Recommendation Rules

| Condition | Recommendation |
|-----------|----------------|
| P&L ≥ +25% | **SELL** (Take Profit) |
| Price < 50% of Avg | **SELL** (Cut Loss) |
| Day change ≤ -10% while profitable | **SELL** (Protect Profit) |
| P&L ≤ -20% AND day change > 0 | **BUY** (Dip Recovery) |
| Otherwise | **HOLD** |

## Agent Workflow

1. **Run Analysis**: Execute `generate-recommendations.js`
2. **Review Output**: Check `recommendations.json` for actionable items
3. **Present to User**: Open webapp or summarize key recommendations
4. **Execute Orders**: Use buy/sell scripts for confirmed actions

## Example Agent Prompts

> "What stocks should I buy or sell today?"

Agent should:
1. Run `node config/recommendations/generate-recommendations.js`
2. Summarize stocks marked as BUY or SELL
3. Offer to execute orders with user confirmation

> "Show me my portfolio recommendations"

Agent should:
1. Run the recommendation script
2. Open or serve the webapp
3. Highlight any urgent actions (big losses, profit-taking opportunities)

## Output Files

- `recommendations.json` - Raw recommendation data
- `webapp/data.js` - JavaScript data for web dashboard
- `summary.txt` - Text summary of recommendations

## Web Dashboard Features

- 📊 Portfolio overview with total value and P&L
- 🟢🟡🔴 Color-coded recommendations
- 📈 Sortable columns (symbol, P&L, recommendation)
- 🔍 Filter by recommendation type
- 📱 Mobile-responsive design
