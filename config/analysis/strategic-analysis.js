const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const CONFIG = {
  MAX_POSITION_SIZE: 0.10,      // 10% max per stock
  MIN_POSITION_SIZE: 0.005,     // 0.5% min meaningful
  PROFIT_BOOK_THRESHOLD: 0.25,  // 25% profit - consider booking
  LOSS_CUT_THRESHOLD: -0.50,    // -50% loss - consider exit
  HIGH_CONCENTRATION: 0.08,     // 8% is high concentration
};

function readSettings() {
  const settingsPath = path.join(process.env.APPDATA, 'Code', 'User', 'settings.json');
  const raw = fs.readFileSync(settingsPath, 'utf8');
  const first = raw.indexOf('{');
  const last = raw.lastIndexOf('}');
  return JSON.parse(raw.slice(first, last + 1));
}

// Simple sector mapping (expand as needed)
const SECTOR_MAP = {
  'INFY': 'IT', 'WIPRO': 'IT', 'KPITTECH': 'IT', 'BSOFT': 'IT', 'SONATSOFTW': 'IT', 'TANLA': 'IT', 'KFINTECH': 'IT',
  'BAJAJ-AUTO': 'Auto', 'MOTHERSON': 'Auto', 'ENDURANCE': 'Auto', 'SUNDRMFAST': 'Auto', 'OLAELEC': 'Auto', 'ATHERENERG': 'Auto',
  'ASIANPAINT': 'Paints', 'INDIGOPNTS': 'Paints',
  'BANDHANBNK': 'Banking', 'YESBANK': 'Banking', 'MAHABANK': 'Banking',
  'NTPC': 'Power', 'POWERGRID': 'Power', 'TORNTPOWER': 'Power', 'SJVN': 'Power', 'CGPOWER': 'Power',
  'ONGC': 'Oil & Gas', 'OIL': 'Oil & Gas', 'MRPL': 'Oil & Gas', 'IGL': 'Oil & Gas', 'GSPL': 'Oil & Gas',
  'MARICO': 'FMCG', 'GODREJCP': 'FMCG', 'JYOTHYLAB': 'FMCG', 'PATANJALI': 'FMCG', 'HATSUN': 'FMCG',
  'GRANULES': 'Pharma', 'ZYDUSLIFE': 'Pharma', 'JBCHEPHARM': 'Pharma', 'ADVENZYMES': 'Pharma',
  'IRFC': 'Infra', 'RVNL': 'Infra', 'KPIL': 'Infra', 'BHEL': 'Infra', 'TITAGARH': 'Infra', 'MEIL': 'Infra',
  'GOLDBEES': 'Gold ETF', 'SILVERBEES': 'Silver ETF', 'NIFTYBEES': 'Index ETF', 'EBBETF0430': 'Bond ETF',
  'SGBSEP31II': 'Sovereign Gold',
  'DIXON': 'Electronics', 'CROMPTON': 'Electronics',
};

function getSector(symbol) {
  return SECTOR_MAP[symbol] || 'Other';
}

