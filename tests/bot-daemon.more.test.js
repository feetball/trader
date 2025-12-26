import { jest } from '@jest/globals';

// Mock dependencies
jest.unstable_mockModule('../coinbase-client.js', () => {
  const CoinbaseClientMock = jest.fn();
  CoinbaseClientMock.resetApiCallCount = jest.fn();
  CoinbaseClientMock.getApiCallCount = jest.fn().mockReturnValue(0);
  return { CoinbaseClient: CoinbaseClientMock };
});

jest.unstable_mockModule('../websocket-feed.js', () => ({
  CoinbaseWebSocket: jest.fn(),
}));

jest.unstable_mockModule('../kraken-client.js', () => ({
  KrakenClient: jest.fn(),
}));

jest.unstable_mockModule('../kraken-websocket.js', () => ({
  KrakenWebSocket: jest.fn(),
}));

const { TradingBotDaemon } = await import('../bot-daemon.js');
const { config } = await import('../config-utils.js');

describe('TradingBotDaemon additional flows', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    // restore default exchange
    config.EXCHANGE = 'COINBASE';
  });

  test('fast-check managePositions errors are caught and logged', async () => {
    const bot = new TradingBotDaemon();

    // Prepare paper and strategy: initial managePositions succeeds, fast-check fails
    bot.paper = {
      getPositionCount: jest.fn().mockReturnValue(1),
      getPortfolioSummary: jest.fn().mockReturnValue({ totalValue: 100, cash: 50, openPositions: 1 }),
    };

    const manage = jest.fn()
      .mockResolvedValueOnce() // first main managePositions
      .mockRejectedValueOnce(new Error('fast-check fail')); // fast-check throws

    bot.strategy = {
      managePositions: manage,
      evaluateBuyOpportunity: jest.fn().mockResolvedValue()
    };

    bot.scanner = { scanMarkets: jest.fn().mockResolvedValue([]) };

    // sleep: allow one inner fast-check iteration, then stop the bot
    let calls = 0;
    bot.sleep = jest.fn(async (ms) => {
      calls += 1;
      if (calls >= 2) bot.isRunning = false; // stop after one fast-check
    });

    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    bot.isRunning = true;
    await bot.mainLoop();

    expect(manage).toHaveBeenCalled();
    expect(errSpy).toHaveBeenCalled();

    errSpy.mockRestore();
  });

  test('when portfolio is full scanner is skipped and bot monitors positions', async () => {
    const bot = new TradingBotDaemon();
    bot.paper = {
      getPositionCount: jest.fn().mockReturnValue(config.MAX_POSITIONS),
      getPortfolioSummary: jest.fn().mockReturnValue({ totalValue: 100, cash: 100, openPositions: config.MAX_POSITIONS }),
    };

    const manage = jest.fn().mockResolvedValue();
    bot.strategy = { managePositions: manage, evaluateBuyOpportunity: jest.fn() };
    const scanSpy = jest.fn().mockResolvedValue([]);
    bot.scanner = { scanMarkets: scanSpy };

    bot.sleep = jest.fn(async (ms) => { bot.isRunning = false; });
    bot.isRunning = true;

    await bot.mainLoop();

    expect(scanSpy).not.toHaveBeenCalled();
    expect(manage).toHaveBeenCalled();
  });

  test('fast-check prints APICALLS when exchange is COINBASE', async () => {
    const bot = new TradingBotDaemon();
    // configure small intervals so inner loop will run once
    config.OPEN_POSITION_SCAN_INTERVAL = 1;
    config.SCAN_INTERVAL = 2;

    bot.paper = {
      getPositionCount: jest.fn().mockReturnValue(1),
      getPortfolioSummary: jest.fn().mockReturnValue({ totalValue: 100, cash: 50, openPositions: 1 }),
    };

    bot.strategy = { managePositions: jest.fn().mockResolvedValue() };
    bot.scanner = { scanMarkets: jest.fn().mockResolvedValue([]) };

    // stub Coinbase API count
    const { CoinbaseClient } = await import('../coinbase-client.js');
    CoinbaseClient.getApiCallCount = jest.fn().mockReturnValue(7);

    // sleep; first call will allow one fast-check iteration then stop
    let call = 0;
    bot.sleep = jest.fn(async (ms) => { call += 1; if (call >= 2) bot.isRunning = false; });

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    bot.isRunning = true;
    await bot.mainLoop();

    expect(logSpy).toHaveBeenCalled();
    // ensure APICALLS log was printed at least once
    expect(logSpy.mock.calls.some(c => String(c[0]).includes('[APICALLS]'))).toBe(true);

    logSpy.mockRestore();
  });

  test('start resets Coinbase API counter when configured', async () => {
    // ensure coinbase path
    config.EXCHANGE = 'COINBASE';
    const { CoinbaseClient } = await import('../coinbase-client.js');
    const bot = new TradingBotDaemon();

    bot.paper = { loadPortfolio: jest.fn().mockResolvedValue() };
    bot.mainLoop = jest.fn().mockResolvedValue();

    await bot.start();

    expect(CoinbaseClient.resetApiCallCount).toHaveBeenCalled();
  });
});
