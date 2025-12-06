// Trading bot configuration
export const config = {
  // Paper trading mode (true = simulated trades, false = real trades)
  PAPER_TRADING: true,
  
  // Maximum price threshold for coins to trade
  MAX_PRICE: 1,
  
  // Profit target percentage (lowered for faster trades)
  PROFIT_TARGET: 1.5,
  
  // Minimum price change % in the last period to trigger a buy signal
  MOMENTUM_THRESHOLD: 1,
  
  // Time window for momentum calculation in minutes
  MOMENTUM_WINDOW: 3,
  
  // How often to scan markets (seconds)
  // WebSocket provides real-time prices, so fast scans are possible
  SCAN_INTERVAL: 20,
  
  // Position size per trade (USD)
  POSITION_SIZE: 500,
  
  // Maximum number of concurrent positions
  MAX_POSITIONS: 30,
  
  // Minimum 24h volume to consider (USD)
  MIN_VOLUME: 25000,
  
  // Stop loss percentage (tighter for faster cuts)
  STOP_LOSS: -1,
  
  // Trailing profit settings - let winners ride while climbing
  ENABLE_TRAILING_PROFIT: true,
  TRAILING_STOP_PERCENT: 0.4,
  MIN_MOMENTUM_TO_RIDE: 0.5,
  
  // Volume surge filter - require volume to be X% of average (e.g., 150 = 1.5x average)
  VOLUME_SURGE_FILTER: true,
  VOLUME_SURGE_THRESHOLD: 150,
  
  // RSI entry filter - only enter if RSI is within this range (avoid overbought)
  RSI_FILTER: true,
  RSI_MIN: 60,
  RSI_MAX: 80,
};
