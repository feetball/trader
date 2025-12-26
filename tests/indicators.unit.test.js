import { calculateRSI, calculateVWAP, detectVolumeSurge, calculateMomentumScore, checkPriceAction, calculateDynamicStopLoss, scoreTrade } from '../indicators.js';

test('calculateRSI returns null for insufficient data and 100 when avgLoss is 0', () => {
  expect(calculateRSI([1, 2, 3], 14)).toBeNull();

  // craft prices where losses are zero
  // Provide prices newest-first where each previous price is higher than next (strictly decreasing)
  const prices = Array.from({ length: 15 }, (_, i) => 114 - i); // 114,113,...,100
  expect(calculateRSI(prices, 14)).toBe(100);
});

test('calculateVWAP returns null on empty and computes value', () => {
  expect(calculateVWAP([])).toBeNull();
  const candles = [
    { high: '2', low: '1', close: '1.5', volume: '10' },
    { high: '3', low: '2', close: '2.5', volume: '20' }
  ];
  const vwap = calculateVWAP(candles);
  expect(typeof vwap).toBe('number');
  expect(vwap).toBeGreaterThan(0);
});

test('detectVolumeSurge handles insufficient data and detects surges', () => {
  expect(detectVolumeSurge([], 2)).toEqual({ isSurge: false, ratio: 0 });
  const candles = [
    { volume: '100' },
    { volume: '10' },
    { volume: '10' },
    { volume: '10' },
    { volume: '10' }
  ];
  const result = detectVolumeSurge(candles, 2);
  expect(result.isSurge).toBe(true);
  expect(result.ratio).toBeGreaterThanOrEqual(2);
});

test('calculateMomentumScore weights factors and penalties', () => {
  const score1 = calculateMomentumScore({ priceChange: 1, volumeRatio: 3, rsi: 75, priceVsVwap: 0.5 });
  expect(score1).toBeDefined();
  // Overbought should reduce score somewhere
  expect(score1).toBeLessThan(1.5 * 1 + 0.5 * 2 + 0.3 + 10); // rough sanity check

  const score2 = calculateMomentumScore({ priceChange: 2, volumeRatio: 0.5, rsi: 25, priceVsVwap: -1 });
  expect(score2).toBeDefined();
});

test('checkPriceAction covers various patterns', () => {
  expect(checkPriceAction([])).toEqual({ favorable: true, reason: 'Insufficient data' });

  // Strong bullish candle
  const bullish = [
    { open: '1', high: '2', low: '1', close: '1.9' },
    { open: '1', high: '1.5', low: '1', close: '1.1' },
    { open: '0.9', high: '1.1', low: '0.8', close: '0.95' }
  ];
  expect(checkPriceAction(bullish).reason).toMatch(/Strong bullish/);

  // Strong bearish
  const bearish = [
    { open: '2', high: '2', low: '1', close: '1.1' },
    { open: '1.9', high: '2', low: '1.8', close: '1.85' },
    { open: '1.8', high: '1.95', low: '1.7', close: '1.75' }
  ];
  expect(checkPriceAction(bearish).reason).toMatch(/bearish/);

  // Higher lows
  const higherLows = [
    { open: '1.00', high: '1.05', low: '1.01', close: '1.02' },
    { open: '0.98', high: '1.02', low: '1.00', close: '1.01' },
    { open: '0.95', high: '0.99', low: '0.99', close: '0.98' }
  ];
  expect(checkPriceAction(higherLows).reason).toMatch(/Higher lows/);
});

test('calculateDynamicStopLoss falls back on insufficient data and clamps ATR values', () => {
  const fallback = calculateDynamicStopLoss(100, []);
  expect(fallback).toBeCloseTo(97);

  const candles = [];
  // build 6 candles with small ATR
  for (let i = 0; i < 6; i++) {
    candles.push({ high: (100 + i + 1).toString(), low: (99 + i).toString(), close: (99.5 + i).toString() });
  }
  const sl = calculateDynamicStopLoss(100, candles, 1.5);
  // stop loss should be between 95 and 98.5 (minStop and maxStop)
  expect(sl).toBeGreaterThanOrEqual(95);
  expect(sl).toBeLessThanOrEqual(98.5);
});

test('scoreTrade returns expected grade buckets', () => {
  const high = scoreTrade({ momentum: 4 }, { volumeRatio: 3, rsi: 50, priceAction: { favorable: true, reason: 'x' } });
  expect(high.grade).toBe('A');

  const med = scoreTrade({ momentum: 2.1 }, { volumeRatio: 1.6, rsi: 55, priceAction: { favorable: true } });
  expect(['A','B','C']).toContain(med.grade);

  const low = scoreTrade({ momentum: 0.5 }, { volumeRatio: 1, rsi: 80, priceAction: { favorable: false, reason: 'x' } });
  expect(low.grade).toBe('F');
});
