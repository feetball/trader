import { calculateRSI, calculateVWAP, detectVolumeSurge, calculateMomentumScore, checkPriceAction, calculateDynamicStopLoss, scoreTrade } from '../indicators.js'

describe('Indicators', () => {
  describe('calculateRSI', () => {
    test('returns null for insufficient data', () => {
      expect(calculateRSI([1, 2, 3], 14)).toBeNull()
    })

    test('returns 100 when avgLoss is zero', () => {
      // Prices strictly decreasing (newest first) -> no losses
      const prices = []
      for (let i = 0; i < 20; i++) prices.push(200 - i)
      expect(calculateRSI(prices, 14)).toBe(100)
    })

    test('computes reasonable RSI for mixed prices', () => {
      const prices = [110, 108, 107, 109, 111, 112, 110, 111, 115, 114, 113, 116, 118, 119, 120]
      const rsi = calculateRSI(prices, 14)
      expect(typeof rsi).toBe('number')
      expect(rsi).toBeGreaterThanOrEqual(0)
      expect(rsi).toBeLessThanOrEqual(100)
    })
  })

  describe('calculateVWAP', () => {
    test('returns null for empty candles', () => {
      expect(calculateVWAP([])).toBeNull()
    })

    test('computes VWAP correctly', () => {
      const candles = [
        { high: '10', low: '9', close: '9.5', volume: '100' },
        { high: '11', low: '10', close: '10.5', volume: '200' }
      ]
      const vwap = calculateVWAP(candles)
      // manual: ((9.5+10+9)/3*100 + (10.5+11+10)/3*200) / 300
      expect(typeof vwap).toBe('number')
      expect(vwap).toBeGreaterThan(9)
      expect(vwap).toBeLessThan(11)
    })
  })

  describe('detectVolumeSurge', () => {
    test('returns false for too few candles', () => {
      expect(detectVolumeSurge([{ volume: '10' }])).toEqual({ isSurge: false, ratio: 0 })
    })

    test('detects surge when current >> average', () => {
      const candles = [
        { volume: '1000' },
        { volume: '100' },
        { volume: '120' },
        { volume: '90' },
        { volume: '110' }
      ]
      const res = detectVolumeSurge(candles, 3)
      expect(res.isSurge).toBe(true)
      expect(res.ratio).toBeGreaterThanOrEqual(3)
    })
  })

  describe('calculateMomentumScore', () => {
    test('weights factors and returns numeric score', () => {
      const score = calculateMomentumScore({ priceChange: 2, volumeRatio: 2.5, rsi: 50, priceVsVwap: 0.1 })
      expect(typeof score).toBe('number')
      // priceChange contributes 3.0, volume contributes ~0.75, priceVsVwap 0.3
      expect(score).toBeGreaterThan(3)
    })

    test('penalizes overbought RSI', () => {
      const score1 = calculateMomentumScore({ priceChange: 2, volumeRatio: 1, rsi: 75, priceVsVwap: 0 })
      const score2 = calculateMomentumScore({ priceChange: 2, volumeRatio: 1, rsi: 50, priceVsVwap: 0 })
      expect(score1).toBeLessThan(score2)
    })
  })

  describe('checkPriceAction', () => {
    test('insufficient data returns favorable true', () => {
      expect(checkPriceAction([])).toEqual({ favorable: true, reason: 'Insufficient data' })
    })

    test('detects strong bullish candle', () => {
      const candles = [
        { open: '10', high: '11', low: '9.9', close: '10.9' },
        { open: '10', high: '10.2', low: '9.8', close: '10' },
        { open: '9.8', high: '10', low: '9.5', close: '9.9' }
      ]
      expect(checkPriceAction(candles).favorable).toBe(true)
    })

    test('detects strong bearish and returns unfavorable', () => {
      const candles = [
        { open: '10', high: '10.1', low: '8', close: '8.1' },
        { open: '10', high: '10.2', low: '9.8', close: '9.95' },
        { open: '9.8', high: '10', low: '9.5', close: '9.9' }
      ]
      const res = checkPriceAction(candles)
      expect(res.favorable).toBe(false)
    })

    test('detects higher lows', () => {
      const candles = [
        { open: '10', high: '10.2', low: '9.9', close: '10.1' },
        { open: '9.9', high: '10', low: '9.8', close: '9.95' },
        { open: '9.8', high: '9.9', low: '9.7', close: '9.85' }
      ]
      expect(checkPriceAction(candles)).toEqual({ favorable: true, reason: 'Higher lows pattern' })
    })
  })

  describe('calculateDynamicStopLoss', () => {
    test('falls back to 3% when insufficient candles', () => {
      const stop = calculateDynamicStopLoss(100, [{ high: '10' }])
      expect(stop).toBeCloseTo(97)
    })

    test('uses ATR-based stop loss within bounds', () => {
      // Craft candles with small ATR
      const candles = []
      // Most recent first
      for (let i = 0; i < 10; i++) {
        candles.push({ high: (100 + i + 1).toString(), low: (99 + i).toString(), close: (99.5 + i).toString() })
      }
      const stop = calculateDynamicStopLoss(100, candles, 1)
      const minStop = 100 * 0.95
      const maxStop = 100 * 0.985
      expect(stop).toBeGreaterThanOrEqual(minStop)
      expect(stop).toBeLessThanOrEqual(maxStop)
    })
  })

  describe('scoreTrade', () => {
    test('assigns A grade for strong metrics', () => {
      const opp = { momentum: 3.5 }
      const inds = { volumeRatio: 3.5, rsi: 50, priceAction: { favorable: true, reason: 'Strong bullish candle' } }
      const res = scoreTrade(opp, inds)
      expect(res.grade).toBe('A')
      expect(res.score).toBeGreaterThanOrEqual(80)
      expect(res.reasons.length).toBeGreaterThan(0)
    })

    test('penalizes overbought RSI', () => {
      const opp = { momentum: 2 }
      const inds = { volumeRatio: 1.2, rsi: 75, priceAction: { favorable: true, reason: 'Neutral' } }
      const res = scoreTrade(opp, inds)
      expect(res.reasons).toContain('⚠️ Overbought (RSI > 70)')
    })
  })
})
