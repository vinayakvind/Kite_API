const fs = require('fs');
const path = require('path');
const axios = require('axios');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

function readSettings(){
  const settingsPath = path.join(process.env.APPDATA, 'Code', 'User', 'settings.json');
  const raw = fs.readFileSync(settingsPath, 'utf8');
  const first = raw.indexOf('{');
  const last = raw.lastIndexOf('}');
  return JSON.parse(raw.slice(first, last+1));
}

const argv = yargs(hideBin(process.argv))
  .option('exchange', {type: 'string', demandOption: true, description: 'Exchange e.g. NSE'})
  .option('symbol', {type: 'string', demandOption: true, description: 'Trading symbol e.g. OLAELEC'})
  .option('transaction', {type: 'string', choices: ['BUY','SELL'], demandOption: true})
  .option('qty', {type: 'number', demandOption: true})
  .option('order_type', {type: 'string', choices: ['MARKET','LIMIT','SL','SL-M'], default: 'MARKET'})
  .option('product', {type: 'string', choices: ['CNC','MIS','NRML'], default: 'CNC'})
  .option('price', {type: 'number'})
  .option('trigger_price', {type: 'number'})
  .option('confirm', {type: 'boolean', default: false, description: 'Set to true to actually place the order'})
  .argv;

(async ()=>{
  try{
    const settings = readSettings();
    const apiKey = settings['kite.apiKey'];
    const accessToken = settings['kite.accessToken'];
    if(!apiKey || !accessToken){
      console.error('Missing kite.apiKey or kite.accessToken in settings.json');
      process.exit(1);
    }

    const payload = {
      exchange: argv.exchange,
      tradingsymbol: argv.symbol,
      transaction_type: argv.transaction,
      quantity: argv.qty,
      order_type: argv.order_type,
      product: argv.product
    };
    if(argv.price) payload.price = argv.price;
    if(argv.trigger_price) payload.trigger_price = argv.trigger_price;

    console.log('\nOrder payload:');
    console.log(JSON.stringify(payload, null, 2));

    if(!argv.confirm){
      console.log('\nSimulation mode (no order sent). To place the order rerun with --confirm');
      process.exit(0);
    }

    const client = axios.create({ baseURL: 'https://api.kite.trade', timeout: 15000, headers: { 'X-Kite-Version': '3', 'Authorization': `token ${apiKey}:${accessToken}` } });

    const resp = await client.post('/orders/regular', payload);
    console.log('\nOrder response:');
    console.log(JSON.stringify(resp.data, null, 2));
    process.exit(0);
  }catch(err){
    console.error('Error placing order:', err.response ? (err.response.data || err.response.statusText) : err.message);
    process.exit(1);
  }
})();
