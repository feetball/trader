import { jest } from '@jest/globals';
import { PaperTradingEngine } from '../paper-trading.js';
import { config } from '../config-utils.js';
import fsPromises from 'fs/promises';

describe('PaperTradingEngine extra', () => {
  let engine;

  beforeEach(() => {
    // Prevent actual file writes
    jest.spyOn(fsPromises, 'writeFile').mockResolvedValue();
    engine = new PaperTradingEngine();
    engine.portfolio = { cash: 1000, positions: [], closedTrades: [] };
    config.PROFIT_TARGET = 3;
    config.STOP_LOSS = -5;
    config.MAKER_FEE_PERCENT = 0.25;
    config.TAKER_FEE_PERCENT = 0.5;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('buy reduces cash and returns position', async () => {
    const pos = await engine.buy('P1', 'C1', 2, 100, { test: true });
    expect(pos).toHaveProperty('id');
    expect(engine.getPositionCount()).toBe(1);
    expect(engine.getAvailableCash()).toBe(900);
  });

  test('buy returns null when insufficient cash', async () => {
    engine.portfolio.cash = 10;
    const res = await engine.buy('P1', 'C1', 1, 100);
    expect(res).toBeNull();
  });

  test('sell removes position and records trade', async () => {
    // create a fake position
    const position = { id: 'pos_1', productId: 'P1', symbol: 'C1', entryPrice: 1, quantity: 10, investedAmount: 10, buyFee: 0.025, entryTime: Date.now() - 1000 };
    engine.portfolio.positions.push(position);
    const trade = await engine.sell(position, 2.0, 'Test sell');
    expect(trade).toHaveProperty('exitPrice', 2.0);
    expect(engine.portfolio.closedTrades.length).toBe(1);
    expect(engine.getAvailableCash()).toBeGreaterThan(0);
  });

  test('getPortfolioSummary computes ROI and stats', () => {
    engine.portfolio.cash = 900;
    engine.portfolio.positions = [ { productId: 'P1', quantity: 1, entryPrice: 1 } ];
    engine.portfolio.closedTrades = [ { profit: 5, netProfit: 4, totalFees: 1 } ];
    const summary = engine.getPortfolioSummary({ P1: 1.5 });
    expect(summary.totalValue).toBeGreaterThan(900);
    expect(summary.totalTrades).toBe(1);
    expect(summary.winRate).toBeGreaterThanOrEqual(0);
  });

  test('printSummary logs output', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    engine.printSummary({ P1: 1 });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
