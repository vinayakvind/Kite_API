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

function pct(a, b) { return ((b - a) / a) * 100; }

(async () => {
  try {
    const settings = readSettings();
    const apiKey = settings['kite.apiKey'];
    const accessToken = settings['kite.accessToken'];
    if (!apiKey || !accessToken) {
      console.error('Missing kite.apiKey or kite.accessToken in settings.json');
      process.exit(1);
    }

    console.log('📊 Fetching holdings...');
    const resp = await axios.get('https://api.kite.trade/portfolio/holdings', {
      headers: { 'X-Kite-Version': '3', 'Authorization': `token ${apiKey}:${accessToken}` },
      timeout: 15000
    });

    const holdings = resp.data.data || [];
    if (!holdings.length) {
      console.log('No holdings found.');
      process.exit(0);
    }

    console.log(`📈 Analyzing ${holdings.length} stocks...`);

    let totalInvested = 0;
    let totalCurrent = 0;
    let totalPnL = 0;

    const recommendations = holdings.map(h => {
      const avg = h.average_price || 0;
      const last = h.last_price || 0;
      const qty = h.quantity || 0;
      const pnl = h.pnl || 0;
      const pnlPercent = avg ? pct(avg, last) : 0;
      const dayPct = h.day_change_percentage || 0;
      const invested = avg * qty;
      const current = last * qty;

      totalInvested += invested;
      totalCurrent += current;
      totalPnL += pnl;

      // Recommendation logic
      let action = 'HOLD';
      let reason = 'Within normal range';
      let priority = 2; // 1=urgent, 2=normal, 3=low

      if (pnlPercent >= 25) {
        action = 'SELL';
        reason = 'Take profit (≥25% gain)';
        priority = 1;
      } else if (last < avg * 0.5) {
        action = 'SELL';
        reason = 'Cut loss (>50% down)';
        priority = 1;
      } else if (dayPct <= -10 && pnl > 0) {
        action = 'SELL';
        reason = 'Protect profit (sudden drop)';
        priority = 1;
      } else if (pnlPercent <= -20 && dayPct > 0) {
        action = 'BUY';
        reason = 'Dip recovery opportunity';
        priority = 2;
      } else if (pnlPercent >= 15) {
        action = 'HOLD';
        reason = 'Good profit, monitor for exit';
        priority = 3;
      } else if (pnlPercent <= -30) {
        action = 'HOLD';
        reason = 'Deep loss, wait for recovery';
        priority = 2;
      }

      return {
        symbol: h.tradingsymbol,
        exchange: h.exchange || 'NSE',
        quantity: qty,
        avgPrice: Number(avg.toFixed(2)),
        lastPrice: Number(last.toFixed(2)),
        invested: Number(invested.toFixed(2)),
        current: Number(current.toFixed(2)),
        pnl: Number(pnl.toFixed(2)),
        pnlPercent: Number(pnlPercent.toFixed(2)),
        dayChangePct: Number(dayPct.toFixed(2)),
        action,
        reason,
        priority
      };
    });

    // Sort by priority then by absolute P&L
    recommendations.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return Math.abs(b.pnl) - Math.abs(a.pnl);
    });

    const summary = {
      generatedAt: new Date().toISOString(),
      totalStocks: holdings.length,
      totalInvested: Number(totalInvested.toFixed(2)),
      totalCurrent: Number(totalCurrent.toFixed(2)),
      totalPnL: Number(totalPnL.toFixed(2)),
      totalPnLPercent: Number(pct(totalInvested, totalCurrent).toFixed(2)),
      buyCount: recommendations.filter(r => r.action === 'BUY').length,
      sellCount: recommendations.filter(r => r.action === 'SELL').length,
      holdCount: recommendations.filter(r => r.action === 'HOLD').length,
      recommendations
    };

    // Save JSON
    const jsonPath = path.join(__dirname, 'recommendations.json');
    fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));
    console.log(`✅ Saved: ${jsonPath}`);

    // Generate webapp data.js
    const dataJsPath = path.join(__dirname, 'webapp', 'data.js');
    fs.mkdirSync(path.dirname(dataJsPath), { recursive: true });
    fs.writeFileSync(dataJsPath, `// Auto-generated - ${summary.generatedAt}\nwindow.portfolioData = ${JSON.stringify(summary, null, 2)};`);
    console.log(`✅ Saved: ${dataJsPath}`);

    // Generate text summary
    const summaryPath = path.join(__dirname, 'summary.txt');
    let txt = `Portfolio Recommendations - ${new Date().toLocaleString()}\n`;
    txt += `${'='.repeat(50)}\n\n`;
    txt += `Total Invested: ₹${summary.totalInvested.toLocaleString()}\n`;
    txt += `Current Value:  ₹${summary.totalCurrent.toLocaleString()}\n`;
    txt += `Total P&L:      ₹${summary.totalPnL.toLocaleString()} (${summary.totalPnLPercent}%)\n\n`;
    txt += `Actions: ${summary.buyCount} BUY | ${summary.sellCount} SELL | ${summary.holdCount} HOLD\n\n`;

    const sells = recommendations.filter(r => r.action === 'SELL');
    const buys = recommendations.filter(r => r.action === 'BUY');

    if (sells.length) {
      txt += `🔴 SELL Recommendations:\n`;
      sells.forEach(r => {
        txt += `   ${r.symbol}: ${r.quantity} @ ₹${r.lastPrice} | P&L: ₹${r.pnl} (${r.pnlPercent}%) - ${r.reason}\n`;
      });
      txt += '\n';
    }

    if (buys.length) {
      txt += `🟢 BUY Recommendations:\n`;
      buys.forEach(r => {
        txt += `   ${r.symbol}: Add more @ ₹${r.lastPrice} | Current P&L: ₹${r.pnl} (${r.pnlPercent}%) - ${r.reason}\n`;
      });
    }

    fs.writeFileSync(summaryPath, txt);
    console.log(`✅ Saved: ${summaryPath}`);

    // Print summary
    console.log('\n' + txt);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.response ? (err.response.data || err.response.statusText) : err.message);
    process.exit(1);
  }
})();
