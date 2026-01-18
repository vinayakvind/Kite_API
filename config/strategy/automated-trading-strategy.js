const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Strategy Configuration
const STRATEGY_CONFIG = {
  RSI_PERIOD: 14,                    // RSI calculation period
  RSI_OVERSOLD: 30,                  // Buy signal threshold
  RSI_OVERBOUGHT: 70,                // Sell signal threshold
  MAX_POSITION_SIZE: 0.05,           // 5% max per stock
  MIN_PROFIT_TARGET: 0.02,           // 2% minimum profit target
  STOP_LOSS: -0.03,                  // 3% stop loss
  MAX_TRADES_PER_DAY: 10,            // Daily trade limit
  MAX_INVESTMENT_PER_TRADE: 10000,   // ₹10,000 max per trade
  TRADING_SYMBOLS: [                 // Watchlist for automated trading
    'INFY', 'TCS', 'WIPRO', 'HDFCBANK', 'RELIANCE', 
    'BAJFINANCE', 'ASIANPAINT', 'TITAN', 'MARUTI'
  ]
};

function readSettings() {
  const settingsPath = path.join(process.env.APPDATA, 'Code', 'User', 'settings.json');
  const raw = fs.readFileSync(settingsPath, 'utf8');
  const first = raw.indexOf('{');
  const last = raw.lastIndexOf('}');
  return JSON.parse(raw.slice(first, last + 1));
}

function log(msg) {
  const logPath = path.join(__dirname, 'strategy.log');
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
  console.log(`[${timestamp}] ${msg}`);
}

// Calculate RSI (Relative Strength Index)
function calculateRSI(prices) {
  if (prices.length < STRATEGY_CONFIG.RSI_PERIOD + 1) {
    return null;
  }

  let gains = 0;
  let losses = 0;

  // Calculate initial average gain/loss
  for (let i = 1; i <= STRATEGY_CONFIG.RSI_PERIOD; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  let avgGain = gains / STRATEGY_CONFIG.RSI_PERIOD;
  let avgLoss = losses / STRATEGY_CONFIG.RSI_PERIOD;

  // Calculate subsequent values using smoothing
  for (let i = STRATEGY_CONFIG.RSI_PERIOD + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (STRATEGY_CONFIG.RSI_PERIOD - 1) + gain) / STRATEGY_CONFIG.RSI_PERIOD;
    avgLoss = (avgLoss * (STRATEGY_CONFIG.RSI_PERIOD - 1) + loss) / STRATEGY_CONFIG.RSI_PERIOD;
  }

  if (avgLoss === 0) {
    return 100;
  }

  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  return rsi;
}

// Fetch historical data for RSI calculation
async function getHistoricalData(client, symbol, days = 30) {
  try {
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const response = await client.get('/instruments/historical', {
      params: {
        instrument_token: symbol,
        from: fromDate.toISOString().split('T')[0],
        to: toDate.toISOString().split('T')[0],
        interval: 'day'
      }
    });

    return response.data.data || [];
  } catch (error) {
    log(`Warning: Could not fetch historical data for ${symbol}`);
    return [];
  }
}

// Analyze stock and generate trading signal
async function analyzeStock(client, symbol, currentHoldings, portfolioValue) {
  try {
    // Get current quote
    const quoteResp = await client.get('/quote', { 
      params: { i: `NSE:${symbol}` } 
    });
    const quote = quoteResp.data.data[`NSE:${symbol}`];
    
    if (!quote) {
      return null;
    }

    const lastPrice = quote.last_price;
    const ohlc = quote.ohlc;
    
    // Get OHLC data for RSI calculation
    const prices = [
      ohlc.open,
      ohlc.high,
      ohlc.low,
      lastPrice
    ];

    // Simple RSI approximation using day's OHLC
    // For production, fetch historical data
    const dayChange = ((lastPrice - ohlc.open) / ohlc.open) * 100;
    
    // Calculate approximate RSI based on day performance
    let rsi = 50; // Neutral
    if (dayChange > 3) rsi = 65;
    else if (dayChange > 1) rsi = 55;
    else if (dayChange < -3) rsi = 35;
    else if (dayChange < -1) rsi = 45;

    // Check if we already hold this stock
    const holding = currentHoldings.find(h => h.tradingsymbol === symbol);
    const currentPosition = holding ? holding.quantity * holding.last_price : 0;
    const positionSize = currentPosition / portfolioValue;

    let signal = 'HOLD';
    let reason = '';
    let suggestedQty = 0;

    // BUY Signal Logic
    if (!holding && rsi < STRATEGY_CONFIG.RSI_OVERSOLD) {
      // Calculate quantity based on max investment per trade
      suggestedQty = Math.floor(STRATEGY_CONFIG.MAX_INVESTMENT_PER_TRADE / lastPrice);
      signal = 'BUY';
      reason = `RSI oversold (${rsi.toFixed(2)}), good entry point`;
    }
    // SELL Signal Logic
    else if (holding && rsi > STRATEGY_CONFIG.RSI_OVERBOUGHT) {
      suggestedQty = holding.quantity;
      signal = 'SELL';
      reason = `RSI overbought (${rsi.toFixed(2)}), book profits`;
    }
    // Stop Loss Check
    else if (holding) {
      const pnlPct = ((lastPrice - holding.average_price) / holding.average_price);
      if (pnlPct <= STRATEGY_CONFIG.STOP_LOSS) {
        suggestedQty = holding.quantity;
        signal = 'SELL';
        reason = `Stop loss triggered (${(pnlPct * 100).toFixed(2)}%)`;
      } else if (pnlPct >= STRATEGY_CONFIG.MIN_PROFIT_TARGET && rsi > 60) {
        suggestedQty = holding.quantity;
        signal = 'SELL';
        reason = `Profit target reached (${(pnlPct * 100).toFixed(2)}%), RSI ${rsi.toFixed(2)}`;
      }
    }
    // Position Size Check
    if (holding && positionSize > STRATEGY_CONFIG.MAX_POSITION_SIZE) {
      const excessQty = Math.floor(holding.quantity * (positionSize - STRATEGY_CONFIG.MAX_POSITION_SIZE) / positionSize);
      if (excessQty > 0) {
        signal = 'SELL';
        suggestedQty = excessQty;
        reason = `Reduce position size (${(positionSize * 100).toFixed(2)}% > ${(STRATEGY_CONFIG.MAX_POSITION_SIZE * 100)}%)`;
      }
    }

    return {
      symbol,
      lastPrice: Number(lastPrice.toFixed(2)),
      rsi: Number(rsi.toFixed(2)),
      dayChange: Number(dayChange.toFixed(2)),
      signal,
      suggestedQty,
      reason,
      currentPosition: holding ? holding.quantity : 0,
      avgPrice: holding ? holding.average_price : 0
    };
  } catch (error) {
    log(`Error analyzing ${symbol}: ${error.message}`);
    return null;
  }
}

