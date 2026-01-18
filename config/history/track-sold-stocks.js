const fs = require('fs');
const path = require('path');
const axios = require('axios');

const DATA_FILE = path.join(__dirname, 'sold_stocks.json');
const DEFAULT_TARGET_DROP = 15; // 15% below sold price

function readSettings() {
  const settingsPath = path.join(process.env.APPDATA, 'Code', 'User', 'settings.json');
  const raw = fs.readFileSync(settingsPath, 'utf8');
  const first = raw.indexOf('{');
  const last = raw.lastIndexOf('}');
  return JSON.parse(raw.slice(first, last + 1));
}

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    return { stocks: [] };
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const args = process.argv.slice(2);
function hasArg(name) { return args.includes(`--${name}`); }
function getArg(name, defaultVal) {
  const idx = args.findIndex(a => a === `--${name}`);
  if (idx === -1) return defaultVal;
  return args[idx + 1] || defaultVal;
}

const mode = hasArg('add') ? 'add' : hasArg('remove') ? 'remove' : hasArg('list') ? 'list' : hasArg('check') ? 'check' : 'help';
const symbol = getArg('symbol', '');
const soldPrice = parseFloat(getArg('soldPrice', '0'));
const soldQty = parseInt(getArg('soldQty', '0'), 10);
const targetDrop = parseFloat(getArg('targetDrop', DEFAULT_TARGET_DROP.toString()));

