import { jest } from '@jest/globals';

// Minimal mocks for dependencies
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

describe('TradingBotDaemon behavior', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });
  test('formatUptime formats durations correctly', () => {
    const bot = new TradingBotDaemon();
    expect(bot.formatUptime()).toBe('0s');
    bot.startTime = Date.now() - 15000; // 15s
    expect(bot.formatUptime()).toMatch(/15s/);
    bot.startTime = Date.now() - (65 * 1000); // 1m5s
    expect(bot.formatUptime()).toMatch(/1m/);
    bot.startTime = Date.now() - (3 * 3600 * 1000); // 3h
    expect(bot.formatUptime()).toMatch(/3h/);
  });

  test('logError prints stack and optional fields', () => {
    const bot = new TradingBotDaemon();
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error('boom');
    err.code = 'E_BAD';
    err.status = 500;
    err.stack = 'Error: boom\n at foo (bar.js:1:1)\n at baz (qux.js:2:2)';

    bot.logError('testContext', err);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test('start calls loadPortfolio and mainLoop', async () => {
    const bot = new TradingBotDaemon();
    await bot.paper.loadPortfolio();
    bot.paper = { loadPortfolio: jest.fn().mockResolvedValue(), getPositionCount: jest.fn().mockReturnValue(0), getPortfolioSummary: jest.fn().mockReturnValue({ totalValue: 100, cash: 100, openPositions: 0 }) };
    bot.mainLoop = jest.fn().mockResolvedValue();

    await bot.start();
    expect(bot.paper.loadPortfolio).toHaveBeenCalled();
    expect(bot.mainLoop).toHaveBeenCalled();
  });

  test('mainLoop processes opportunities and exits when sleep sets isRunning false', async () => {
    const bot = new TradingBotDaemon();
    await bot.paper.loadPortfolio();

    bot.paper = {
      getPositionCount: jest.fn().mockReturnValue(0),
      getPortfolioSummary: jest.fn().mockReturnValue({ totalValue: 100, cash: 100, openPositions: 0 }),
    };

    const mockOpportunity = { symbol: 'C1', momentum: 2.5 };
    bot.scanner = { scanMarkets: jest.fn().mockResolvedValue([mockOpportunity]) };
    bot.strategy = {
      managePositions: jest.fn().mockResolvedValue(),
      evaluateBuyOpportunity: jest.fn().mockResolvedValue()
    };

    // Replace sleep to stop loop after one iteration
    bot.sleep = jest.fn(async (ms) => { bot.isRunning = false; });

    bot.isRunning = true;
    await bot.mainLoop();

    expect(bot.scanner.scanMarkets).toHaveBeenCalled();
    expect(bot.strategy.evaluateBuyOpportunity).toHaveBeenCalledWith(mockOpportunity);
  });

  test('mainLoop catches errors and increments error counters', async () => {
    const bot = new TradingBotDaemon();
    await bot.paper.loadPortfolio();
    bot.paper = { getPositionCount: jest.fn().mockReturnValue(0), getPortfolioSummary: jest.fn().mockReturnValue({ totalValue: 100, cash: 100, openPositions: 0 }) };
    bot.scanner = { scanMarkets: jest.fn().mockRejectedValue(new Error('scan fail')) };
    bot.strategy = { managePositions: jest.fn().mockResolvedValue() };

    bot.sleep = jest.fn(async (ms) => { bot.isRunning = false; });
    bot.isRunning = true;

    await bot.mainLoop();
    expect(bot.errorCount).toBeGreaterThan(0);
  });

  test('computeBackoffWaitTime returns expected wait times', () => {
    const bot = new TradingBotDaemon();
    bot.consecutiveErrors = 0;
    expect(bot.computeBackoffWaitTime()).toBe(10000);
    bot.consecutiveErrors = 3;
    expect(bot.computeBackoffWaitTime()).toBe(30000);
    bot.consecutiveErrors = 5;
    expect(bot.computeBackoffWaitTime()).toBe(60000);
  });

  test('stop logs fallback when portfolio summary fails and sleep resolves', async () => {
    const bot = new TradingBotDaemon();
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    bot.paper.getPortfolioSummary = jest.fn(() => { throw new Error('no data') });
    bot.cycleCount = 2;
    bot.errorCount = 1;

    bot.stop('unit test');
    expect(spy).toHaveBeenCalled();

    // Test sleep resolves using fake timers
    jest.useFakeTimers();
    const sleepPromise = bot.sleep(1000);
    jest.advanceTimersByTime(1000);
    await sleepPromise;
    jest.useRealTimers();

    spy.mockRestore();
  });

  test('mainLoop uses computed backoff wait times on error', async () => {
    const bot = new TradingBotDaemon();
    await bot.paper.loadPortfolio();
    bot.paper = { getPositionCount: jest.fn().mockReturnValue(0), getPortfolioSummary: jest.fn().mockReturnValue({ totalValue: 100, cash: 100, openPositions: 0 }) };
    bot.scanner = { scanMarkets: jest.fn().mockRejectedValue(new Error('scan fail')) };
    bot.strategy = { managePositions: jest.fn().mockResolvedValue() };

    // Case: will escalate to 30000 after increment
    bot.consecutiveErrors = 2; // will become 3 inside catch
    const sleepSpy = jest.fn(async (ms) => { bot.isRunning = false; });
    bot.sleep = sleepSpy;
    bot.isRunning = true;
    await bot.mainLoop();
    expect(sleepSpy).toHaveBeenCalledWith(30000);

    // Case: will escalate to 60000
    bot.consecutiveErrors = 4; // becomes 5
    bot.sleep = jest.fn(async (ms) => { bot.isRunning = false; });
    bot.isRunning = true;
    await bot.mainLoop();
    expect(bot.sleep).toHaveBeenCalledWith(60000);
  });
});