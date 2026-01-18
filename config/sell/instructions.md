# Sell Stocks - Agent Instructions

## Purpose
Execute sell orders for stocks through Kite Connect API.

## Prerequisites
- Valid `kite.apiKey` and `kite.accessToken` in VS Code settings
- Holdings of the stock you want to sell
- Market hours (9:15 AM - 3:30 PM IST) for live orders

## Script Location
`config/sell/sell-stocks.js`

## Usage

### Simulation (Safe - No Real Order)
```bash
node config/sell/sell-stocks.js --symbol OLAELEC --qty 100
```

### Live Order (Real Money)
```bash
node config/sell/sell-stocks.js --symbol OLAELEC --qty 100 --confirm
```

### Sell All Holdings of a Stock
```bash
node config/sell/sell-stocks.js --symbol OLAELEC --all --confirm
```

## Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `--symbol` | Yes | - | Trading symbol (e.g., OLAELEC, TCS) |
| `--qty` | Yes* | - | Quantity to sell (*not needed if --all) |
| `--all` | No | false | Sell entire holding of this stock |
| `--exchange` | No | NSE | Exchange (NSE, BSE, NFO) |
| `--order_type` | No | MARKET | MARKET, LIMIT, SL, SL-M |
| `--product` | No | CNC | CNC (delivery), MIS (intraday), NRML |
| `--price` | No | - | Required for LIMIT orders |
| `--confirm` | No | false | Set to actually place order |

## Agent Workflow

1. **Validate Input**: Ensure symbol exists in holdings
2. **Check Holdings**: Verify sufficient quantity to sell
3. **Get Quote**: Fetch current price for P&L preview
4. **Show Preview**: Display order details and estimated proceeds
5. **Execute**: If `--confirm`, place order; else show simulation
6. **Log Result**: Save order response to `config/sell/orders.log`

## Example Agent Prompts

> "Sell 100 shares of OLAELEC"
```bash
node config/sell/sell-stocks.js --symbol OLAELEC --qty 100 --confirm
```

> "Exit my entire position in GENSOL-BZ"
```bash
node config/sell/sell-stocks.js --symbol GENSOL-BZ --all --confirm
```

## Error Handling

| Error | Resolution |
|-------|------------|
| `InputException` | Check symbol spelling |
| `TokenException` | Refresh access token |
| `OrderException` | Verify you have sufficient holdings |
| `NetworkException` | Retry after 5 seconds |

## Safety Rules

1. **Verify holdings** before selling - don't sell more than you own
2. **Show P&L preview** before confirming sale
3. **Log** all orders for audit trail
4. **Warn** if selling at significant loss (> 20%)
