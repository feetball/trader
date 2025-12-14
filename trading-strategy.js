import { config } from './config-utils.js';
import { calculateDynamicStopLoss, scoreTrade } from './indicators.js';

/**
 * Trading Strategy - Handles buy/sell decisions and position management
 */
export class TradingStrategy {
  constructor(coinbaseClient, paperTrading) {
    this.client = coinbaseClient;
    this.paper = paperTrading;
    this.peakPrices = new Map(); // Track peak prices for trailing profit
  }

  /**
   * Evaluate and execute buy opportunities
   */
  async evaluateBuyOpportunity(opportunity) {
    // Check if we have cash available
    const availableCash = this.paper.getAvailableCash();
    
    if (availableCash < config.POSITION_SIZE) {
      console.log(`⏸️  Insufficient cash for new position: $${availableCash.toFixed(2)} available`);
      return false;
    }

    // Check if we're at max positions
    if (this.paper.getPositionCount() >= config.MAX_POSITIONS) {
      console.log(`⏸️  Max positions reached (${config.MAX_POSITIONS})`);
      return false;
    }

    // Check if we already have a position in this product
    const existingPosition = this.paper.getPositions().find(p => p.productId === opportunity.productId);
    if (existingPosition) {
      console.log(`⏸️  Already have position in ${opportunity.symbol}`);
      return false;
    }

    // Score the trade opportunity
    const indicators = {
      volumeRatio: opportunity.volumeSurge?.ratio || 1,
      rsi: opportunity.rsi,
      priceAction: opportunity.priceAction
    };
    const tradeScore = scoreTrade(opportunity, indicators);
    
    // Skip low-grade trades
    if (tradeScore.grade === 'F') {
      console.log(`⏸️  Skipping ${opportunity.symbol}: Grade F trade`);
      return false;
    }

    // Execute buy
    console.log(`\n🚀 BUY SIGNAL: ${opportunity.symbol} [Grade ${tradeScore.grade}]`);
    console.log(`   Price: $${opportunity.price.toFixed(6)}`);
    console.log(`   Momentum: +${opportunity.momentum.toFixed(2)}%`);
    console.log(`   RSI: ${opportunity.rsi?.toFixed(0) || 'N/A'}`);
    console.log(`   Volume: ${opportunity.volumeSurge?.isSurge ? '📈 SURGE ' : ''}${opportunity.volumeSurge?.ratio?.toFixed(1) || '?'}x avg`);
    console.log(`   24h Vol: $${(opportunity.volume24h/1000).toFixed(0)}k`);
    if (tradeScore.reasons.length > 0) {
      console.log(`   Signals: ${tradeScore.reasons.join(', ')}`);
    }

    if (config.PAPER_TRADING) {
      await this.paper.buy(
        opportunity.productId,
        opportunity.symbol,
        opportunity.price,
        config.POSITION_SIZE,
        {
          timestamp: Date.now(),
          price: opportunity.price,
          momentum: opportunity.momentum,
          rawMomentum: opportunity.rawMomentum,
          rsi: opportunity.rsi,
          volumeSurge: opportunity.volumeSurge || null,
          priceAction: opportunity.priceAction || null,
          volume24h: opportunity.volume24h,
          priceChange24h: opportunity.priceChange24h,
          grade: tradeScore.grade,
          score: tradeScore.score,
          reasons: tradeScore.reasons,
        }
      );
      return true;
    } else {
      // Real trading (not implemented for safety)
      console.log('⚠️  Real trading not implemented - switch PAPER_TRADING to true in config.js');
      return false;
    }
  }

