#!/usr/bin/env node
/**
 * Mobile Trigger System for Stock Trading
 * 
 * Simple HTTP server that provides webhook endpoints for mobile apps
 * to trigger buy/sell orders based on recommendations.
 * 
 * Usage:
 *   node config/mobile/mobile-triggers.js
 * 
 * Endpoints:
 *   GET  /status          - Get current portfolio status
 *   GET  /recommendations - Get today's recommendations
 *   POST /execute-sell    - Execute urgent sell orders
 *   POST /execute-buy     - Execute buy recommendations
 *   POST /execute-action  - Execute specific action
 */

const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3456;

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function loadRecommendations() {
  try {
    const recoPath = path.join(__dirname, '..', 'recommendations', 'recommendations.json');
    if (fs.existsSync(recoPath)) {
      return JSON.parse(fs.readFileSync(recoPath, 'utf8'));
    }
    return null;
  } catch (error) {
    log(`Error loading recommendations: ${error.message}`);
    return null;
  }
}

function executeOrder(action, symbol, qty) {
  try {
    const scriptPath = action === 'BUY' 
      ? 'config/buy/buy-stocks.js'
      : 'config/sell/sell-stocks.js';
    
    const cmd = `node ${scriptPath} --symbol ${symbol} --qty ${qty} --confirm`;
    log(`Executing: ${cmd}`);
    
    const output = execSync(cmd, {
      encoding: 'utf8',
      cwd: path.join(__dirname, '..', '..')
    });
    
    return { success: true, output };
  } catch (error) {
    log(`Execution error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // CORS headers for mobile access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  log(`${req.method} ${url.pathname}`);
  
  // GET /status - Portfolio status
  if (req.method === 'GET' && url.pathname === '/status') {
    const reco = loadRecommendations();
    if (reco) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        timestamp: reco.timestamp,
        summary: reco.summary,
        counts: {
          total: reco.recommendations.length,
          sell: reco.recommendations.filter(r => r.action === 'SELL').length,
          buy: reco.recommendations.filter(r => r.action === 'BUY').length,
          hold: reco.recommendations.filter(r => r.action === 'HOLD').length
        }
      }, null, 2));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No recommendations available. Run generate-recommendations.js first.' }));
    }
    return;
  }
  
  // GET /recommendations - Full recommendations
  if (req.method === 'GET' && url.pathname === '/recommendations') {
    const reco = loadRecommendations();
    if (reco) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(reco, null, 2));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No recommendations available' }));
    }
    return;
  }
  
  // POST /execute-sell - Execute urgent sells
  if (req.method === 'POST' && url.pathname === '/execute-sell') {
    const reco = loadRecommendations();
    if (!reco) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No recommendations available' }));
      return;
    }
    
    const urgentSells = reco.recommendations.filter(
      r => r.action === 'SELL' && r.priority === 1
    );
    
    if (urgentSells.length === 0) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'No urgent sell orders found' }));
      return;
    }
    
    const results = urgentSells.map(stock => {
      const result = executeOrder('SELL', stock.symbol, stock.quantity);
      return {
        symbol: stock.symbol,
        qty: stock.quantity,
        ...result
      };
    });
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ urgentSells: results }, null, 2));
    return;
  }
  
  // POST /execute-buy - Execute buy recommendations
  if (req.method === 'POST' && url.pathname === '/execute-buy') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { count = 1 } = body ? JSON.parse(body) : {};
        
        const reco = loadRecommendations();
        if (!reco) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'No recommendations available' }));
          return;
        }
        
        const buyRecos = reco.recommendations
          .filter(r => r.action === 'BUY')
          .slice(0, count);
        
        if (buyRecos.length === 0) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'No buy recommendations found' }));
          return;
        }
        
        const results = buyRecos.map(stock => {
          // Buy 5 shares for dip recovery opportunities
          const result = executeOrder('BUY', stock.symbol, 5);
          return {
            symbol: stock.symbol,
            qty: 5,
            ...result
          };
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ buyOrders: results }, null, 2));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }
  
  // POST /execute-action - Execute specific action
  if (req.method === 'POST' && url.pathname === '/execute-action') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { action, symbol, qty } = JSON.parse(body);
        
        if (!action || !symbol || !qty) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing required fields: action, symbol, qty' }));
          return;
        }
        
        if (action !== 'BUY' && action !== 'SELL') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Action must be BUY or SELL' }));
          return;
        }
        
        const result = executeOrder(action, symbol, qty);
        
        res.writeHead(result.success ? 200 : 500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ action, symbol, qty, ...result }, null, 2));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }
  
  // GET / - Welcome page with API docs
  if (req.method === 'GET' && url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Mobile Trading Triggers</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial; padding: 20px; max-width: 800px; margin: 0 auto; }
          h1 { color: #333; }
          .endpoint { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .method { display: inline-block; padding: 5px 10px; border-radius: 3px; font-weight: bold; margin-right: 10px; }
          .get { background: #61affe; color: white; }
          .post { background: #49cc90; color: white; }
          code { background: #eee; padding: 2px 5px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <h1>📱 Mobile Trading Triggers API</h1>
        <p>Simple HTTP endpoints for mobile trading automation</p>
        
        <div class="endpoint">
          <span class="method get">GET</span>
          <strong>/status</strong>
          <p>Get current portfolio status and recommendation counts</p>
        </div>
        
        <div class="endpoint">
          <span class="method get">GET</span>
          <strong>/recommendations</strong>
          <p>Get full list of today's recommendations</p>
        </div>
        
        <div class="endpoint">
          <span class="method post">POST</span>
          <strong>/execute-sell</strong>
          <p>Execute all urgent (priority 1) sell orders</p>
        </div>
        
        <div class="endpoint">
          <span class="method post">POST</span>
          <strong>/execute-buy</strong>
          <p>Execute buy recommendations. Body: <code>{"count": 1}</code></p>
        </div>
        
        <div class="endpoint">
          <span class="method post">POST</span>
          <strong>/execute-action</strong>
          <p>Execute specific action. Body: <code>{"action": "BUY|SELL", "symbol": "STOCK", "qty": 10}</code></p>
        </div>
        
        <h2>Usage Examples</h2>
        <pre>
# Get status
curl http://localhost:${PORT}/status

# Execute urgent sells
curl -X POST http://localhost:${PORT}/execute-sell

# Execute top buy recommendation
curl -X POST http://localhost:${PORT}/execute-buy -H "Content-Type: application/json" -d '{"count": 1}'

# Execute specific order
curl -X POST http://localhost:${PORT}/execute-action -H "Content-Type: application/json" -d '{"action": "SELL", "symbol": "GENSOL-BZ", "qty": 20}'
        </pre>
        
        <p><strong>Note:</strong> This server executes real orders with --confirm flag. Use with caution!</p>
      </body>
      </html>
    `);
    return;
  }
  
  // 404 Not Found
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

// Start server
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  log(`🚀 Mobile Triggers API running on http://localhost:${PORT}`);
  log(`📱 Access from mobile: http://<your-ip>:${PORT}`);
  log(`📖 API docs: http://localhost:${PORT}/`);
  log('');
  log('⚠️  WARNING: This server executes REAL orders!');
  log('   Only use on trusted networks');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    log(`❌ Port ${PORT} is already in use`);
    log(`   Try: PORT=3457 node config/mobile/mobile-triggers.js`);
  } else {
    log(`❌ Server error: ${error.message}`);
  }
  process.exit(1);
});
