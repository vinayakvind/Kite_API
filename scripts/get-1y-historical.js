const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function readSettings(){
  const settingsPath = path.join(process.env.APPDATA, 'Code', 'User', 'settings.json');
  const raw = fs.readFileSync(settingsPath, 'utf8');
  const first = raw.indexOf('{');
  const last = raw.lastIndexOf('}');
  const settings = JSON.parse(raw.slice(first, last+1));
  return settings;
}

function formatDate(d){
  return d.toISOString().slice(0,10);
}

(async ()=>{
  try{
    const symbol = (process.argv[2]||'OLAELEC').toUpperCase();
    const settings = await readSettings();
    const apiKey = settings['kite.apiKey'];
    const accessToken = settings['kite.accessToken'];
    if(!apiKey || !accessToken){
      console.error('Missing kite.apiKey or kite.accessToken in settings.json');
      process.exit(1);
    }

    // Get holdings to find instrument token
    const holdingsResp = await axios.get('https://api.kite.trade/portfolio/holdings', {
      headers: { 'X-Kite-Version':'3', 'Authorization': `token ${apiKey}:${accessToken}` },
      timeout: 15000
    });
    const holdings = holdingsResp.data.data || [];
    let inst = holdings.find(h => (h.tradingsymbol||'').toUpperCase() === symbol);
    if(!inst){
      console.log('Symbol not found in holdings, attempting instruments search...');
      // As fallback we can fetch instruments list is big; skip and fail
      console.error('Instrument token not found for', symbol);
      process.exit(1);
    }
    const instrument_token = inst.instrument_token;
    console.log('Found instrument_token:', instrument_token);

    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 365);
    const fromStr = formatDate(from);
    const toStr = formatDate(to);

    const histUrl = `https://api.kite.trade/instruments/historical/${instrument_token}/day?from=${fromStr}&to=${toStr}`;
    console.log('Fetching historical candles:', histUrl);
    const histResp = await axios.get(histUrl, {
      headers: { 'X-Kite-Version':'3', 'Authorization': `token ${apiKey}:${accessToken}` },
      timeout: 30000
    });

    const candles = histResp.data.data.candles || histResp.data.candles || [];
    if(!candles.length){
      console.error('No candles returned');
      process.exit(1);
    }

    // candles are arrays: [timestamp, open, high, low, close, volume]
    const rows = [['date','open','high','low','close','volume']];
    for(const c of candles){
      const date = new Date(c[0]).toISOString().slice(0,10);
      rows.push([date, c[1], c[2], c[3], c[4], c[5]]);
    }

    const csv = rows.map(r => r.join(',')).join('\n');
    const outName = `holdings_${symbol}_1y.csv`;
    const outPath = path.join(process.cwd(), outName);
    fs.writeFileSync(outPath, csv, 'utf8');
    console.log('Saved CSV:', outPath);

    // summary
    const closes = candles.map(c => c[4]);
    const start = closes[0];
    const end = closes[closes.length-1];
    const pct = ((end - start)/start)*100;
    const maxClose = Math.max(...closes);
    const minClose = Math.min(...closes);

    console.log('\nTrend summary:');
    console.log('Start date:', rows[1][0], 'start close:', start);
    console.log('End date:', rows[rows.length-1][0], 'end close:', end);
    console.log('Change %:', pct.toFixed(2) + '%');
    console.log('Max close:', maxClose, 'Min close:', minClose);

    process.exit(0);
  }catch(err){
    console.error('Error:', err.response ? (err.response.data || err.response.statusText) : err.message);
    process.exit(1);
  }
})();
