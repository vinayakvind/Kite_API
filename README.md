# Kite Trading API - VS Code Extension

A Visual Studio Code extension for integrating with **Zerodha's Kite trading API**. This extension allows you to interact with your Zerodha trading account directly from VS Code, enabling you to view your portfolio, positions, holdings, and execute trades.

## Features

- **API Connection Management**: Connect and disconnect from Kite API with status indicator
- **Profile View**: View your trading account profile and details
- **Positions**: Monitor your current trading positions with P&L
- **Holdings**: View your investment holdings portfolio
- **Status Bar**: Real-time connection status in VS Code status bar
- **Secure Configuration**: Store API credentials securely in VS Code settings
- **Automated Trading Strategy**: RSI-based daily trading signals (NEW)
- **Investment Dashboard**: Web-based portfolio monitoring with real-time P&L (NEW)
- **Daily Profit Tracking**: Automated daily profit/loss tracking with statistics (NEW)

## Prerequisites

Before using this extension, you need:

1. **Zerodha Trading Account**: Sign up at [https://zerodha.com](https://zerodha.com)
2. **Kite Connect API Access**: 
   - Go to [https://developers.kite.trade/signup](https://developers.kite.trade/signup)
   - Create an app to get your API Key and API Secret
   - Subscribe to Kite Connect (₹500/month for full API access, or free for personal use)

## Installation

### From Source

1. Clone this repository
2. Open in VS Code
3. Run `npm install` to install dependencies
4. Press `F5` to launch the extension in a new Extension Development Host window

### From VSIX (when published)

1. Download the `.vsix` file
2. In VS Code, go to Extensions view (`Ctrl+Shift+X`)
3. Click `...` menu → `Install from VSIX`
4. Select the downloaded file

## Configuration

Configure the extension by setting your Kite API credentials:

1. Open VS Code Settings (`Ctrl+,`)
2. Search for "Kite"
3. Set the following values:
   - **Kite: Api Key**: Your API Key from Kite Connect dashboard
   - **Kite: Api Secret**: Your API Secret
   - **Kite: Access Token**: Your access token (generated after login)

### Getting Access Token

To get your access token:

1. Use your API Key to generate a login URL: `https://kite.zerodha.com/connect/login?api_key=YOUR_API_KEY`
2. Log in with your Zerodha credentials
3. After successful login, you'll be redirected with a `request_token`
4. Use this request token with your API Secret to generate an access token
5. Refer to [Kite Connect API documentation](https://kite.trade/docs/connect/v3/) for detailed steps

## Usage

### Commands

Access all commands through the Command Palette (`Ctrl+Shift+P`):

- **Kite: Connect to API** - Initialize connection to Kite API
- **Kite: Disconnect** - Disconnect from Kite API
- **Kite: Get Profile** - View your trading profile
- **Kite: Get Positions** - View current trading positions
- **Kite: Get Holdings** - View your investment holdings

### Automated Trading (NEW)

Beyond VS Code commands, this extension includes standalone scripts for automated trading:

#### Generate Trading Signals
```bash
node config/strategy/automated-trading-strategy.js
```

Features:
- RSI-based technical analysis (oversold/overbought detection)
- Automatic stop-loss (-3%) and profit targets (+2%)
- Position sizing limits (5% max per stock)
- Daily trade limits and investment caps
- Generates signals in `config/strategy/strategy_signals.json`

#### Track Daily Profit
```bash
node config/strategy/daily-profit-tracker.js
```

Features:
- Daily P&L calculation (delivery + intraday)
- Win/loss rate tracking
- Cumulative profit statistics
- Historical performance data

#### Investment Dashboard
Open `config/strategy/webapp/dashboard.html` in your browser for:
- Real-time portfolio value and P&L
- Active trading signals with RSI indicators
- Top holdings performance table
- Visual RSI charts (oversold/overbought zones)
- Auto-refresh every 5 minutes

See [`config/strategy/README.md`](config/strategy/README.md) for complete documentation.

### Status Bar

The extension adds a status bar item showing connection status:
- 🔴 **Kite Disconnected** - Click to connect
- ✅ **Kite Connected** - Successfully connected to API

## Development

### Project Structure

```
.
├── src/
│   ├── extension.ts      # Main extension activation and commands
│   └── kiteService.ts    # Kite API service layer
├── package.json          # Extension manifest
├── tsconfig.json         # TypeScript configuration
└── esbuild.js           # Build configuration
```

### Building

```bash
npm run compile     # Compile TypeScript
npm run watch       # Watch mode for development
npm run package     # Build production bundle
```

### Testing

```bash
npm test
```

## API Reference

This extension uses the [Kite Connect API v3](https://kite.trade/docs/connect/v3/). Key endpoints used:

- `/user/profile` - User profile
- `/portfolio/positions` - Trading positions
- `/portfolio/holdings` - Investment holdings
- `/orders` - Order management
- `/quote` - Market quotes

## Security

- API credentials are stored in VS Code settings
- Never commit your API keys or access tokens to version control
- Use environment-specific settings for different trading accounts
- Access tokens expire - regenerate as needed

## Limitations

- Access token needs manual generation and configuration
- WebSocket streaming not yet implemented
- Order placement requires additional confirmation (coming soon)

## Future Enhancements

- [ ] OAuth flow for automatic token generation
- [ ] WebSocket integration for real-time market data
- [ ] Enhanced order placement interface in VS Code
- [ ] Market quotes and watchlist management
- [ ] Historical data visualization
- [ ] GTT (Good Till Triggered) orders management
- [ ] Alerts and notifications
- [x] Automated trading strategy with RSI analysis
- [x] Web-based investment dashboard
- [x] Daily profit tracking and statistics

## Resources

- [Kite Connect Documentation](https://kite.trade/docs/connect/v3/)
- [Kite Connect Developer Forum](https://kite.trade/forum)
- [Zerodha API Portal](https://developers.kite.trade/)
- [GitHub - Kite Connect SDKs](https://github.com/zerodha)

## License

This extension is provided as-is for educational and personal use. Please review Zerodha's API terms of service before commercial use.

## Disclaimer

This is an unofficial extension and is not affiliated with Zerodha. Trading in financial markets involves risk. Use this tool responsibly and at your own risk.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues or questions:
- Open an issue on GitHub
- Refer to [Kite Connect Forum](https://kite.trade/forum) for API-related queries

---

**Happy Trading! 📈**
