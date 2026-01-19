#!/usr/bin/env node
/**
 * Daily Performance Tracker
 * 
 * Tracks portfolio value, P&L, and key metrics over time.
 * Stores historical data for trend analysis and charting.
 * 
 * Usage:
 *   node config/automation/track-daily-performance.js
 */

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

function loadHistory() {
  const historyPath = path.join(__dirname, 'performance_history.json');
  if (!fs.existsSync(historyPath)) {
    return { entries: [] };
  }
  return JSON.parse(fs.readFileSync(historyPath, 'utf8'));
}

function saveHistory(history) {
  const historyPath = path.join(__dirname, 'performance_history.json');
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
}

(async () => {
  try {
    console.log('📊 Tracking daily portfolio performance...');
    
    const settings = readSettings();
    const apiKey = settings['kite.apiKey'];
    const accessToken = settings['kite.accessToken'];
    
    if (!apiKey || !accessToken) {
      console.error('❌ Missing kite.apiKey or kite.accessToken in settings');
      process.exit(1);
    }
    
    // Fetch holdings
    const resp = await axios.get('https://api.kite.trade/portfolio/holdings', {
      headers: { 
        'X-Kite-Version': '3', 
        'Authorization': `token ${apiKey}:${accessToken}` 
      },
      timeout: 15000
    });
    
    const holdings = resp.data.data || [];
    
    // Calculate totals
    let totalInvested = 0;
    let totalCurrent = 0;
    let totalPnL = 0;
    let stockCount = holdings.length;
    
    holdings.forEach(h => {
      const invested = (h.average_price || 0) * (h.quantity || 0);
      const current = (h.last_price || 0) * (h.quantity || 0);
      totalInvested += invested;
      totalCurrent += current;
      totalPnL += h.pnl || 0;
    });
    
    const totalPnLPercent = totalInvested > 0 ? ((totalCurrent - totalInvested) / totalInvested) * 100 : 0;
    
    // Load existing history
    const history = loadHistory();
    
    // Create today's entry
    const today = new Date().toISOString().split('T')[0];
    const entry = {
      date: today,
      timestamp: new Date().toISOString(),
      totalInvested: Number(totalInvested.toFixed(2)),
      totalCurrent: Number(totalCurrent.toFixed(2)),
      totalPnL: Number(totalPnL.toFixed(2)),
      totalPnLPercent: Number(totalPnLPercent.toFixed(2)),
      stockCount
    };
    
    // Check if entry for today already exists
    const existingIndex = history.entries.findIndex(e => e.date === today);
    if (existingIndex >= 0) {
      history.entries[existingIndex] = entry;
      console.log('✅ Updated existing entry for today');
    } else {
      history.entries.push(entry);
      console.log('✅ Added new entry for today');
    }
    
    // Keep only last 365 days
    history.entries = history.entries
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 365);
    
    // Save history
    saveHistory(history);
    
    // Calculate trends (if we have previous data)
    if (history.entries.length > 1) {
      const previous = history.entries[1]; // Yesterday
      const valueDiff = entry.totalCurrent - previous.totalCurrent;
      const valueDiffPct = previous.totalCurrent > 0 
        ? (valueDiff / previous.totalCurrent) * 100 
        : 0;
      
      console.log('');
      console.log('📈 Performance Summary:');
      console.log(`   Today's Value: ₹${entry.totalCurrent.toLocaleString()}`);
      console.log(`   Total P&L: ₹${entry.totalPnL.toLocaleString()} (${entry.totalPnLPercent.toFixed(2)}%)`);
      console.log(`   Change from yesterday: ₹${valueDiff.toFixed(2)} (${valueDiffPct.toFixed(2)}%)`);
      console.log(`   Tracking ${history.entries.length} days of history`);
    } else {
      console.log('');
      console.log('📈 First day of tracking:');
      console.log(`   Portfolio Value: ₹${entry.totalCurrent.toLocaleString()}`);
      console.log(`   Total P&L: ₹${entry.totalPnL.toLocaleString()} (${entry.totalPnLPercent.toFixed(2)}%)`);
    }
    
    console.log('');
    console.log('✅ Performance tracking complete!');
    console.log(`📁 History saved to: ${path.join(__dirname, 'performance_history.json')}`);
    
  } catch (error) {
    console.error('❌ Error tracking performance:', error.message);
    process.exit(1);
  }
})();