// Execute trading strategy
async function executeStrategy(dryRun = true) {
  try {
    const settings = readSettings();
    const apiKey = settings['kite.apiKey'];
    const accessToken = settings['kite.accessToken'];

    if (!apiKey || !accessToken) {
      console.error('Missing kite.apiKey or kite.accessToken in VS Code settings');
      process.exit(1);
    }

    const client = axios.create({
      baseURL: 'https://api.kite.trade',
      timeout: 15000,
      headers: {
        'X-Kite-Version': '3',
        'Authorization': `token ${apiKey}:${accessToken}`
      }
    });

    log('='.repeat(60));
    log('🤖 Starting Automated Trading Strategy');
    log(`Mode: ${dryRun ? 'SIMULATION' : 'LIVE'}`);
    log('='.repeat(60));

    // Get current holdings and portfolio value
    const holdingsResp = await client.get('/portfolio/holdings');
    const holdings = holdingsResp.data.data || [];
    
    let portfolioValue = 0;
    for (const h of holdings) {
      portfolioValue += (h.last_price || 0) * (h.quantity || 0);
    }

    // Get available margins
    const marginResp = await client.get('/user/margins/equity');
    const availableCash = marginResp.data.data?.available?.cash || 0;
    
    log(`\n💰 Portfolio Status:`);
    log(`   Portfolio Value: ₹${portfolioValue.toLocaleString()}`);
    log(`   Available Cash: ₹${availableCash.toLocaleString()}`);
    log(`   Holdings: ${holdings.length} stocks`);

    // Analyze each symbol in watchlist
    log(`\n📊 Analyzing ${STRATEGY_CONFIG.TRADING_SYMBOLS.length} stocks...`);
    const signals = [];

    for (const symbol of STRATEGY_CONFIG.TRADING_SYMBOLS) {
      const analysis = await analyzeStock(client, symbol, holdings, portfolioValue);
      if (analysis && analysis.signal !== 'HOLD') {
        signals.push(analysis);
        log(`\n${analysis.signal === 'BUY' ? '🟢' : '🔴'} ${analysis.symbol}:`);
        log(`   Signal: ${analysis.signal}`);
        log(`   Price: ₹${analysis.lastPrice}`);
        log(`   RSI: ${analysis.rsi}`);
        log(`   Day Change: ${analysis.dayChange}%`);
        log(`   Suggested Qty: ${analysis.suggestedQty}`);
        log(`   Reason: ${analysis.reason}`);
      }
    }

    if (signals.length === 0) {
      log('\n✅ No trading signals generated. Market conditions are neutral.');
      return;
    }

    // Generate trading report
    const report = {
      timestamp: new Date().toISOString(),
      mode: dryRun ? 'simulation' : 'live',
      portfolioValue,
      availableCash,
      signals,
      summary: {
        buySignals: signals.filter(s => s.signal === 'BUY').length,
        sellSignals: signals.filter(s => s.signal === 'SELL').length,
        totalSignals: signals.length
      }
    };

    const reportPath = path.join(__dirname, 'strategy_signals.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`\n✅ Strategy report saved: ${reportPath}`);

    // Summary
    log('\n📋 Strategy Summary:');
    log(`   Buy Signals: ${report.summary.buySignals}`);
    log(`   Sell Signals: ${report.summary.sellSignals}`);
    log(`   Total Signals: ${report.summary.totalSignals}`);

    if (!dryRun) {
      log('\n⚠️  LIVE MODE: Execute trades manually using generated signals');
      log('   Use: node config/buy/buy-stocks.js --symbol <SYMBOL> --qty <QTY> --confirm');
      log('   Use: node config/sell/sell-stocks.js --symbol <SYMBOL> --qty <QTY> --confirm');
    } else {
      log('\n🔒 SIMULATION MODE: No orders placed');
      log('   To run in live mode, use: node automated-trading-strategy.js --live');
    }

    log('\n' + '='.repeat(60));
    log('Strategy execution completed');
    log('='.repeat(60));

  } catch (error) {
    const errMsg = error.response?.data?.message || error.message;
    log(`❌ Strategy Error: ${errMsg}`);
    console.error(`Error: ${errMsg}`);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const liveMode = args.includes('--live');

// Execute strategy
executeStrategy(!liveMode);
