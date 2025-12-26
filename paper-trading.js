import fs from 'fs/promises';
import path from 'path';
import { config, pickConfigSnapshot } from './config-utils.js';
/**
 * Paper Trading Engine - Simulates trades without real money
 */
export class PaperTradingEngine {
  constructor() {
    this.portfolio = {
      cash: 10000, // Starting with $10,000 virtual cash
      positions: [], // Open positions
      closedTrades: [], // Trade history
    };
    this.dataFile = 'paper-trading-data.json';
    // Kick off load automatically in non-test environments and keep a reference
    const isTestEnv = !!process.env.JEST_WORKER_ID || process.env.NODE_ENV === 'test';
    this._loadPromise = isTestEnv ? null : this.loadPortfolio();
  }

  /**
   * Load portfolio from disk
   */
  async loadPortfolio() {
    try {
      const data = await fs.readFile(this.dataFile, 'utf-8');
      this.portfolio = JSON.parse(data);
      console.log(`📊 Loaded portfolio: $${this.portfolio.cash.toFixed(2)} cash, ${this.portfolio.positions.length} open positions`);
    } catch (error) {
      // File doesn't exist yet, use defaults
      console.log('📊 Starting new paper trading portfolio with $10,000');
      await this.savePortfolio();
    }
  }

  /**
   * Save portfolio to disk
   */
  async savePortfolio() {
    try {
      await fs.writeFile(this.dataFile, JSON.stringify(this.portfolio, null, 2));
    } catch (error) {
      console.error('Error saving portfolio:', error.message);
    }
  }

  /**
   * Execute a paper buy order
   */
  async buy(productId, symbol, price, usdAmount, entryAudit = null) {
    if (this.portfolio.cash < usdAmount) {
      console.log(`❌ Insufficient cash: $${this.portfolio.cash.toFixed(2)} available, $${usdAmount} needed`);
      return null;
    }

    // Calculate buy fee (use maker fee for limit orders)
    const feePercent = config.MAKER_FEE_PERCENT || 0.25;
    const buyFee = usdAmount * (feePercent / 100);
    const effectiveAmount = usdAmount - buyFee;
    const quantity = effectiveAmount / price;
    const timestamp = Date.now();

    const position = {
      id: `${productId}_${timestamp}`,
      productId,
      symbol,
      entryPrice: price,
      quantity,
      investedAmount: usdAmount,
      buyFee,
      entryTime: timestamp,
      targetPrice: price * (1 + config.PROFIT_TARGET / 100),
      stopLoss: price * (1 + config.STOP_LOSS / 100), // config.STOP_LOSS is negative, e.g., -2 = 2% below entry
      audit: {
        entry: entryAudit || null,
        configAtEntry: pickConfigSnapshot(),
      },
    };

    this.portfolio.positions.push(position);
    this.portfolio.cash -= usdAmount;

    await this.savePortfolio();

    console.log(`✅ PAPER BUY: ${symbol} | Qty: ${quantity.toFixed(4)} @ $${price.toFixed(6)} | Invested: $${usdAmount.toFixed(2)} (fee: $${buyFee.toFixed(2)})`);
    console.log(`   Target: $${position.targetPrice.toFixed(6)} (+${config.PROFIT_TARGET}%) | Stop: $${position.stopLoss.toFixed(6)} (${config.STOP_LOSS}%)`);

    return position;
  }

