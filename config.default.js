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
  PROFIT_TARGET: 2.5,
  
  // Minimum price change % in the last period to trigger a buy signal
  MOMENTUM_THRESHOLD: 1.5,
  
  // Time window for momentum calculation in minutes
  MOMENTUM_WINDOW: 10,
  
  // How often to scan markets (seconds)
  SCAN_INTERVAL: 10,
  
  // Position size per trade (USD)
  POSITION_SIZE: 500,
  
  // Maximum number of concurrent positions
  MAX_POSITIONS: 30,
  
  // Minimum 24h volume to consider (USD)
  MIN_VOLUME: 25000,
  
  // Stop loss percentage (negative number)
  STOP_LOSS: -3.0,
  
  // Trailing profit settings - let winners ride while climbing
  ENABLE_TRAILING_PROFIT: true,
  TRAILING_STOP_PERCENT: 1.0,
  MIN_MOMENTUM_TO_RIDE: 0.5,
  
  // Volume surge filter - require volume to be X% of average (e.g., 150 = 1.5x average)
  VOLUME_SURGE_FILTER: true,
  VOLUME_SURGE_THRESHOLD: 150,
  
  // RSI entry filter - only enter if RSI is within this range (avoid overbought)
  RSI_FILTER: true,
  RSI_MIN: 60,
  RSI_MAX: 80,
};