  /**
   * Check and manage open positions
   */
  async managePositions() {
    const positions = this.paper.getPositions();
    
    if (positions.length === 0) {
      console.log(`[STATUS] No open positions to manage`);
      return;
    }

    console.log(`[STATUS] Checking ${positions.length} position(s) for exit signals...`);

    for (const position of positions) {
      try {
        // Get current price
        console.log(`[STATUS] Fetching price for ${position.symbol}...`);
        const currentPrice = await this.client.getCurrentPrice(position.productId);
        
        if (!currentPrice) {
          console.log(`⚠️  Could not get price for ${position.symbol}`);
          continue;
        }

        const profitPercent = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;
        const currentValue = position.quantity * currentPrice;
        const profit = currentValue - position.investedAmount;
        const holdTimeMinutes = (Date.now() - position.entryTime) / 60000;
        
        // Calculate distance to stop loss for better visibility
        const distanceToStopLoss = ((currentPrice - position.stopLoss) / position.stopLoss) * 100;

        console.log(`[STATUS] ${position.symbol}: $${currentPrice.toFixed(4)} | P&L: ${profitPercent >= 0 ? '+' : ''}${profitPercent.toFixed(2)}% ($${profit.toFixed(2)}) | Hold: ${holdTimeMinutes.toFixed(0)}m`);
        console.log(`[STATUS]    Stop Loss: $${position.stopLoss.toFixed(6)} (${distanceToStopLoss >= 0 ? '+' : ''}${distanceToStopLoss.toFixed(2)}% away) | Target: $${position.targetPrice.toFixed(6)}`);

        // Check stop loss first (this is critical!)
        if (currentPrice <= position.stopLoss) {
          console.log(`[STATUS] 🛑 ${position.symbol} HIT STOP LOSS!`);
          console.log(`[STATUS]    Entry: $${position.entryPrice.toFixed(6)} | Stop: $${position.stopLoss.toFixed(6)} | Current: $${currentPrice.toFixed(6)}`);
          console.log(`[STATUS]    Loss: ${profitPercent.toFixed(2)}% ($${profit.toFixed(2)}) - SELLING NOW`);
          this.peakPrices.delete(position.productId);
          await this.paper.sell(position, currentPrice, `Stop loss hit (${profitPercent.toFixed(1)}%)`);
          continue;
        }

        // Check if we have an active trailing stop (peak was set when we crossed profit target)
        const existingPeak = this.peakPrices.get(position.productId);
        
        // Check if profit target reached OR we already have a peak set (trailing mode active)
        if (profitPercent >= config.PROFIT_TARGET || existingPeak) {
          // Trailing profit mode - let it ride!
          if (config.ENABLE_TRAILING_PROFIT) {
            // Get or set peak price - initialize to current price if not set
            let currentPeak = existingPeak;
            
            if (!currentPeak) {
              // First time above profit target - set the peak
              this.peakPrices.set(position.productId, currentPrice);
              currentPeak = currentPrice;
              console.log(`[STATUS] 🎯 ${position.symbol} hit profit target! Starting trailing mode at $${currentPrice.toFixed(6)} (+${profitPercent.toFixed(2)}%)`);
              continue; // Give it a chance to climb
            }
            
            if (currentPrice > currentPeak) {
              // New peak! Update and keep riding
              this.peakPrices.set(position.productId, currentPrice);
              currentPeak = currentPrice;
              const peakProfit = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;
              console.log(`[STATUS] 🚀 ${position.symbol} NEW PEAK: $${currentPrice.toFixed(6)} (+${peakProfit.toFixed(2)}%) - Letting it ride!`);
              continue;
            }
            
            // Calculate drop from peak
            const dropFromPeak = ((currentPeak - currentPrice) / currentPeak) * 100;
            const peakProfit = ((currentPeak - position.entryPrice) / position.entryPrice) * 100;
            
            console.log(`[STATUS] 📊 ${position.symbol} trailing: Peak $${currentPeak.toFixed(6)} (+${peakProfit.toFixed(2)}%) | Now $${currentPrice.toFixed(6)} (+${profitPercent.toFixed(2)}%) | Drop: ${dropFromPeak.toFixed(2)}% (trigger: ${config.TRAILING_STOP_PERCENT}%)`);
            
            // Check if price has dropped enough from peak to trigger trailing stop
            if (dropFromPeak >= config.TRAILING_STOP_PERCENT) {
              console.log(`[STATUS] 📉 ${position.symbol} dropped ${dropFromPeak.toFixed(2)}% from peak (>= ${config.TRAILING_STOP_PERCENT}%) - SELLING!`);
              this.peakPrices.delete(position.productId);
              await this.paper.sell(position, currentPrice, `Trailing stop (peak +${peakProfit.toFixed(1)}%, sold +${profitPercent.toFixed(1)}%)`);
              continue;
            }
            
            // Still riding - check recent momentum
            try {
              const candles = await this.client.getCandles(position.productId, 5);
              if (candles && candles.length >= 2) {
                const recentMomentum = ((candles[0].close - candles[1].close) / candles[1].close) * 100;
                console.log(`[STATUS] 📈 ${position.symbol} recent momentum: ${recentMomentum >= 0 ? '+' : ''}${recentMomentum.toFixed(2)}%`);
                
                // If momentum goes negative while above target, consider selling
                if (recentMomentum < -config.MIN_MOMENTUM_TO_RIDE && dropFromPeak > config.TRAILING_STOP_PERCENT / 2) {
                  console.log(`[STATUS] ⚠️ ${position.symbol} losing momentum (${recentMomentum.toFixed(2)}%) - SELLING!`);
                  this.peakPrices.delete(position.productId);
                  await this.paper.sell(position, currentPrice, `Momentum fade (peak +${peakProfit.toFixed(1)}%, sold +${profitPercent.toFixed(1)}%)`);
                  continue;
                }
              }
            } catch (err) {
              // Ignore momentum check errors
            }
            
            continue; // Keep riding
          } else {
            // Traditional mode - sell at profit target
            console.log(`[STATUS] 🎯 ${position.symbol} hit profit target! Selling...`);
            await this.paper.sell(position, currentPrice, 'Profit target reached');
            continue;
          }
        }

        // Progress towards target
        const progressToTarget = (profitPercent / config.PROFIT_TARGET) * 100;
        if (profitPercent > 0) {
          console.log(`[STATUS] ${position.symbol}: ${progressToTarget.toFixed(0)}% progress to ${config.PROFIT_TARGET}% target`);
        }

        // Time-based exit removed: trades will no longer be closed solely
        // because they've aged with a small profit. This rule was removed
        // per user request to avoid premature profit-taking on long holds.

      } catch (error) {
        console.error(`Error managing position ${position.symbol}:`, error.message);
      }
    }
  }

  /**
   * Execute sell for a specific position
   */
  async sellPosition(position, currentPrice, reason) {
    if (config.PAPER_TRADING) {
      return await this.paper.sell(position, currentPrice, reason);
    } else {
      // Real trading (not implemented)
      console.log('⚠️  Real trading not implemented');
      return null;
    }
  }

  /**
   * Get trading statistics
   */
  getStats() {
    return this.paper.getPortfolioSummary();
  }
}