(async () => {
  try {
    const settings = readSettings();
    const apiKey = settings['kite.apiKey'];
    const accessToken = settings['kite.accessToken'];
    if (!apiKey || !accessToken) {
      console.error('Missing credentials');
      process.exit(1);
    }

    console.log('📊 Running Strategic Portfolio Analysis...\n');

    const resp = await axios.get('https://api.kite.trade/portfolio/holdings', {
      headers: { 'X-Kite-Version': '3', 'Authorization': `token ${apiKey}:${accessToken}` },
      timeout: 15000
    });

    const holdings = resp.data.data || [];
    if (!holdings.length) {
      console.log('No holdings found.');
      process.exit(0);
    }

    // Calculate totals
    let totalValue = 0;
    let totalInvested = 0;
    const analysis = [];

    for (const h of holdings) {
      const qty = h.quantity || 0;
      const avg = h.average_price || 0;
      const last = h.last_price || 0;
      const current = last * qty;
      const invested = avg * qty;
      totalValue += current;
      totalInvested += invested;
    }

    // Analyze each holding
    for (const h of holdings) {
      const symbol = h.tradingsymbol;
      const qty = h.quantity || 0;
      const avg = h.average_price || 0;
      const last = h.last_price || 0;
      const pnl = h.pnl || 0;
      const dayPct = h.day_change_percentage || 0;
      const current = last * qty;
      const invested = avg * qty;
      const pnlPct = avg ? (last - avg) / avg : 0;
      const weight = current / totalValue;
      const sector = getSector(symbol);

      // Score calculation (1-10)
      let score = 5; // Base score
      let signals = [];

      // Momentum signal
      if (dayPct > 2) { score += 1; signals.push('Strong daily momentum'); }
      else if (dayPct < -3) { score -= 1; signals.push('Weak daily momentum'); }

      // P&L signal
      if (pnlPct > 0.25) { score += 1; signals.push('Strong profit position'); }
      else if (pnlPct < -0.30) { score -= 2; signals.push('Deep loss position'); }

      // Position size signal
      if (weight > CONFIG.MAX_POSITION_SIZE) { score -= 1; signals.push('Over-concentrated'); }
      if (weight < CONFIG.MIN_POSITION_SIZE && pnlPct > 0) { signals.push('Underweight winner'); }

      // Clamp score
      score = Math.max(1, Math.min(10, score));

      // Determine action
      let action = 'HOLD';
      let suggestion = '';

      if (pnlPct >= CONFIG.PROFIT_BOOK_THRESHOLD && weight > CONFIG.HIGH_CONCENTRATION) {
        action = 'REDUCE';
        suggestion = `Book partial profit, reduce to ${(CONFIG.HIGH_CONCENTRATION * 100).toFixed(0)}% weight`;
      } else if (pnlPct <= CONFIG.LOSS_CUT_THRESHOLD) {
        action = 'EXIT';
        suggestion = 'Cut losses, exit position';
      } else if (weight > CONFIG.MAX_POSITION_SIZE) {
        action = 'REDUCE';
        suggestion = `Reduce concentration to ${(CONFIG.MAX_POSITION_SIZE * 100).toFixed(0)}% max`;
      } else if (pnlPct > 0.15 && weight < 0.02 && score >= 6) {
        action = 'ADD';
        suggestion = 'Good performer, consider adding';
      }

      analysis.push({
        symbol,
        sector,
        quantity: qty,
        avgPrice: Number(avg.toFixed(2)),
        lastPrice: Number(last.toFixed(2)),
        invested: Number(invested.toFixed(2)),
        current: Number(current.toFixed(2)),
        pnl: Number(pnl.toFixed(2)),
        pnlPct: Number((pnlPct * 100).toFixed(2)),
        dayChangePct: Number(dayPct.toFixed(2)),
        weight: Number((weight * 100).toFixed(2)),
        score,
        signals,
        action,
        suggestion
      });
    }

    // Sort by score descending
    analysis.sort((a, b) => b.score - a.score);

    // Sector analysis
    const sectors = {};
    for (const a of analysis) {
      if (!sectors[a.sector]) {
        sectors[a.sector] = { value: 0, count: 0, stocks: [] };
      }
      sectors[a.sector].value += a.current;
      sectors[a.sector].count++;
      sectors[a.sector].stocks.push(a.symbol);
    }
    for (const s in sectors) {
      sectors[s].weight = Number((sectors[s].value / totalValue * 100).toFixed(2));
    }

    // Generate report
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalStocks: holdings.length,
        totalInvested: Number(totalInvested.toFixed(2)),
        totalValue: Number(totalValue.toFixed(2)),
        totalPnL: Number((totalValue - totalInvested).toFixed(2)),
        totalPnLPct: Number(((totalValue - totalInvested) / totalInvested * 100).toFixed(2))
      },
      sectorBreakdown: sectors,
      holdings: analysis,
      actionSummary: {
        exit: analysis.filter(a => a.action === 'EXIT'),
        reduce: analysis.filter(a => a.action === 'REDUCE'),
        add: analysis.filter(a => a.action === 'ADD'),
        hold: analysis.filter(a => a.action === 'HOLD')
      }
    };

    // Save JSON
    const jsonPath = path.join(__dirname, 'analysis_report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    console.log(`✅ Saved: ${jsonPath}`);

    // Generate text summary
    let txt = `Strategic Portfolio Analysis - ${new Date().toLocaleString()}\n`;
    txt += `${'='.repeat(60)}\n\n`;
    txt += `📊 PORTFOLIO SUMMARY\n`;
    txt += `   Total Invested: ₹${report.summary.totalInvested.toLocaleString()}\n`;
    txt += `   Current Value:  ₹${report.summary.totalValue.toLocaleString()}\n`;
    txt += `   Total P&L:      ₹${report.summary.totalPnL.toLocaleString()} (${report.summary.totalPnLPct}%)\n`;
    txt += `   Positions:      ${report.summary.totalStocks}\n\n`;

    txt += `📈 SECTOR ALLOCATION\n`;
    const sortedSectors = Object.entries(sectors).sort((a, b) => b[1].weight - a[1].weight);
    for (const [name, data] of sortedSectors) {
      txt += `   ${name}: ${data.weight}% (${data.count} stocks)\n`;
    }
    txt += '\n';

    if (report.actionSummary.exit.length) {
      txt += `🔴 EXIT RECOMMENDATIONS (${report.actionSummary.exit.length})\n`;
      for (const a of report.actionSummary.exit) {
        txt += `   ${a.symbol}: P&L ${a.pnlPct}% | ${a.suggestion}\n`;
      }
      txt += '\n';
    }

    if (report.actionSummary.reduce.length) {
      txt += `🟡 REDUCE RECOMMENDATIONS (${report.actionSummary.reduce.length})\n`;
      for (const a of report.actionSummary.reduce) {
        txt += `   ${a.symbol}: Weight ${a.weight}%, P&L ${a.pnlPct}% | ${a.suggestion}\n`;
      }
      txt += '\n';
    }

    if (report.actionSummary.add.length) {
      txt += `🟢 ADD RECOMMENDATIONS (${report.actionSummary.add.length})\n`;
      for (const a of report.actionSummary.add) {
        txt += `   ${a.symbol}: Weight ${a.weight}%, Score ${a.score}/10 | ${a.suggestion}\n`;
      }
      txt += '\n';
    }

    txt += `📋 TOP 10 BY SCORE\n`;
    for (const a of analysis.slice(0, 10)) {
      txt += `   ${a.score}/10 ${a.symbol} (${a.sector}): ${a.weight}% weight, ${a.pnlPct}% P&L\n`;
    }

    const summaryPath = path.join(__dirname, 'analysis_summary.txt');
    fs.writeFileSync(summaryPath, txt);
    console.log(`✅ Saved: ${summaryPath}`);

    // Rebalance CSV
    const rebalance = [...report.actionSummary.exit, ...report.actionSummary.reduce, ...report.actionSummary.add];
    if (rebalance.length) {
      const csvRows = [['Symbol', 'Action', 'Current Weight %', 'P&L %', 'Suggestion']];
      for (const r of rebalance) {
        csvRows.push([r.symbol, r.action, r.weight, r.pnlPct, r.suggestion]);
      }
      const csvPath = path.join(__dirname, 'rebalance_suggestions.csv');
      fs.writeFileSync(csvPath, csvRows.map(r => r.join(',')).join('\n'));
      console.log(`✅ Saved: ${csvPath}`);
    }

    // Print summary
    console.log('\n' + txt);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
})();
