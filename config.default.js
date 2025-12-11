// Default trading bot configuration
// This file is tracked in git and contains all available settings with defaults.
// User settings are stored in config.js (not tracked) and user-settings.json.
// New settings added here will be automatically merged into user configs.

export const defaultConfig = {
  // Paper trading mode (true = simulated trades, false = real trades)
  PAPER_TRADING: true,
  
  // Maximum price threshold for coins to trade
  MAX_PRICE: 1.00,
  
  // Profit target percentage
  PROFIT_TARGET: 3.0,
  
  // Minimum price change % in the last period to trigger a buy signal
  MOMENTUM_THRESHOLD: 1.5,
  
  // Time window for momentum calculation in minutes
  MOMENTUM_WINDOW: 10,
  
  // How often to scan markets (seconds)
  SCAN_INTERVAL: 10,
  
  // How often to re-check open positions between full scans (seconds)
  OPEN_POSITION_SCAN_INTERVAL: 5,
  
  // Position size per trade (USD)
  POSITION_SIZE: 100,
  
  // Maximum number of concurrent positions
  MAX_POSITIONS: 10,
  
  // Minimum 24h volume to consider (USD)
  MIN_VOLUME: 50000,
  
  // Stop loss percentage (negative number)
  STOP_LOSS: -5.0,
  
  // Trailing profit settings - let winners ride while climbing
  ENABLE_TRAILING_PROFIT: true,
  TRAILING_STOP_PERCENT: 1.5,
  MIN_MOMENTUM_TO_RIDE: 0.5,
  
  // Volume surge filter - require volume to be X% of average (e.g., 150 = 1.5x average)
  VOLUME_SURGE_FILTER: true,
  VOLUME_SURGE_THRESHOLD: 150,
  
  // RSI entry filter - only enter if RSI is within this range (avoid overbought)
  RSI_FILTER: true,
  RSI_MIN: 40,
  RSI_MAX: 80,
  
  // Trading fees and taxes (percentages)
  MAKER_FEE_PERCENT: 0.25,   // Maker fee (limit orders that add liquidity)
  TAKER_FEE_PERCENT: 0.50,   // Taker fee (market orders that take liquidity)
  TAX_PERCENT: 0,            // Tax rate on profits (for tracking purposes)
};

export const config = defaultConfig;
