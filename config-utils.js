import fsSync from 'fs';
import { defaultConfig } from './config.default.js';

// Load config: merge defaults with user settings
let config = { ...defaultConfig };
try {
  // Try to load user settings from user-settings.json first (most reliable)
  if (fsSync.existsSync('user-settings.json')) {
    const userSettings = JSON.parse(fsSync.readFileSync('user-settings.json', 'utf-8'));
    config = { ...defaultConfig, ...userSettings };
    console.log('[CONFIG] Loaded user settings from user-settings.json');
  }
  // Check if any new settings were added in defaults
  const newSettings = Object.keys(defaultConfig).filter(k => !(k in config));
  if (newSettings.length > 0) {
    console.log(`[CONFIG] Added new settings from defaults: ${newSettings.join(', ')}`);
  }
} catch (e) {
  console.log('[CONFIG] Using default configuration');
}

function pickConfigSnapshot(runtimeConfig = config) {
  const keys = [
    'PAPER_TRADING',
    'MAX_PRICE',
    'MIN_VOLUME',
    'POSITION_SIZE',
    'MAX_POSITIONS',
    'PROFIT_TARGET',
    'STOP_LOSS',
    'ENABLE_TRAILING_PROFIT',
    'TRAILING_STOP_PERCENT',
    'MIN_MOMENTUM_TO_RIDE',
    'MOMENTUM_THRESHOLD',
    'MOMENTUM_WINDOW',
    'RSI_FILTER',
    'RSI_MIN',
    'RSI_MAX',
    'VOLUME_SURGE_FILTER',
    'VOLUME_SURGE_THRESHOLD',
    'MAKER_FEE_PERCENT',
    'TAKER_FEE_PERCENT',
    'TAX_PERCENT',
  ];

  return Object.fromEntries(
    keys
      .filter((k) => Object.prototype.hasOwnProperty.call(runtimeConfig, k))
      .map((k) => [k, runtimeConfig[k]])
  );
}

export { config, pickConfigSnapshot };
