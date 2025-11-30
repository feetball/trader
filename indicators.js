/**
 * Technical Indicators for improved trading signals
 */

/**
 * Calculate RSI (Relative Strength Index)
 * @param {Array} prices - Array of closing prices (newest first)
 * @param {number} period - RSI period (default 14)
 * @returns {number} RSI value 0-100
 */
export function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) return null;
  
  let gains = 0;
  let losses = 0;
  
  // Calculate initial average gain/loss
  for (let i = 0; i < period; i++) {
    const change = prices[i] - prices[i + 1];
    if (change > 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Calculate VWAP (Volume Weighted Average Price)
 * @param {Array} candles - Array of candle data with high, low, close, volume
 * @returns {number} VWAP value
 */
export function calculateVWAP(candles) {
  if (!candles || candles.length === 0) return null;
  
  let cumulativeTPV = 0; // Typical Price * Volume
  let cumulativeVolume = 0;
  
  for (const candle of candles) {
    const typicalPrice = (parseFloat(candle.high) + parseFloat(candle.low) + parseFloat(candle.close)) / 3;
    const volume = parseFloat(candle.volume);
    
    cumulativeTPV += typicalPrice * volume;
    cumulativeVolume += volume;
  }
  
  return cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : null;
}

/**
 * Detect volume surge
 * @param {Array} candles - Array of candle data with volume
 * @param {number} threshold - Multiplier vs average (default 2x)
 * @returns {object} { isSurge, ratio }
 */
export function detectVolumeSurge(candles, threshold = 2) {
  if (!candles || candles.length < 5) return { isSurge: false, ratio: 0 };
  
  const currentVolume = parseFloat(candles[0].volume);
  const avgVolume = candles.slice(1).reduce((sum, c) => sum + parseFloat(c.volume), 0) / (candles.length - 1);
  
  const ratio = avgVolume > 0 ? currentVolume / avgVolume : 0;
  
  return {
    isSurge: ratio >= threshold,
    ratio: ratio
  };
}

/**
 * Calculate momentum score with multiple factors
 * @param {object} data - { priceChange, volumeRatio, rsi, priceVsVwap }
 * @returns {number} Combined momentum score
 */
export function calculateMomentumScore(data) {
  const { priceChange, volumeRatio, rsi, priceVsVwap } = data;
  
  let score = 0;
  let factors = 0;
  
  // Price momentum (primary factor)
  if (priceChange !== null) {
    score += priceChange * 1.5; // Weight price change heavily
    factors++;
  }
  
  // Volume confirmation (secondary factor)
  if (volumeRatio !== null && volumeRatio > 1) {
    score += Math.min(volumeRatio - 1, 2) * 0.5; // Cap at 2x bonus
    factors++;
  }
  
  // RSI filter (avoid overbought)
  if (rsi !== null) {
    if (rsi > 70) {
      score -= 1; // Penalty for overbought
    } else if (rsi < 40 && priceChange > 0) {
      score += 0.5; // Bonus for recovery from oversold
    }
    factors++;
  }
  
  // VWAP confirmation
  if (priceVsVwap !== null && priceVsVwap > 0) {
    score += 0.3; // Trading above VWAP is bullish
    factors++;
  }
  
  return score;
}

/**
 * Check if price action is favorable for entry
 * @param {Array} candles - Recent candles
 * @returns {object} { favorable, reason }
 */
export function checkPriceAction(candles) {
  if (!candles || candles.length < 3) {
    return { favorable: true, reason: 'Insufficient data' };
  }
  
  const current = candles[0];
  const prev = candles[1];
  const prev2 = candles[2];
  
  const currentClose = parseFloat(current.close);
  const currentHigh = parseFloat(current.high);
  const currentLow = parseFloat(current.low);
  const prevClose = parseFloat(prev.close);
  
  // Check for bullish candle pattern
  const isBullish = currentClose > prevClose;
  const bodySize = Math.abs(currentClose - parseFloat(current.open));
  const range = currentHigh - currentLow;
  const bodyRatio = range > 0 ? bodySize / range : 0;
  
  // Strong bullish: large body, small wicks
  if (isBullish && bodyRatio > 0.6) {
    return { favorable: true, reason: 'Strong bullish candle' };
  }
  
  // Avoid buying after big red candle
  if (!isBullish && bodyRatio > 0.7) {
    return { favorable: false, reason: 'Strong bearish candle' };
  }
  
  // Check for higher lows (uptrend)
  const prevLow = parseFloat(prev.low);
  const prev2Low = parseFloat(prev2.low);
  if (currentLow > prevLow && prevLow > prev2Low) {
    return { favorable: true, reason: 'Higher lows pattern' };
  }
  
  return { favorable: true, reason: 'Neutral' };
}

/**
 * Calculate dynamic stop loss based on volatility
 * @param {number} entryPrice - Entry price
 * @param {Array} candles - Recent candles for ATR calculation
 * @param {number} multiplier - ATR multiplier (default 1.5)
 * @returns {number} Stop loss price
 */
export function calculateDynamicStopLoss(entryPrice, candles, multiplier = 1.5) {
  if (!candles || candles.length < 5) {
    // Fall back to percentage-based
    return entryPrice * 0.97; // 3% stop loss
  }
  
  // Calculate ATR (Average True Range)
  let trSum = 0;
  for (let i = 0; i < Math.min(candles.length - 1, 14); i++) {
    const high = parseFloat(candles[i].high);
    const low = parseFloat(candles[i].low);
    const prevClose = parseFloat(candles[i + 1].close);
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trSum += tr;
  }
  
  const atr = trSum / Math.min(candles.length - 1, 14);
  const stopLoss = entryPrice - (atr * multiplier);
  
  // Ensure stop loss is at least 1.5% below entry but not more than 5%
  const minStop = entryPrice * 0.95;
  const maxStop = entryPrice * 0.985;
  
  return Math.max(minStop, Math.min(maxStop, stopLoss));
}

/**
 * Score overall trade quality
 * @param {object} opportunity - Trade opportunity data
 * @param {object} indicators - Calculated indicators
 * @returns {object} { score, grade, reasons }
 */
export function scoreTrade(opportunity, indicators) {
  let score = 0;
  const reasons = [];
  
  // Momentum (0-40 points)
  if (opportunity.momentum >= 3) {
    score += 40;
    reasons.push('Strong momentum (3%+)');
  } else if (opportunity.momentum >= 2) {
    score += 30;
    reasons.push('Good momentum (2%+)');
  } else if (opportunity.momentum >= 1.5) {
    score += 20;
    reasons.push('Moderate momentum');
  } else {
    score += 10;
  }
  
  // Volume (0-25 points)
  if (indicators.volumeRatio >= 3) {
    score += 25;
    reasons.push('Volume surge (3x+)');
  } else if (indicators.volumeRatio >= 2) {
    score += 20;
    reasons.push('High volume (2x+)');
  } else if (indicators.volumeRatio >= 1.5) {
    score += 15;
    reasons.push('Above average volume');
  } else {
    score += 5;
  }
  
  // RSI (0-20 points)
  if (indicators.rsi !== null) {
    if (indicators.rsi > 70) {
      score -= 10;
      reasons.push('⚠️ Overbought (RSI > 70)');
    } else if (indicators.rsi < 30) {
      score += 15;
      reasons.push('Oversold bounce potential');
    } else if (indicators.rsi >= 40 && indicators.rsi <= 60) {
      score += 20;
      reasons.push('RSI in healthy range');
    } else {
      score += 10;
    }
  }
  
  // Price action (0-15 points)
  if (indicators.priceAction?.favorable) {
    score += 15;
    if (indicators.priceAction.reason !== 'Neutral') {
      reasons.push(indicators.priceAction.reason);
    }
  }
  
  // Determine grade
  let grade;
  if (score >= 80) grade = 'A';
  else if (score >= 65) grade = 'B';
  else if (score >= 50) grade = 'C';
  else if (score >= 35) grade = 'D';
  else grade = 'F';
  
  return { score, grade, reasons };
}
