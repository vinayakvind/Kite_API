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
  const logPath = path.join(__dirname, 'daily-profit.log');
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
  console.log(`[${timestamp}] ${msg}`);
}

// Load or initialize profit tracking data
function loadProfitData() {
  const dataPath = path.join(__dirname, 'daily-profit-data.json');
  if (fs.existsSync(dataPath)) {
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  }
  return {
    startDate: new Date().toISOString().split('T')[0],
    dailyRecords: [],
    totalProfit: 0,
    winningDays: 0,
    losingDays: 0
  };
}

function saveProfitData(data) {
  const dataPath = path.join(__dirname, 'daily-profit-data.json');
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

async function trackDailyProfit() {
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

    log('📊 Fetching today\'s portfolio data...');

    // Get holdings
    const holdingsResp = await client.get('/portfolio/holdings');
    const holdings = holdingsResp.data.data || [];

    // Calculate current portfolio value
    let totalValue = 0;
    let totalInvested = 0;
    let todayPnL = 0;

    for (const h of holdings) {
      const qty = h.quantity || 0;
      const lastPrice = h.last_price || 0;
      const avgPrice = h.average_price || 0;
      const dayChange = h.day_change || 0;

      const currentValue = lastPrice * qty;
      const investedValue = avgPrice * qty;

      totalValue += currentValue;
      totalInvested += investedValue;
      todayPnL += dayChange * qty;
    }

    // Get positions for intraday P&L
    const positionsResp = await client.get('/portfolio/positions');
    const positions = positionsResp.data.data?.net || [];

    let intradayPnL = 0;
    for (const p of positions) {
      intradayPnL += p.pnl || 0;
    }

    // Total today's P&L
    const totalTodayPnL = todayPnL + intradayPnL;
    const totalOverallPnL = totalValue - totalInvested;
    const todayDate = new Date().toISOString().split('T')[0];

    // Load tracking data
    const profitData = loadProfitData();

    // Check if today's record already exists
    const existingRecordIndex = profitData.dailyRecords.findIndex(
      r => r.date === todayDate
    );

    const todayRecord = {
      date: todayDate,
      portfolioValue: Number(totalValue.toFixed(2)),
      todayPnL: Number(totalTodayPnL.toFixed(2)),
      overallPnL: Number(totalOverallPnL.toFixed(2)),
      holdings: holdings.length,
      intradayPnL: Number(intradayPnL.toFixed(2)),
      deliveryPnL: Number(todayPnL.toFixed(2))
    };

    if (existingRecordIndex >= 0) {
      // Update existing record
      profitData.dailyRecords[existingRecordIndex] = todayRecord;
      log('Updated existing record for today');
    } else {
      // Add new record
      profitData.dailyRecords.push(todayRecord);
      
      // Update win/loss counters
      if (totalTodayPnL > 0) {
        profitData.winningDays++;
      } else if (totalTodayPnL < 0) {
        profitData.losingDays++;
      }
      
      log('Added new record for today');
    }

    // Update total profit
    profitData.totalProfit = profitData.dailyRecords.reduce(
      (sum, r) => sum + r.todayPnL, 
      0
    );

    // Save data
    saveProfitData(profitData);

    // Display summary
    log('\n' + '='.repeat(60));
    log('💰 Daily Profit Summary');
    log('='.repeat(60));
    log(`Date: ${todayDate}`);
    log(`Portfolio Value: ₹${totalValue.toLocaleString('en-IN')}`);
    log(`Today's P&L: ${totalTodayPnL >= 0 ? '+' : ''}₹${totalTodayPnL.toLocaleString('en-IN')}`);
    log(`  - Delivery P&L: ₹${todayPnL.toFixed(2)}`);
    log(`  - Intraday P&L: ₹${intradayPnL.toFixed(2)}`);
    log(`Overall P&L: ${totalOverallPnL >= 0 ? '+' : ''}₹${totalOverallPnL.toLocaleString('en-IN')}`);
    log('');
    log('📈 Performance Statistics:');
    log(`Total Days Tracked: ${profitData.dailyRecords.length}`);
    log(`Winning Days: ${profitData.winningDays} (${((profitData.winningDays / profitData.dailyRecords.length) * 100).toFixed(1)}%)`);
    log(`Losing Days: ${profitData.losingDays} (${((profitData.losingDays / profitData.dailyRecords.length) * 100).toFixed(1)}%)`);
    log(`Cumulative Profit: ${profitData.totalProfit >= 0 ? '+' : ''}₹${profitData.totalProfit.toLocaleString('en-IN')}`);
    
    if (profitData.dailyRecords.length > 1) {
      const avgDailyProfit = profitData.totalProfit / profitData.dailyRecords.length;
      log(`Avg Daily Profit: ₹${avgDailyProfit.toFixed(2)}`);
    }
    
    log('='.repeat(60));

    // Show last 5 days
    if (profitData.dailyRecords.length > 1) {
      log('\n📅 Last 5 Days:');
      const lastFive = profitData.dailyRecords.slice(-5).reverse();
      for (const record of lastFive) {
        const indicator = record.todayPnL >= 0 ? '🟢' : '🔴';
        log(`${indicator} ${record.date}: ${record.todayPnL >= 0 ? '+' : ''}₹${record.todayPnL.toFixed(2)}`);
      }
    }

    log('\n✅ Daily profit tracking completed');
    log(`📁 Data saved to: ${path.join(__dirname, 'daily-profit-data.json')}`);

  } catch (error) {
    const errMsg = error.response?.data?.message || error.message;
    log(`❌ Error: ${errMsg}`);
    console.error(`Error: ${errMsg}`);
    process.exit(1);
  }
}

// Run tracker
trackDailyProfit();
