// Trading bot configuration
export const config = {
  // Paper trading mode (true = simulated trades, false = real trades)
  PAPER_TRADING: true,
  
  // Maximum price threshold for coins to trade
  MAX_PRICE: 1.00,
  
  // Profit target percentage
  PROFIT_TARGET: 5.0,
  
  // Minimum price change % in the last period to trigger a buy signal
  MOMENTUM_THRESHOLD: 3.0,
  
  // Time window for momentum calculation in minutes
  MOMENTUM_WINDOW: 10,
  
  // How often to scan markets (seconds)
  SCAN_INTERVAL: 15,
  
  // Position size per trade (USD)
  POSITION_SIZE: 1000,
  
  // Maximum number of concurrent positions
  MAX_POSITIONS: 20,
  
  // Minimum 24h volume to consider (USD)
  MIN_VOLUME: 50000,
  
  // Stop loss percentage (optional safety feature)
  STOP_LOSS: -5.0,
  
  // Trailing profit settings - let winners ride while climbing
  // When profit exceeds PROFIT_TARGET, don't sell immediately
  // Instead, trail the price and sell when it drops by TRAILING_STOP_PERCENT from peak
  ENABLE_TRAILING_PROFIT: true,
  TRAILING_STOP_PERCENT: 2.0,  // Sell when price drops 2% from peak (after passing profit target)
  MIN_MOMENTUM_TO_RIDE: 1.0,   // Minimum recent momentum % to keep riding
};
