const fs = require('fs');
const path = require('path');
const axios = require('axios');

(async () => {
  try {
    const settingsPath = path.join(process.env.APPDATA, 'Code', 'User', 'settings.json');
    const raw = fs.readFileSync(settingsPath, 'utf8');
    // Robust JSON extraction: find first '{' and last '}' to avoid stray chars
    const first = raw.indexOf('{');
    const last = raw.lastIndexOf('}');
    if (first === -1 || last === -1) throw new Error('settings.json not valid');
    const settings = JSON.parse(raw.slice(first, last + 1));
    const apiKey = settings['kite.apiKey'];
    const accessToken = settings['kite.accessToken'];
    if (!apiKey || !accessToken) {
      console.error('Missing kite.apiKey or kite.accessToken in settings.json');
      process.exit(1);
    }

    const resp = await axios.get('https://api.kite.trade/portfolio/holdings', {
      headers: {
        'X-Kite-Version': '3',
        'Authorization': `token ${apiKey}:${accessToken}`
      },
      timeout: 15000
    });

    const holdings = resp.data.data || [];
    const top = holdings.sort((a,b) => Math.abs(b.pnl) - Math.abs(a.pnl)).slice(0,10);
    console.log(JSON.stringify(top, null, 2));
  } catch (err) {
    console.error('Error:', err.response ? err.response.data || err.response.statusText : err.message);
    process.exit(1);
  }
})();
