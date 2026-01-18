# Kite Trading API - VS Code Extension

## Architecture Overview

This is a **VS Code extension** for Zerodha Kite trading API integration, built with TypeScript and esbuild.

### Core Components
- **`src/extension.ts`** - Entry point: registers VS Code commands, manages status bar, creates webview panels for profile/positions/holdings
- **`src/kiteService.ts`** - API layer: axios-based service for Kite Connect API v3 (`https://api.kite.trade`)
- **`config/`** - Standalone Node.js scripts for trading operations (buy/sell/analysis/strategy), designed for AI agent automation

### Data Flow
1. User configures `kite.apiKey` + `kite.accessToken` in VS Code settings
2. `KiteService.initialize()` reads settings and sets auth header: `Authorization: token {apiKey}:{accessToken}`
3. Commands display results in webview panels with inline HTML/CSS

## Development Commands

```bash
npm run watch          # Development: parallel tsc + esbuild watch
npm run compile        # Build once (type-check + lint + bundle)
npm run package        # Production build (minified)
F5                     # Launch Extension Development Host
```

Build output: `dist/extension.js` (esbuild bundle, external: vscode)

## Key Patterns

### Adding a New Command
1. Add command definition in `package.json` under `contributes.commands`
2. Register handler in `src/extension.ts` with `vscode.commands.registerCommand()`
3. Add to `context.subscriptions` for cleanup
4. Pattern: check `kiteService.isConnected()` before API calls

### Adding Kite API Endpoints
Add methods to `KiteService` class following existing pattern:
```typescript
public async getX(): Promise<any> {
  try {
    const response = await this.apiClient.get('/endpoint');
    return response.data;
  } catch (error: any) {
    throw new Error(`Failed to get X: ${error.message}`);
  }
}
```

### Config Scripts (AI Agent Operations)
Scripts in `config/` are standalone Node.js, not part of extension bundle:
- Read credentials from VS Code settings: `%APPDATA%/Code/User/settings.json`
- Use `--confirm` flag for live execution (default: simulation mode)
- Each folder has `instructions.md` with agent prompts

| Operation | Script | Example |
|-----------|--------|---------|
| Buy | `config/buy/buy-stocks.js` | `node config/buy/buy-stocks.js --symbol INFY --qty 10` |
| Sell | `config/sell/sell-stocks.js` | `node config/sell/sell-stocks.js --symbol TCS --qty 5 --confirm` |
| Analysis | `config/analysis/strategic-analysis.js` | Outputs to `analysis_report.json` |
| **Automated Strategy** | `config/strategy/automated-trading-strategy.js` | RSI-based daily trading signals |
| **Dashboard** | `config/strategy/webapp/dashboard.html` | Web-based investment monitoring |

## Configuration Settings

Settings stored in VS Code configuration (`kite.*` namespace):
- `kite.apiKey` - Kite Connect API key
- `kite.apiSecret` - API secret (for token generation)  
- `kite.accessToken` - Session token (expires daily, requires regeneration)

## External Dependencies

- **Kite Connect API v3**: https://kite.trade/docs/connect/v3/
- Market hours: 9:15 AM - 3:30 PM IST for live orders
- Access tokens expire daily - use `config/auth/auto-refresh-token.ps1` for refresh

## Automated Trading Strategy

New feature for daily profit generation using RSI-based technical analysis:

### Strategy Overview
- **Location**: `config/strategy/automated-trading-strategy.js`
- **Purpose**: Generate automated buy/sell signals based on RSI indicators
- **Safety**: Simulation mode by default, manual execution required

### Key Features
- RSI oversold/overbought detection (30/70 thresholds)
- Automatic stop-loss (-3%) and profit targets (+2%)
- Position sizing limits (5% max per stock)
- Daily trade limits (10 trades/day max)
- Investment caps (₹10,000 per trade)

### Usage
```bash
# Generate signals (simulation mode)
node config/strategy/automated-trading-strategy.js

# View in dashboard
open config/strategy/webapp/dashboard.html
```

### Output Files
- `strategy_signals.json` - Trading signals with recommendations
- `strategy.log` - Execution log with timestamps
- Web dashboard - Real-time portfolio monitoring with RSI indicators

### Integration with Buy/Sell
Strategy generates signals that feed into existing buy/sell scripts:
```bash
# After reviewing signals, execute:
node config/buy/buy-stocks.js --symbol <SYMBOL> --qty <QTY> --confirm
node config/sell/sell-stocks.js --symbol <SYMBOL> --qty <QTY> --confirm
```

## Testing

```bash
npm test               # Run extension tests via @vscode/test-electron
```

Tests located in `src/test/`. Use Extension Development Host for manual testing.
