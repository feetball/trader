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
    const position = { productId: 'P1', symbol: 'C1', entryPrice: 1, quantity: 10, investedAmount: 10, entryTime: Date.now(), stopLoss: 0.9 }
    paper.getPositions.mockReturnValue([position])
    client.getCurrentPrice.mockResolvedValue(0.85)

    await strat.managePositions()
    expect(paper.sell).toHaveBeenCalled()
  })

  test('managePositions initiates trailing when profit target hit', async () => {
    const position = { productId: 'P1', symbol: 'C1', entryPrice: 1, quantity: 10, investedAmount: 10, entryTime: Date.now(), stopLoss: 0.9 }
    paper.getPositions.mockReturnValue([position])
    client.getCurrentPrice.mockResolvedValue(1.06) // 6% profit

    await strat.managePositions()
    // peakPrices should be set for P1
    expect(strat.peakPrices.has('P1')).toBe(true)
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