(async () => {
  const data = loadData();

  if (mode === 'help') {
    console.log(`
Sold Stocks Tracker
===================
Usage:
  --add --symbol SYM --soldPrice 100 --soldQty 10 [--targetDrop 15]
  --check      Check all tracked stocks for re-entry
  --list       List all tracked stocks
  --remove --symbol SYM
`);
    process.exit(0);
  }

  if (mode === 'add') {
    if (!symbol || soldPrice <= 0 || soldQty <= 0) {
      console.error('Usage: --add --symbol SYM --soldPrice 100 --soldQty 10');
      process.exit(1);
    }

    // Check if already exists
    const existing = data.stocks.find(s => s.symbol === symbol);
    if (existing) {
      console.log(`Updating existing entry for ${symbol}`);
      existing.soldPrice = soldPrice;
      existing.soldQty = soldQty;
      existing.targetDrop = targetDrop;
      existing.soldDate = new Date().toISOString();
    } else {
      data.stocks.push({
        symbol,
        soldPrice,
        soldQty,
        targetDrop,
        soldDate: new Date().toISOString(),
        exchange: 'NSE'
      });
    }
    saveData(data);
    console.log(`✅ Added ${symbol} to tracking`);
    console.log(`   Sold at: ₹${soldPrice} x ${soldQty}`);
    console.log(`   Target re-entry: ₹${(soldPrice * (1 - targetDrop / 100)).toFixed(2)} (${targetDrop}% drop)`);
    process.exit(0);
  }

  if (mode === 'remove') {
    if (!symbol) {
      console.error('Usage: --remove --symbol SYM');
      process.exit(1);
    }
    const idx = data.stocks.findIndex(s => s.symbol === symbol);
    if (idx === -1) {
      console.log(`${symbol} not found in tracking`);
      process.exit(1);
    }
    data.stocks.splice(idx, 1);
    saveData(data);
    console.log(`✅ Removed ${symbol} from tracking`);
    process.exit(0);
  }

  if (mode === 'list') {
    if (!data.stocks.length) {
      console.log('No stocks being tracked. Use --add to add one.');
      process.exit(0);
    }
    console.log('\n📋 Tracked Sold Stocks:\n');
    console.table(data.stocks.map(s => ({
      Symbol: s.symbol,
      'Sold Price': `₹${s.soldPrice}`,
      Qty: s.soldQty,
      'Target Drop': `${s.targetDrop}%`,
      'Target Price': `₹${(s.soldPrice * (1 - s.targetDrop / 100)).toFixed(2)}`,
      'Sold Date': new Date(s.soldDate).toLocaleDateString()
    })));
    process.exit(0);
  }

  if (mode === 'check') {
    if (!data.stocks.length) {
      console.log('No stocks being tracked. Use --add to add one.');
      process.exit(0);
    }

    const settings = readSettings();
    const apiKey = settings['kite.apiKey'];
    const accessToken = settings['kite.accessToken'];
    if (!apiKey || !accessToken) {
      console.error('Missing credentials');
      process.exit(1);
    }

    console.log(`\n📊 Checking ${data.stocks.length} tracked stocks for re-entry...\n`);

    const client = axios.create({
      baseURL: 'https://api.kite.trade',
      timeout: 15000,
      headers: { 'X-Kite-Version': '3', 'Authorization': `token ${apiKey}:${accessToken}` }
    });

    // Get current holdings to exclude already owned
    let currentHoldings = [];
    try {
      const holdingsResp = await client.get('/portfolio/holdings');
      currentHoldings = (holdingsResp.data.data || []).map(h => h.tradingsymbol);
    } catch (e) {
      console.log('Warning: Could not fetch current holdings');
    }

    const opportunities = [];
    const monitoring = [];
    const notRecommended = [];

    for (const stock of data.stocks) {
      const instrument = `${stock.exchange || 'NSE'}:${stock.symbol}`;
      try {
        const quoteResp = await client.get('/quote', { params: { i: instrument } });
        const quote = quoteResp.data.data[instrument];
        if (!quote) {
          console.log(`   ⚠️ ${stock.symbol}: Quote not available`);
          continue;
        }

        const lastPrice = quote.last_price || 0;
        const dayChange = quote.change || 0;
        const dayChangePct = quote.ohlc?.close ? (dayChange / quote.ohlc.close * 100) : 0;
        const dropFromSold = ((stock.soldPrice - lastPrice) / stock.soldPrice) * 100;
        const targetPrice = stock.soldPrice * (1 - stock.targetDrop / 100);
        const alreadyOwned = currentHoldings.includes(stock.symbol);

        const result = {
          symbol: stock.symbol,
          soldPrice: stock.soldPrice,
          soldQty: stock.soldQty,
          lastPrice,
          dropPct: Number(dropFromSold.toFixed(2)),
          targetDrop: stock.targetDrop,
          targetPrice: Number(targetPrice.toFixed(2)),
          dayChangePct: Number(dayChangePct.toFixed(2)),
          alreadyOwned
        };

        if (alreadyOwned) {
          result.status = 'ALREADY_OWNED';
          monitoring.push(result);
        } else if (dropFromSold >= stock.targetDrop && dayChangePct > 0) {
          result.status = 'OPPORTUNITY';
          opportunities.push(result);
        } else if (dropFromSold >= stock.targetDrop && dayChangePct <= 0) {
          result.status = 'NOT_RECOMMENDED';
          notRecommended.push(result);
        } else {
          result.status = 'MONITORING';
          monitoring.push(result);
        }
      } catch (e) {
        console.log(`   ⚠️ ${stock.symbol}: Error fetching quote`);
      }
    }

    // Print results
    if (opportunities.length) {
      console.log('🟢 RE-ENTRY OPPORTUNITIES:');
      for (const o of opportunities) {
        console.log(`   ${o.symbol}: Sold ₹${o.soldPrice} → Now ₹${o.lastPrice} (${o.dropPct}% drop)`);
        console.log(`      Daily: ${o.dayChangePct > 0 ? '+' : ''}${o.dayChangePct}% ✓ positive momentum`);
        console.log(`      Suggested: BUY ${o.soldQty} shares\n`);
      }
    }

    if (monitoring.length) {
      console.log('🟡 MONITORING:');
      for (const m of monitoring) {
        const reason = m.alreadyOwned ? '(already in holdings)' : `(target: ${m.targetDrop}% drop)`;
        console.log(`   ${m.symbol}: ${m.dropPct}% below sold price ${reason}`);
      }
      console.log('');
    }

    if (notRecommended.length) {
      console.log('🔴 NOT RECOMMENDED (negative momentum):');
      for (const n of notRecommended) {
        console.log(`   ${n.symbol}: ${n.dropPct}% drop but daily ${n.dayChangePct}%`);
      }
      console.log('');
    }

    // Save results
    const resultsPath = path.join(__dirname, 'check_results.json');
    fs.writeFileSync(resultsPath, JSON.stringify({
      checkedAt: new Date().toISOString(),
      opportunities,
      monitoring,
      notRecommended
    }, null, 2));
    console.log(`✅ Results saved to: ${resultsPath}`);

    process.exit(0);
  }
})();
