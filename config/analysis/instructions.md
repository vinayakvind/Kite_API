# Strategic AI Analysis - Agent Instructions

## Purpose
Perform strategic analysis on portfolio for future growth potential and recommend position weightage adjustments.

## Script Location
`config/analysis/strategic-analysis.js`

## Usage

```bash
node config/analysis/strategic-analysis.js
```

## Analysis Components

### 1. Position Sizing Analysis
- Calculate current weightage of each stock
- Identify over-concentrated positions (>10% of portfolio)
- Identify under-weight positions with growth potential

### 2. Sector Diversification
- Group holdings by sector
- Highlight sector concentration risks
- Suggest rebalancing for diversification

### 3. Performance Momentum
- Identify stocks with positive momentum (rising)
- Flag stocks in downtrend
- Score based on recent performance

### 4. Risk Assessment
- Volatility analysis (day change patterns)
- Drawdown analysis (current vs peak)
- Loss concentration (which stocks drag portfolio)

### 5. Growth Potential Score
Each stock gets a score (1-10) based on:
- Current P&L trajectory
- Position size appropriateness
- Sector exposure
- Momentum indicators

## Output Files

- `analysis_report.json` - Full analysis data
- `analysis_summary.txt` - Human-readable summary
- `rebalance_suggestions.csv` - Actionable rebalancing steps

## Agent Workflow

> "Analyze my portfolio and suggest what to rebalance"

Agent should:
1. Run `node config/analysis/strategic-analysis.js`
2. Review `analysis_summary.txt`
3. Present key findings:
   - Top performers to consider trimming
   - Underweight opportunities
   - Risk concentrations
4. Offer to execute rebalancing trades

## Example Output

```
Portfolio Analysis Summary
==========================
Total Value: ₹5,00,000
Positions: 74 stocks

⚠️ Concentration Risks:
- OLAELEC: 12% of portfolio (recommend: reduce to 5%)
- YESBANK: 8% of portfolio (high risk sector)

📈 Growth Leaders:
- SGBSEP31II: +113% (consider profit booking)
- MARICO: +17% (healthy position)

📉 Underperformers:
- GENSOL-BZ: -97% (exit recommended)
- CROMPTON: -45% (review thesis)

🎯 Rebalancing Suggestions:
1. Sell 50% of OLAELEC to reduce concentration
2. Exit GENSOL-BZ completely
3. Add to INFY (underweight, strong sector)
```

## Customization

Edit `strategic-analysis.js` to adjust:
- `MAX_POSITION_SIZE`: Default 10% (max weight per stock)
- `MIN_POSITION_SIZE`: Default 0.5% (min meaningful position)
- `PROFIT_BOOK_THRESHOLD`: Default 25% (when to suggest profit booking)
- `LOSS_CUT_THRESHOLD`: Default -50% (when to suggest exit)
