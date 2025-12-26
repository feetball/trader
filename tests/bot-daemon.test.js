import { jest } from '@jest/globals';

// Mock dependencies using unstable_mockModule for ESM support
jest.unstable_mockModule('../coinbase-client.js', () => ({
  CoinbaseClient: jest.fn()
}));
jest.unstable_mockModule('../websocket-feed.js', () => ({
  CoinbaseWebSocket: jest.fn()
}));
jest.unstable_mockModule('../kraken-client.js', () => ({
  KrakenClient: jest.fn()
}));
jest.unstable_mockModule('../kraken-websocket.js', () => ({
  KrakenWebSocket: jest.fn()
}));
jest.unstable_mockModule('../market-scanner.js', () => ({
  MarketScanner: jest.fn()
}));
jest.unstable_mockModule('../paper-trading.js', () => ({
  PaperTradingEngine: jest.fn()
}));
jest.unstable_mockModule('../trading-strategy.js', () => ({
  TradingStrategy: jest.fn()
}));
jest.unstable_mockModule('../config-utils.js', () => ({
  config: {
    EXCHANGE: 'COINBASE',
    PAPER_TRADING: true,
    MAX_PRICE: 1,
    PROFIT_TARGET: 5,
    POSITION_SIZE: 100,
    MAX_POSITIONS: 5,
    ENABLE_TRAILING_PROFIT: true,
    TRAILING_STOP_PERCENT: 1,
    SCAN_INTERVAL: 60
  }
}));

// Dynamic imports
const { TradingBotDaemon } = await import('../bot-daemon.js');
const { config } = await import('../config-utils.js');
const { CoinbaseClient } = await import('../coinbase-client.js');
const { KrakenClient } = await import('../kraken-client.js');

describe('TradingBotDaemon', () => {
  let bot;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize with Coinbase client by default', () => {
    config.EXCHANGE = 'COINBASE';
    bot = new TradingBotDaemon();
    expect(CoinbaseClient).toHaveBeenCalled();
  });

  test('should initialize with Kraken client when configured', () => {
    config.EXCHANGE = 'KRAKEN';
    bot = new TradingBotDaemon();
    expect(KrakenClient).toHaveBeenCalled();
  });
});
