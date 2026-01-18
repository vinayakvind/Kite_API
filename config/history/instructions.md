# Sold Stocks History Tracker - Agent Instructions

## Purpose
Track historically sold stocks and monitor them for re-entry opportunities when prices drop to attractive levels.

## Script Location
`config/history/track-sold-stocks.js`

## Usage

### Add a sold stock to tracking
```bash
node config/history/track-sold-stocks.js --add --symbol INFY --soldPrice 1800 --soldQty 10
```

### Check all tracked stocks for re-entry
```bash
node config/history/track-sold-stocks.js --check
```

### List all tracked stocks
```bash
node config/history/track-sold-stocks.js --list
```

### Remove a stock from tracking
```bash
node config/history/track-sold-stocks.js --remove --symbol INFY
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| `--add` | Add a stock to tracking |
| `--check` | Check all tracked stocks for buy opportunities |
| `--list` | List all tracked stocks |
| `--remove` | Remove a stock from tracking |
| `--symbol` | Trading symbol |
| `--soldPrice` | Price at which stock was sold |
| `--soldQty` | Quantity that was sold |
| `--targetDrop` | % drop from sold price to trigger alert (default: 15%) |

## Data File
`config/history/sold_stocks.json`

## Re-Entry Logic

A stock becomes a "re-entry opportunity" when:
1. Current price is X% below the sold price (default: 15%)
2. Daily momentum is positive (price recovering)
3. Stock is not currently in holdings

## Agent Workflow

### After selling a stock:
> "I just sold 100 shares of OLAELEC at ₹45, track it for re-entry"

Agent should:
```bash
node config/history/track-sold-stocks.js --add --symbol OLAELEC --soldPrice 45 --soldQty 100
```

### Daily check routine:
> "Check my sold stocks for re-entry opportunities"

Agent should:
1. Run `node config/history/track-sold-stocks.js --check`
2. Report any opportunities found
3. Offer to place buy orders for interesting ones

## Example Output

```
📊 Checking 5 tracked stocks for re-entry...

🟢 RE-ENTRY OPPORTUNITY:
   INFY: Sold at ₹1800, now ₹1520 (-15.6%)
   Daily change: +2.1% (positive momentum)
   Suggested action: BUY 10 shares

🟡 MONITORING:
   TCS: Sold at ₹4000, now ₹3800 (-5.0%)
   Not yet at target drop (15%)

🔴 NOT RECOMMENDED:
   YESBANK: Sold at ₹25, now ₹20 (-20%)
   Daily change: -3.2% (negative momentum)
```

## Integration with Sell Script

When using `config/sell/sell-stocks.js --confirm`, automatically prompt:
"Add this sale to re-entry tracking? (Y/n)"

## Alerts

The check command can be run as a scheduled task to generate alerts:
```bash
# Windows Task Scheduler
node config/history/track-sold-stocks.js --check > daily_alerts.txt
```
