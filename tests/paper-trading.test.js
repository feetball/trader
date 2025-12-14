// Mock fs/promises before importing module to avoid disk IO
jest.unstable_mockModule('fs/promises', () => ({
  default: {
    readFile: jest.fn(() => { throw new Error('ENOENT') }),
    writeFile: jest.fn(() => Promise.resolve())
  }
}))

import { jest } from '@jest/globals';
const fs = (await import('fs/promises')).default;

const { PaperTradingEngine } = await import('../paper-trading.js');

describe('PaperTradingEngine', () => {
  let engine

  beforeEach(async () => {
    jest.clearAllMocks()
    engine = new PaperTradingEngine()
    // Explicitly load portfolio in test environment
    await engine.loadPortfolio()
  })

  test('starts new portfolio when no file present', async () => {
    expect(fs.readFile).toHaveBeenCalled()
    expect(fs.writeFile).toHaveBeenCalled()
    expect(engine.getAvailableCash()).toBe(10000)
  })

  test('buy decreases cash and adds a position', async () => {
    const pos = await engine.buy('P1', 'C1', 1, 100)
    expect(pos).toBeTruthy()
    expect(engine.getPositionCount()).toBe(1)
    expect(engine.getAvailableCash()).toBe(9900)
  })

  test('sell removes position and records trade', async () => {
    const pos = await engine.buy('P2', 'C2', 2, 100)
    // simulate sale at higher price
    const trade = await engine.sell(pos, 3, 'Test sell')
    expect(trade).toHaveProperty('exitPrice', 3)
    expect(engine.getPositionCount()).toBe(0)
    expect(engine.portfolio.closedTrades.slice(-1)[0].reason).toBe('Test sell')
  })

  test('getPortfolioSummary returns coherent values', async () => {
    // reset portfolio
    engine.portfolio.cash = 5000
    engine.portfolio.positions = [ { productId: 'P2', quantity: 10, entryPrice: 1 } ]
    engine.portfolio.closedTrades = [ { profit: 5, netProfit: 3, totalFees: 1 } ]
    const summary = engine.getPortfolioSummary({ 'P2': 1.5 })
    expect(summary.totalValue).toBeGreaterThan(5000)
    expect(summary.totalTrades).toBe(1)
  })
})