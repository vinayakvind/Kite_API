const fs = require('fs');
const path = require('path');
const axios = require('axios');

function readSettings(){
  const settingsPath = path.join(process.env.APPDATA, 'Code', 'User', 'settings.json');
  const raw = fs.readFileSync(settingsPath, 'utf8');
  const first = raw.indexOf('{');
  const last = raw.lastIndexOf('}');
  return JSON.parse(raw.slice(first, last+1));
}

function pct(a,b){ return ((b-a)/a)*100; }

(async ()=>{
  try{
    const settings = readSettings();
    const apiKey = settings['kite.apiKey'];
    const accessToken = settings['kite.accessToken'];
    if(!apiKey || !accessToken){
      console.error('Missing kite.apiKey or kite.accessToken in settings.json');
      process.exit(1);
    }

    const resp = await axios.get('https://api.kite.trade/portfolio/holdings', {
      headers: { 'X-Kite-Version':'3', 'Authorization': `token ${apiKey}:${accessToken}` },
      timeout: 15000
    });

    const holdings = resp.data.data || [];
    if(!holdings.length){
      console.log('No holdings found.');
      process.exit(0);
    }

    const recommendations = holdings.map(h => {
      const avg = h.average_price || 0;
      const last = h.last_price || 0;
      const qty = h.quantity || 0;
      const pnl = h.pnl || 0;
      const pnlPercent = avg ? pct(avg, last) : 0;
      const dayPct = h.day_change_percentage || 0;

      // Simple rule-based recommendations (informational only):
      // - SELL: take profits (>=25%), or big drop (last < avg*0.5), or sudden crash while in profit
      // - BUY: add on deep dip (<= -20%) if daily momentum is positive
      // - HOLD: otherwise
      let action = 'HOLD';
      if (pnlPercent >= 25) action = 'SELL (take profit)';
      else if (last < avg * 0.5) action = 'SELL (cut big loss)';
      else if (dayPct <= -10 && pnl > 0) action = 'SELL (protect profit)';
      else if (pnlPercent <= -20 && dayPct > 0) action = 'BUY (dip recovery)';

      return {
        tradingsymbol: h.tradingsymbol,
        quantity: qty,
        average_price: avg,
        last_price: last,
        pnl: pnl,
        pnlPercent: Number(pnlPercent.toFixed(2)),
        day_change_pct: Number(dayPct),
        recommendation: action
      };
    });

    // Print a table
    console.log('\nPortfolio recommendations (informational only):\n');
    console.table(recommendations, ['tradingsymbol','quantity','average_price','last_price','pnl','pnlPercent','day_change_pct','recommendation']);

    // Save CSV
    const csvRows = [['symbol','qty','avg_price','last_price','pnl','pnl_pct','day_pct','recommendation']];
    for(const r of recommendations){
      csvRows.push([r.tradingsymbol,r.quantity,r.average_price,r.last_price,r.pnl,r.pnlPercent,r.day_change_pct,r.recommendation]);
    }
    const out = csvRows.map(r => r.join(',')).join('\n');
    const outPath = path.join(process.cwd(),'portfolio_recommendations.csv');
    fs.writeFileSync(outPath,out,'utf8');
    console.log('\nSaved CSV:', outPath);

    process.exit(0);
  }catch(err){
    console.error('Error:', err.response ? (err.response.data || err.response.statusText) : err.message);
    process.exit(1);
  }
})();
