#!/usr/bin/env node
/**
 * Daily Automation Runner for Stock Trading
 * 
 * This script runs daily to:
 * 1. Generate recommendations
 * 2. Perform strategic analysis
 * 3. Track historical performance
 * 4. Send notifications (optional)
 * 
 * Usage:
 *   node config/automation/daily-runner.js [--auto-execute]
 * 
 * Options:
 *   --auto-execute  Automatically execute high-priority sell orders (use with caution)
 *   --notify        Send notifications (requires notification setup)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(msg) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${msg}`);
}

function runScript(scriptPath, description) {
  log(`Running: ${description}...`);
  try {
    const output = execSync(`node ${scriptPath}`, { 
      encoding: 'utf8',
      cwd: path.join(__dirname, '..', '..')
    });
    log(`✅ ${description} completed`);
    return { success: true, output };
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

function saveRunHistory(results) {
  const historyDir = path.join(__dirname, 'history');
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().split('T')[0];
  const historyFile = path.join(historyDir, `run-${timestamp}.json`);
  
  fs.writeFileSync(historyFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    results
  }, null, 2));
  
  log(`📝 Run history saved to ${historyFile}`);
}

async function main() {
  const args = process.argv.slice(2);
  const autoExecute = args.includes('--auto-execute');
  const notify = args.includes('--notify');
  
  log('='.repeat(60));
  log('📊 DAILY STOCK TRADING AUTOMATION RUNNER');
  log('='.repeat(60));
  
  if (autoExecute) {
    log('⚠️  AUTO-EXECUTE MODE ENABLED - Will place real orders!');
  } else {
    log('ℹ️  Running in analysis-only mode');
  }
  
  const results = {};
  
  // Step 1: Generate recommendations
  results.recommendations = runScript(
    'config/recommendations/generate-recommendations.js',
    'Portfolio recommendations generation'
  );
  
  // Step 2: Run strategic analysis
  results.analysis = runScript(
    'config/analysis/strategic-analysis.js',
    'Strategic portfolio analysis'
  );
  
  // Step 3: Track historical performance
  results.history = runScript(
    'config/automation/track-daily-performance.js',
    'Daily performance tracking'
  );
  
  // Step 4: Check for urgent actions
  if (results.recommendations.success) {
    try {
      const recoPath = path.join(__dirname, '..', 'recommendations', 'recommendations.json');
      const recommendations = JSON.parse(fs.readFileSync(recoPath, 'utf8'));
      
      const urgentSells = recommendations.recommendations.filter(
        r => r.action === 'SELL' && r.priority === 1
      );
      
      if (urgentSells.length > 0) {
        log('');
        log('🚨 URGENT ACTIONS REQUIRED:');
        urgentSells.forEach(stock => {
          log(`   🔴 SELL ${stock.symbol}: ${stock.quantity} shares @ ₹${stock.lastPrice}`);
          log(`      Reason: ${stock.reason}`);
          log(`      P&L: ₹${stock.pnl} (${stock.pnlPercent}%)`);
        });
        
        if (autoExecute) {
          log('');
          log('⚡ AUTO-EXECUTE: Processing urgent sell orders...');
          urgentSells.forEach(stock => {
            const sellResult = runScript(
              `config/sell/sell-stocks.js --symbol ${stock.symbol} --qty ${stock.quantity} --confirm`,
              `Selling ${stock.symbol}`
            );
            results[`sell_${stock.symbol}`] = sellResult;
          });
        } else {
          log('');
          log('ℹ️  To execute these orders, run with --auto-execute flag or execute manually.');
        }
      }
    } catch (error) {
      log(`❌ Error checking urgent actions: ${error.message}`);
    }
  }
  
  // Step 5: Generate summary report
  log('');
  log('='.repeat(60));
  log('📋 DAILY SUMMARY');
  log('='.repeat(60));
  
  Object.entries(results).forEach(([task, result]) => {
    const status = result.success ? '✅' : '❌';
    log(`${status} ${task}: ${result.success ? 'Success' : result.error}`);
  });
  
  // Save run history
  saveRunHistory(results);
  
  // Optional: Send notification
  if (notify) {
    log('');
    log('📧 Notification feature not yet implemented');
    log('   Configure with email/SMS/webhook in future versions');
  }
  
  log('');
  log('🎉 Daily automation run completed!');
  log(`📊 View recommendations: config/recommendations/webapp/index.html`);
  log(`📈 View analysis: config/analysis/analysis_summary.txt`);
  log('='.repeat(60));
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
