import { jest } from '@jest/globals';
import { TradingStrategy } from '../trading-strategy.js';
import { config } from '../config-utils.js';

describe('TradingStrategy managePositions edge branches', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    // restore defaults
    config.ENABLE_TRAILING_PROFIT = true;
    config.TRAILING_STOP_PERCENT = 1.5;
    config.PROFIT_TARGET = 3.0;
    config.MIN_MOMENTUM_TO_RIDE = 0.5;
  });

  test('skips when current price is unavailable', async () => {
    const client = { getCurrentPrice: jest.fn().mockResolvedValue(null) };
    const paper = { getPositions: jest.fn().mockReturnValue([{ productId: 'P1', symbol: 'S1', entryPrice: 1, stopLoss: 0.9, targetPrice: 1.03, quantity: 1, investedAmount: 1, entryTime: Date.now() }]) };
    const strategy = new TradingStrategy(client, paper);

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await strategy.managePositions();
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  test('sets new peak when profit target first reached', async () => {
    const client = { getCurrentPrice: jest.fn().mockResolvedValue(1.05) };
    const sellSpy = jest.fn();
    const paper = {
      getPositions: jest.fn().mockReturnValue([{ productId: 'P2', symbol: 'S2', entryPrice: 1.0, stopLoss: 0.95, targetPrice: 1.03, quantity: 1, investedAmount: 1, entryTime: Date.now() }]),
      sell: sellSpy
    };
    const strategy = new TradingStrategy(client, paper);

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await strategy.managePositions();
    // peak should be set for P2
    expect(strategy.peakPrices.get('P2')).toBe(1.05);
    expect(sellSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });

  test('updates peak when new higher price arrives', async () => {
    const client = { getCurrentPrice: jest.fn().mockResolvedValue(1.2) };
    const paper = {
      getPositions: jest.fn().mockReturnValue([{ productId: 'P3', symbol: 'S3', entryPrice: 1.0, stopLoss: 0.9, targetPrice: 1.03, quantity: 1, investedAmount: 1, entryTime: Date.now() }]),
      sell: jest.fn()
    };
    const strategy = new TradingStrategy(client, paper);
    strategy.peakPrices.set('P3', 1.1);

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await strategy.managePositions();
    expect(strategy.peakPrices.get('P3')).toBe(1.2);
    logSpy.mockRestore();
  });

  test('triggers trailing stop sell when drop >= trailing percent', async () => {
    const client = { getCurrentPrice: jest.fn().mockResolvedValue(0.95), getCandles: jest.fn().mockResolvedValue([]) };
    const sellSpy = jest.fn().mockResolvedValue();
    const paper = {
      getPositions: jest.fn().mockReturnValue([{ productId: 'P4', symbol: 'S4', entryPrice: 1.0, stopLoss: 0.8, targetPrice: 1.03, quantity: 1, investedAmount: 1, entryTime: Date.now() }]),
      sell: sellSpy
    };
    const strategy = new TradingStrategy(client, paper);
    // set peak high so drop triggers
    strategy.peakPrices.set('P4', 1.2);

    // make trailing threshold small to trigger easily
    config.TRAILING_STOP_PERCENT = 10; // so drop from 1.2 to 0.95 is >= 10%

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await strategy.managePositions();
    expect(sellSpy).toHaveBeenCalled();
    expect(strategy.peakPrices.has('P4')).toBe(false);
    logSpy.mockRestore();
  });

  test('progress to target logs when in profit but below target', async () => {
    const client = { getCurrentPrice: jest.fn().mockResolvedValue(1.02) };
    const paper = {
      getPositions: jest.fn().mockReturnValue([{ productId: 'P5', symbol: 'S5', entryPrice: 1.0, stopLoss: 0.95, targetPrice: 1.03, quantity: 1, investedAmount: 1, entryTime: Date.now() }]),
      sell: jest.fn()
    };
    const strategy = new TradingStrategy(client, paper);

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await strategy.managePositions();
    // progress-to-target log should have been produced
    expect(logSpy.mock.calls.some(c => String(c[0]).includes('progress to')) || logSpy.mock.calls.some(c => String(c[0]).includes('progress to')) ).toBe(true);
    logSpy.mockRestore();
  });
});
