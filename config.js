// Trading bot configuration
export const config = {
  // Paper trading mode (true = simulated trades, false = real trades)
  PAPER_TRADING: true,
  
  // Maximum price threshold for coins to trade
  MAX_PRICE: 1,
  
  // Profit target percentage - slightly higher for better R:R
  PROFIT_TARGET: 2.0,
  
  // Minimum price change % in the last period to trigger a buy signal
  // Now includes volume and RSI bonuses
  MOMENTUM_THRESHOLD: 1.5,
  
  // Time window for momentum calculation in minutes
  // Longer = more reliable, fewer false breakouts
  MOMENTUM_WINDOW: 10,
  
  // How often to scan markets (seconds)
  SCAN_INTERVAL: 10,
  
  // Position size per trade (USD)
  POSITION_SIZE: 500,
  
  // Maximum number of concurrent positions
  MAX_POSITIONS: 30,
  
  // Minimum 24h volume to consider (USD)
  MIN_VOLUME: 25000,
  
  // Stop loss percentage - wider to avoid noise
  STOP_LOSS: -3,
  
  // Trailing profit settings - let winners ride
  ENABLE_TRAILING_PROFIT: true,
  TRAILING_STOP_PERCENT: 1.5,
  MIN_MOMENTUM_TO_RIDE: 0.3,
};
