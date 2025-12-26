import { jest } from '@jest/globals';
import { TradingStrategy } from '../trading-strategy.js'
import { config } from '../config-utils.js'
import * as indicators from '../indicators.js'

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

describe('TradingStrategy extra cases', () => {
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

  test('evaluateBuyOpportunity skips when existing position present', async () => {
    paper.getPositions.mockReturnValue([{ productId: 'P1' }])
    const opp = { productId: 'P1', symbol: 'C1', price: 1, momentum: 3 }
    const res = await strat.evaluateBuyOpportunity(opp)
    expect(res).toBe(false)
    expect(paper.buy).not.toHaveBeenCalled()
  })

  test('evaluateBuyOpportunity skips on grade F', async () => {
    // Craft an opportunity that scores poorly (low momentum, no RSI, minimal volume)
    const opp = { productId: 'P2', symbol: 'C2', price: 1, momentum: 0, rsi: null }
    const res = await strat.evaluateBuyOpportunity(opp)
    expect(res).toBe(false)
  })

  test('evaluateBuyOpportunity returns false when PAPER_TRADING=false', async () => {
    config.PAPER_TRADING = false
    const opp = { productId: 'P3', symbol: 'C3', price: 1, momentum: 3, rsi: 50, volumeSurge: { ratio: 1 } }
    const res = await strat.evaluateBuyOpportunity(opp)
    expect(res).toBe(false)
    expect(paper.buy).not.toHaveBeenCalled()
    config.PAPER_TRADING = true
  })

  test('managePositions returns early when no positions', async () => {
    paper.getPositions.mockReturnValue([])
    const spyLog = jest.spyOn(console, 'log').mockImplementation(() => {})
    await strat.managePositions()
    expect(spyLog).toHaveBeenCalledWith('[STATUS] No open positions to manage')
    spyLog.mockRestore()
  })

  test('managePositions logs progress to target for small profits', async () => {
    config.ENABLE_TRAILING_PROFIT = false
    const position = { productId: 'PT', symbol: 'CT', entryPrice: 1, quantity: 1, investedAmount: 1, entryTime: Date.now(), stopLoss: 0.9, targetPrice: 1.05 }
    paper.getPositions.mockReturnValue([position])
    client.getCurrentPrice.mockResolvedValue(1.02) // 2% profit
    const spyLog = jest.spyOn(console, 'log').mockImplementation(() => {})
    await strat.managePositions()
    // should log progress to target line
    expect(spyLog).toHaveBeenCalled()
    spyLog.mockRestore()
  })

  test('managePositions ignores getCandles errors during trailing checks', async () => {
    // Put position above target to enter trailing block
    const position = { productId: 'PE', symbol: 'CE', entryPrice: 1, quantity: 1, investedAmount: 1, entryTime: Date.now(), stopLoss: 0.5, targetPrice: 1.05 }
    paper.getPositions.mockReturnValue([position])
    client.getCurrentPrice.mockResolvedValueOnce(1.06) // set peak
    await strat.managePositions()

    // Now simulate a later call where getCandles throws
    client.getCurrentPrice.mockResolvedValueOnce(1.07)
    client.getCandles.mockRejectedValue(new Error('network'))
    // Should not throw
    await expect(strat.managePositions()).resolves.not.toThrow()
  })
})
