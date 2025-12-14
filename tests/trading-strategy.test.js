import { jest } from '@jest/globals';
import { TradingStrategy } from '../trading-strategy.js'
import { config } from '../config-utils.js'

function makeMockPaper() {
  return {
    getAvailableCash: jest.fn(() => 1000),
    getPositionCount: jest.fn(() => 0),
    getPositions: jest.fn(() => []),
    buy: jest.fn(() => Promise.resolve()),
    sell: jest.fn(() => Promise.resolve()),
    getPortfolioSummary: jest.fn(() => ({ totalValue: 10000 }))
  }
}

function makeMockClient() {
  return {
    getCurrentPrice: jest.fn(),
    getCandles: jest.fn()
  }
}

describe('TradingStrategy', () => {
  let paper, client, strat

  beforeEach(() => {
    paper = makeMockPaper()
    client = makeMockClient()
    strat = new TradingStrategy(client, paper)

    config.POSITION_SIZE = 100
    config.MAX_POSITIONS = 5
    config.PAPER_TRADING = true
    config.PROFIT_TARGET = 5
    config.TRAILING_STOP_PERCENT = 1
    config.ENABLE_TRAILING_PROFIT = true
    config.MIN_MOMENTUM_TO_RIDE = 0.5
  })

  test('evaluateBuyOpportunity buys when criteria met', async () => {
    const opp = {
      productId: 'P1', symbol: 'C1', price: 0.5, momentum: 3.5, rsi: 50,
      volumeSurge: { ratio: 3, isSurge: true }, volume24h: 200
    }

    const res = await strat.evaluateBuyOpportunity(opp)
    expect(res).toBe(true)
    expect(paper.buy).toHaveBeenCalled()
  })

  test('evaluateBuyOpportunity skips when insufficient cash', async () => {
    paper.getAvailableCash.mockReturnValue(50)
    const opp = { productId: 'P1', symbol: 'C1', price: 0.5, momentum: 3.5 }
    const res = await strat.evaluateBuyOpportunity(opp)
    expect(res).toBe(false)
    expect(paper.buy).not.toHaveBeenCalled()
  })

  test('managePositions sells on stop loss', async () => {
    const position = { productId: 'P1', symbol: 'C1', entryPrice: 1, quantity: 10, investedAmount: 10, entryTime: Date.now(), stopLoss: 0.9, targetPrice: 1.05 }
    paper.getPositions.mockReturnValue([position])
    client.getCurrentPrice.mockResolvedValue(0.85)

    await strat.managePositions()
    expect(paper.sell).toHaveBeenCalled()
  })

  test('managePositions initiates trailing when profit target hit', async () => {
    const position = { productId: 'P1', symbol: 'C1', entryPrice: 1, quantity: 10, investedAmount: 10, entryTime: Date.now(), stopLoss: 0.9, targetPrice: 1.05 }
    paper.getPositions.mockReturnValue([position])
    client.getCurrentPrice.mockResolvedValue(1.06) // 6% profit

    await strat.managePositions()
    // peakPrices should be set for P1
    expect(strat.peakPrices.has('P1')).toBe(true)
  })

  test('managePositions sells when price drops from peak beyond trailing stop', async () => {
    // Enable trailing
    config.ENABLE_TRAILING_PROFIT = true

    const position = { productId: 'PX', symbol: 'CX', entryPrice: 1, quantity: 1, investedAmount: 1, entryTime: Date.now(), stopLoss: 0.5, targetPrice: 1.05 }
    paper.getPositions.mockReturnValue([position])

    // First call: set peak
    client.getCurrentPrice.mockResolvedValueOnce(1.06)
    await strat.managePositions()
    expect(strat.peakPrices.has('PX')).toBe(true)

    // Second call: higher price to create new peak
    client.getCurrentPrice.mockResolvedValueOnce(1.08)
    await strat.managePositions()
    expect(strat.peakPrices.get('PX')).toBeCloseTo(1.08)

    // Third call: drop enough from peak to trigger sell
    client.getCurrentPrice.mockResolvedValueOnce(1.0)
    client.getCandles.mockResolvedValue([{ close: 1 }, { close: 0.99 }])

    await strat.managePositions()
    expect(paper.sell).toHaveBeenCalled()

    // cleanup
    config.ENABLE_TRAILING_PROFIT = false
  })

  test('managePositions sells on momentum fade during trailing mode', async () => {
    // Enable trailing
    config.ENABLE_TRAILING_PROFIT = true

    const position = { productId: 'PM', symbol: 'CM', entryPrice: 1, quantity: 1, investedAmount: 1, entryTime: Date.now(), stopLoss: 0.5, targetPrice: 1.05 }
    paper.getPositions.mockReturnValue([position])

    // Set a peak
    client.getCurrentPrice.mockResolvedValueOnce(1.06)
    await strat.managePositions()
    expect(strat.peakPrices.has('PM')).toBe(true)

    // Now simulate a drop smaller than trailing stop but with negative momentum large enough to sell
    const peak = strat.peakPrices.get('PM')
    client.getCurrentPrice.mockResolvedValueOnce(1.02) // slight drop

    // candles to cause recentMomentum < -MIN_MOMENTUM_TO_RIDE
    client.getCandles.mockResolvedValueOnce([
      { close: 1.00 },
      { close: 1.05 }
    ])

    await strat.managePositions()
    expect(paper.sell).toHaveBeenCalled()

    // cleanup
    config.ENABLE_TRAILING_PROFIT = false
  })

  test('sellPosition calls paper.sell in paper trading mode', async () => {
    const position = { productId: 'P1' }
    await strat.sellPosition(position, 1.0, 'reason')
    expect(paper.sell).toHaveBeenCalled()
  })

  test('getStats delegates to paper.getPortfolioSummary', () => {
    expect(strat.getStats()).toEqual({ totalValue: 10000 })
  })
})