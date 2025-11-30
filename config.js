// Trading bot configuration
export const config = {
  // Paper trading mode (true = simulated trades, false = real trades)
  PAPER_TRADING: true,
  
  // Maximum price threshold for coins to trade
  MAX_PRICE: 1.00,
  
  // Profit target percentage (lowered for faster trades)
  PROFIT_TARGET: 2.5,
  
  // Minimum price change % in the last period to trigger a buy signal
  MOMENTUM_THRESHOLD: 1.5,
  
  // Time window for momentum calculation in minutes
  MOMENTUM_WINDOW: 10,
  
  // How often to scan markets (seconds)
  // WebSocket provides real-time prices, so fast scans are possible
  SCAN_INTERVAL: 10,
  
  // Position size per trade (USD)
  POSITION_SIZE: 500,
  
  // Maximum number of concurrent positions
  MAX_POSITIONS: 30,
  
  // Minimum 24h volume to consider (USD)
  MIN_VOLUME: 25000,
  
  // Stop loss percentage (tighter for faster cuts)
  STOP_LOSS: -3.0,
  
  // Trailing profit settings - let winners ride while climbing
  ENABLE_TRAILING_PROFIT: true,
  TRAILING_STOP_PERCENT: 1.0,  // Sell when price drops 1% from peak
  MIN_MOMENTUM_TO_RIDE: 0.5,   // Minimum recent momentum % to keep riding
};
