# Buy Stocks - Agent Instructions

## Purpose
Execute buy orders for stocks through Kite Connect API.

## Prerequisites
- Valid `kite.apiKey` and `kite.accessToken` in VS Code settings
- Market hours (9:15 AM - 3:30 PM IST) for live orders

## Script Location
`config/buy/buy-stocks.js`

## Usage

### Simulation (Safe - No Real Order)
```bash
node config/buy/buy-stocks.js --symbol INFY --qty 10
```

### Live Order (Real Money)
```bash
node config/buy/buy-stocks.js --symbol INFY --qty 10 --confirm
```

## Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `--symbol` | Yes | - | Trading symbol (e.g., INFY, TCS) |
| `--qty` | Yes | - | Quantity to buy |
| `--exchange` | No | NSE | Exchange (NSE, BSE, NFO) |
| `--order_type` | No | MARKET | MARKET, LIMIT, SL, SL-M |
| `--product` | No | CNC | CNC (delivery), MIS (intraday), NRML |
| `--price` | No | - | Required for LIMIT orders |
| `--confirm` | No | false | Set to actually place order |

## Agent Workflow

1. **Validate Input**: Ensure symbol exists and qty > 0
2. **Check Margins**: Verify sufficient funds (call `/user/margins`)
3. **Get Quote**: Fetch current price (call `/quote?i=NSE:SYMBOL`)
4. **Show Preview**: Display order details and estimated cost
5. **Execute**: If `--confirm`, place order; else show simulation
6. **Log Result**: Save order response to `config/buy/orders.log`

## Example Agent Prompt

> "Buy 10 shares of INFY at market price"

Agent should run:
```bash
node config/buy/buy-stocks.js --symbol INFY --qty 10 --confirm
```

## Error Handling

| Error | Resolution |
|-------|------------|
| `InputException` | Check symbol spelling, ensure valid exchange |
| `TokenException` | Refresh access token using auth script |
| `MarginException` | Insufficient funds - reduce quantity |
| `NetworkException` | Retry after 5 seconds |

## Safety Rules

1. **Never** place orders > ₹50,000 without explicit user confirmation
2. **Always** show order preview before `--confirm`
3. **Log** all orders (success and failure) for audit
4. **Verify** market is open before placing orders