  /**
   * Execute a paper sell order
   */
  async sell(position, currentPrice, reason = 'Target reached') {
    const exitTimestamp = Date.now();
    const grossValue = position.quantity * currentPrice;
    
    // Calculate sell fee (use taker fee for market orders)
    const feePercent = config.TAKER_FEE_PERCENT || 0.50;
    const sellFee = grossValue * (feePercent / 100);
    const netValue = grossValue - sellFee;
    
    // Total fees for this trade
    const totalFees = (position.buyFee || 0) + sellFee;
    
    // Gross profit (before fees)
    const grossProfit = grossValue - position.investedAmount;
    
    // Net profit (after fees)
    const netProfit = netValue - position.investedAmount + (position.buyFee || 0);
    const netProfitActual = grossProfit - totalFees;
    
    const profitPercent = (grossProfit / position.investedAmount) * 100;
    const netProfitPercent = (netProfitActual / position.investedAmount) * 100;
    const holdTime = exitTimestamp - position.entryTime;

    // Remove from positions
    this.portfolio.positions = this.portfolio.positions.filter(p => p.id !== position.id);
    
    // Add cash (net of sell fee)
    this.portfolio.cash += netValue;

    // Record trade
    const trade = {
      ...position,
      exitPrice: currentPrice,
      exitTime: exitTimestamp,
      profit: grossProfit,
      profitPercent,
      netProfit: netProfitActual,
      netProfitPercent,
      sellFee,
      totalFees,
      holdTimeMs: holdTime,
      reason,
      audit: {
        ...(position.audit || {}),
        exit: {
          reason,
          exitPrice: currentPrice,
          exitTime: exitTimestamp,
        },
        configAtExit: pickConfigSnapshot(),
      },
    };

    this.portfolio.closedTrades.push(trade);

    await this.savePortfolio();

    console.log(`💰 PAPER SELL: ${position.symbol} | Qty: ${position.quantity.toFixed(4)} @ $${currentPrice.toFixed(4)}`);
    console.log(`   Gross: $${grossProfit.toFixed(2)} (${profitPercent.toFixed(2)}%) | Net: $${netProfitActual.toFixed(2)} (${netProfitPercent.toFixed(2)}%) | Fees: $${totalFees.toFixed(2)} | Reason: ${reason}`);

    return trade;
  }

  /**
   * Get all open positions
   */
  getPositions() {
    return this.portfolio.positions;
  }

  /**
   * Get number of open positions
   */
  getPositionCount() {
    return this.portfolio.positions.length;
  }

  /**
   * Get available cash
   */
  getAvailableCash() {
    return this.portfolio.cash;
  }

  /**
   * Get portfolio summary
   */
  getPortfolioSummary(currentPrices = {}) {
    let totalValue = this.portfolio.cash;
    
    this.portfolio.positions.forEach(pos => {
      const currentPrice = currentPrices[pos.productId] || pos.entryPrice;
      totalValue += pos.quantity * currentPrice;
    });

    const totalProfit = this.portfolio.closedTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
    const totalNetProfit = this.portfolio.closedTrades.reduce((sum, t) => sum + (t.netProfit || t.profit || 0), 0);
    const totalFees = this.portfolio.closedTrades.reduce((sum, t) => sum + (t.totalFees || 0), 0);
    const winningTrades = this.portfolio.closedTrades.filter(t => (t.netProfit || t.profit) > 0).length;
    const totalTrades = this.portfolio.closedTrades.length;

    return {
      cash: this.portfolio.cash,
      positionsValue: totalValue - this.portfolio.cash,
      totalValue,
      openPositions: this.portfolio.positions.length,
      totalTrades,
      winningTrades,
      losingTrades: totalTrades - winningTrades,
      winRate: totalTrades > 0 ? (winningTrades / totalTrades * 100) : 0,
      totalProfit,
      totalNetProfit,
      totalFees,
      roi: ((totalValue - 10000) / 10000 * 100),
    };
  }

  /**
   * Print portfolio summary
   */
  printSummary(currentPrices = {}) {
    const summary = this.getPortfolioSummary(currentPrices);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 PAPER TRADING PORTFOLIO SUMMARY');
    console.log('='.repeat(60));
    console.log(`Cash: $${summary.cash.toFixed(2)}`);
    console.log(`Positions Value: $${summary.positionsValue.toFixed(2)}`);
    console.log(`Total Value: $${summary.totalValue.toFixed(2)}`);
    console.log(`ROI: ${summary.roi.toFixed(2)}%`);
    console.log(`Open Positions: ${summary.openPositions}`);
    console.log(`Total Trades: ${summary.totalTrades}`);
    console.log(`Win Rate: ${summary.winRate.toFixed(1)}%`);
    console.log(`Total Profit: $${summary.totalProfit.toFixed(2)}`);
    console.log('='.repeat(60) + '\n');
  }
}
