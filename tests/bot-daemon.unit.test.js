import { jest } from '@jest/globals';
import { TradingBotDaemon } from '../bot-daemon.js';

describe('TradingBotDaemon unit', () => {
  let bot;

  beforeEach(() => {
    bot = new TradingBotDaemon();
  });

  test('formatUptime returns 0s when not started and various formats when started', () => {
    expect(bot.formatUptime()).toBe('0s');
    bot.startTime = Date.now() - 1500; // 1.5s ago
    expect(bot.formatUptime()).toMatch(/\ds/);
    bot.startTime = Date.now() - (65 * 1000); // 65s
    expect(bot.formatUptime()).toMatch(/1m/);
    bot.startTime = Date.now() - (3600 * 1000 + 2 * 60 * 1000); // 1h2m
    expect(bot.formatUptime()).toMatch(/1h/);
  });

  test('computeBackoffWaitTime returns correct values', () => {
    bot.consecutiveErrors = 0;
    expect(bot.computeBackoffWaitTime()).toBe(10000);
    bot.consecutiveErrors = 3;
    expect(bot.computeBackoffWaitTime()).toBe(30000);
    bot.consecutiveErrors = 5;
    expect(bot.computeBackoffWaitTime()).toBe(60000);
  });

  test('logError logs stack and optional fields', () => {
    const spyErr = jest.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error('boom');
    err.code = 'E123';
    err.status = 500;
    bot.logError('testContext', err);
    expect(spyErr).toHaveBeenCalled();
    spyErr.mockRestore();
  });

  test('stop logs final portfolio when getPortfolioSummary throws', () => {
    bot.paper = { getPortfolioSummary: () => { throw new Error('nope'); } };
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    bot.stop('unit test');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test('mainLoop handles errors and backoff', async () => {
    // prepare bot to run one iteration and then stop
    bot.isRunning = true;
    bot.cycleCount = 0;
    bot.paper = { getPositionCount: () => 0, getPortfolioSummary: () => ({ totalValue: 100, cash: 50, openPositions: 0 }) };
    bot.strategy = { managePositions: jest.fn(() => { throw new Error('scan fail'); }) };
    bot.scanner = { scanMarkets: jest.fn(async () => []) };
    // mock sleep to stop the loop when called from catch
    bot.sleep = jest.fn(async () => { bot.isRunning = false; });
    const spyErr = jest.spyOn(console, 'error').mockImplementation(() => {});
    await bot.mainLoop();
    expect(spyErr).toHaveBeenCalled();
    spyErr.mockRestore();
  });

  test('mainLoop processes opportunities and evaluates buys', async () => {
    bot.isRunning = true;
    bot.cycleCount = 0;
    const mockOpportunity = { productId: 'PZ', symbol: 'CZ', momentum: 2.5 };
    bot.paper = { getPositionCount: () => 0, getPortfolioSummary: () => ({ totalValue: 100, cash: 50, openPositions: 0 }) };
    bot.strategy = { managePositions: jest.fn(), evaluateBuyOpportunity: jest.fn(() => Promise.resolve()) };
    bot.scanner = { scanMarkets: jest.fn(async () => [mockOpportunity]) };
    bot.sleep = jest.fn(() => Promise.resolve());
    // scanner will set isRunning false to exit after one loop
    bot.scanner.scanMarkets = jest.fn(async () => { bot.isRunning = false; return [mockOpportunity]; });
    const spyLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    await bot.mainLoop();
    expect(bot.strategy.evaluateBuyOpportunity).toHaveBeenCalled();
    spyLog.mockRestore();
  });
});
