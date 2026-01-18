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
  if (name === 'confirm') return true;
  return args[idx + 1] || defaultVal;
}

const symbol = getArg('symbol', null);
const qty = parseInt(getArg('qty', '0'), 10);
const exchange = getArg('exchange', 'NSE');
const orderType = getArg('order_type', 'MARKET');
const product = getArg('product', 'CNC');
const price = parseFloat(getArg('price', '0')) || undefined;
const triggerPrice = parseFloat(getArg('trigger_price', '0')) || undefined;
const confirm = getArg('confirm', false);

(async () => {
  try {
    if (!symbol || qty <= 0) {
      console.error('Usage: node buy-stocks.js --symbol SYMBOL --qty QTY [--exchange NSE] [--order_type MARKET] [--product CNC] [--price 100] [--confirm]');
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

    // Step 1: Get quote for price estimate
    console.log(`\n📈 Fetching quote for ${exchange}:${symbol}...`);
    let lastPrice = 0;
    try {
      const quoteResp = await client.get('/quote', { params: { i: `${exchange}:${symbol}` } });
      const quoteData = quoteResp.data.data[`${exchange}:${symbol}`];
      lastPrice = quoteData?.last_price || 0;
      console.log(`   Last price: ₹${lastPrice}`);
    } catch (e) {
      console.log('   Could not fetch quote (symbol may be invalid)');
    }

    // Step 2: Check margins
    console.log('\n💰 Checking available margins...');
    try {
      const marginResp = await client.get('/user/margins/equity');
      const available = marginResp.data.data?.available?.cash || 0;
      console.log(`   Available cash: ₹${available.toFixed(2)}`);
      const estimatedCost = lastPrice * qty;
      console.log(`   Estimated cost: ₹${estimatedCost.toFixed(2)}`);
      if (estimatedCost > available && product === 'CNC') {
        console.warn('   ⚠️  Warning: Estimated cost exceeds available cash');
      }
    } catch (e) {
      console.log('   Could not fetch margins');
    }

    // Step 3: Build order payload
    const payload = {
      exchange,
      tradingsymbol: symbol,
      transaction_type: 'BUY',
      quantity: qty,
      order_type: orderType,
      product
    };
    if (price) payload.price = price;
    if (triggerPrice) payload.trigger_price = triggerPrice;

    console.log('\n📋 Order Preview:');
    console.log('   ─────────────────────────────');
    console.log(`   Action:      BUY`);
    console.log(`   Symbol:      ${exchange}:${symbol}`);
    console.log(`   Quantity:    ${qty}`);
    console.log(`   Order Type:  ${orderType}`);
    console.log(`   Product:     ${product}`);
    if (price) console.log(`   Price:       ₹${price}`);
    console.log('   ─────────────────────────────');

    if (!confirm) {
      console.log('\n🔒 SIMULATION MODE - No order placed');
      console.log('   To place real order, add --confirm flag');
      log(`SIMULATED BUY: ${symbol} x ${qty} @ ${orderType}`);
      process.exit(0);
    }

    // Step 4: Place order
    console.log('\n🚀 Placing order...');
    const resp = await client.post('/orders/regular', payload);
    const orderId = resp.data.data?.order_id;
    console.log(`\n✅ Order placed successfully!`);
    console.log(`   Order ID: ${orderId}`);
    log(`ORDER PLACED: BUY ${symbol} x ${qty} @ ${orderType} | Order ID: ${orderId}`);

    process.exit(0);
  } catch (err) {
    const errMsg = err.response?.data?.message || err.message;
    console.error(`\n❌ Error: ${errMsg}`);
    log(`ERROR: BUY ${symbol} x ${qty} - ${errMsg}`);
    process.exit(1);
  }
})();
