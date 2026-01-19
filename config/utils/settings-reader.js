/**
 * Utility functions for config scripts
 * Provides cross-platform support for reading VS Code settings
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Get VS Code settings path based on platform
 */
function getSettingsPath() {
  let settingsDir;
  
  switch (os.platform()) {
    case 'win32':
      settingsDir = path.join(process.env.APPDATA, 'Code', 'User');
      break;
    case 'darwin':
      settingsDir = path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User');
      break;
    case 'linux':
    default:
      settingsDir = path.join(os.homedir(), '.config', 'Code', 'User');
      break;
  }
  
  return path.join(settingsDir, 'settings.json');
}

/**
 * Read VS Code settings
 * Handles JSON with comments (JSONC format)
 */
function readSettings() {
  const settingsPath = getSettingsPath();
  
  if (!fs.existsSync(settingsPath)) {
    throw new Error(`Settings file not found: ${settingsPath}`);
  }
  
  const raw = fs.readFileSync(settingsPath, 'utf8');
  
  // Find first { and last } to handle JSONC
  const first = raw.indexOf('{');
  const last = raw.lastIndexOf('}');
  
  if (first === -1 || last === -1) {
    throw new Error('Invalid settings file format');
  }
  
  return JSON.parse(raw.slice(first, last + 1));
}

/**
 * Get Kite API credentials from settings
 */
function getKiteCredentials() {
  const settings = readSettings();
  
  const apiKey = settings['kite.apiKey'];
  const accessToken = settings['kite.accessToken'];
  
  if (!apiKey || !accessToken) {
    throw new Error(
      'Missing kite.apiKey or kite.accessToken in VS Code settings.\n' +
      'Please configure them in VS Code Settings (Ctrl+,) by searching for "Kite".'
    );
  }
  
  return { apiKey, accessToken };
}

module.exports = {
  getSettingsPath,
  readSettings,
  getKiteCredentials
};
