const fs = require('fs');
const path = require('path');
const axios = require('axios');

function readSettings() {
  const settingsPath = path.join(process.env.APPDATA, 'Code', 'User', 'settings.json');
  const raw = fs.readFileSync(settingsPath, 'utf8');
  const first = raw.indexOf('{');
  const last = raw.lastIndexOf('}');
  return JSON.parse(raw.slice(first, last + 1));
}

function log(msg) {
  const logPath = path.join(__dirname, 'orders.log');
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
  console.log(msg);
}

const args = process.argv.slice(2);
function getArg(name, defaultVal) {
  const idx = args.findIndex(a => a === `--${name}`);
  if (idx === -1) return defaultVal;
  if (name === 'confirm' || name === 'all') return true;
  return args[idx + 1] || defaultVal;
}

const symbol = getArg('symbol', null);
let qty = parseInt(getArg('qty', '0'), 10);
const sellAll = getArg('all', false);
const exchange = getArg('exchange', 'NSE');
const orderType = getArg('order_type', 'MARKET');
const product = getArg('product', 'CNC');
const price = parseFloat(getArg('price', '0')) || undefined;
const triggerPrice = parseFloat(getArg('trigger_price', '0')) || undefined;
const confirm = getArg('confirm', false);

(async () => {
  try {
    if (!symbol) {
      console.error('Usage: node sell-stocks.js --symbol SYMBOL --qty QTY [--all] [--exchange NSE] [--order_type MARKET] [--product CNC] [--price 100] [--confirm]');
      process.exit(1);
    }

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

    // Step 1: Check holdings
    console.log(`\n📊 Checking holdings for ${symbol}...`);
    const holdingsResp = await client.get('/portfolio/holdings');
    const holdings = holdingsResp.data.data || [];
    const holding = holdings.find(h => h.tradingsymbol === symbol);

    if (!holding) {
      console.error(`❌ No holdings found for ${symbol}`);
      process.exit(1);
    }

    const availableQty = holding.quantity || 0;
    const avgPrice = holding.average_price || 0;
    const lastPrice = holding.last_price || 0;
    const pnl = holding.pnl || 0;
    const pnlPct = avgPrice ? ((lastPrice - avgPrice) / avgPrice * 100).toFixed(2) : 0;

    console.log(`   Available: ${availableQty} shares`);
    console.log(`   Avg Price: ₹${avgPrice.toFixed(2)}`);
    console.log(`   Last Price: ₹${lastPrice.toFixed(2)}`);
    console.log(`   P&L: ₹${pnl.toFixed(2)} (${pnlPct}%)`);

    if (sellAll) {
      qty = availableQty;
      console.log(`   Selling ALL: ${qty} shares`);
    }

    if (qty <= 0) {
      console.error('❌ Quantity must be > 0');
      process.exit(1);
    }

    if (qty > availableQty) {
      console.error(`❌ Cannot sell ${qty} shares - only ${availableQty} available`);
      process.exit(1);
    }

    // Step 2: P&L warning
    if (pnlPct < -20) {
      console.log(`\n⚠️  WARNING: Selling at ${pnlPct}% loss!`);
    }

    // Step 3: Build order payload
    const payload = {
      exchange,
      tradingsymbol: symbol,
      transaction_type: 'SELL',
      quantity: qty,
      order_type: orderType,
      product
    };
    if (price) payload.price = price;
    if (triggerPrice) payload.trigger_price = triggerPrice;

    const estimatedProceeds = lastPrice * qty;
    const realizedPnL = (lastPrice - avgPrice) * qty;

    console.log('\n📋 Order Preview:');
    console.log('   ─────────────────────────────');
    console.log(`   Action:      SELL`);
    console.log(`   Symbol:      ${exchange}:${symbol}`);
    console.log(`   Quantity:    ${qty} of ${availableQty}`);
    console.log(`   Order Type:  ${orderType}`);
    console.log(`   Product:     ${product}`);
    if (price) console.log(`   Price:       ₹${price}`);
    console.log(`   Est. Proceeds: ₹${estimatedProceeds.toFixed(2)}`);
    console.log(`   Est. P&L:    ₹${realizedPnL.toFixed(2)}`);
    console.log('   ─────────────────────────────');

    if (!confirm) {
      console.log('\n🔒 SIMULATION MODE - No order placed');
      console.log('   To place real order, add --confirm flag');
      log(`SIMULATED SELL: ${symbol} x ${qty} @ ${orderType} | Est P&L: ₹${realizedPnL.toFixed(2)}`);
      process.exit(0);
    }

    // Step 4: Place order
    console.log('\n🚀 Placing sell order...');
    const resp = await client.post('/orders/regular', payload);
    const orderId = resp.data.data?.order_id;
    console.log(`\n✅ Sell order placed successfully!`);
    console.log(`   Order ID: ${orderId}`);
    log(`ORDER PLACED: SELL ${symbol} x ${qty} @ ${orderType} | Order ID: ${orderId} | Est P&L: ₹${realizedPnL.toFixed(2)}`);

    process.exit(0);
  } catch (err) {
    const errMsg = err.response?.data?.message || err.message;
    console.error(`\n❌ Error: ${errMsg}`);
    log(`ERROR: SELL ${symbol} - ${errMsg}`);
    process.exit(1);
  }
})();
