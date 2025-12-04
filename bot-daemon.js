import { CoinbaseClient } from './coinbase-client.js';
import { MarketScanner } from './market-scanner.js';
import { PaperTradingEngine } from './paper-trading.js';
import { TradingStrategy } from './trading-strategy.js';
import { config } from './config.js';

/**
 * Trading Bot Daemon - Controlled by API server
 */
class TradingBotDaemon {
  constructor() {
    this.client = new CoinbaseClient();
    this.scanner = new MarketScanner(this.client);
    this.paper = new PaperTradingEngine();
    this.strategy = new TradingStrategy(this.client, this.paper);
    this.isRunning = false;
    this.cycleCount = 0;
    this.startTime = null;
    this.lastSuccessfulCycle = null;
    this.errorCount = 0;
    this.consecutiveErrors = 0;
  }

  formatUptime() {
    if (!this.startTime) return '0s';
    const ms = Date.now() - this.startTime;
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  logStatus(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }

  logError(context, error) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ❌ ERROR in ${context}:`);
    console.error(`  Message: ${error.message}`);
    if (error.code) console.error(`  Code: ${error.code}`);
    if (error.status) console.error(`  Status: ${error.status}`);
    if (error.stack) {
      console.error(`  Stack trace:`);
      error.stack.split('\n').slice(1, 6).forEach(line => {
        console.error(`    ${line.trim()}`);
      });
    }
  }

  async start() {
    this.startTime = Date.now();
    this.logStatus('🤖 MOMENTUM TRADING BOT STARTING...');
    this.logStatus(`Mode: ${config.PAPER_TRADING ? '📄 PAPER TRADING' : '💰 LIVE TRADING'}`);
    this.logStatus(`Max Price: $${config.MAX_PRICE} | Profit Target: ${config.PROFIT_TARGET}%`);
    this.logStatus(`Position Size: $${config.POSITION_SIZE} | Max Positions: ${config.MAX_POSITIONS}`);
    this.logStatus(`Trailing Stop: ${config.ENABLE_TRAILING_PROFIT ? `${config.TRAILING_STOP_PERCENT}%` : 'DISABLED'}`);

    // Reset API call counter on start
    CoinbaseClient.resetApiCallCount();
    this.logStatus('📊 API call counter reset');

    try {
      await this.paper.loadPortfolio();
      this.logStatus('✅ Portfolio loaded successfully');
    } catch (error) {
      this.logError('loadPortfolio', error);
      throw error;
    }
    
    this.isRunning = true;

    await this.mainLoop();
  }

  async mainLoop() {
    while (this.isRunning) {
      const cycleStartTime = Date.now();
      
      try {
        this.cycleCount++;
        const timestamp = new Date().toLocaleTimeString();
        
        console.log(`🔄 CYCLE #${this.cycleCount} | ${timestamp} | Uptime: ${this.formatUptime()}`);

        // Manage existing positions
        const posCount = this.paper.getPositionCount();
        if (posCount > 0) {
          console.log(`[STATUS] Checking ${posCount} open position(s) for profit targets...`);
        }
        await this.strategy.managePositions();
        
        // Update API count after position management
        console.log(`[APICALLS] ${CoinbaseClient.getApiCallCount()}`);

        // Scan for new opportunities
        if (this.paper.getPositionCount() < config.MAX_POSITIONS) {
          console.log(`[STATUS] Scanning ${config.MAX_POSITIONS - this.paper.getPositionCount()} slots available for new positions`);
          const opportunities = await this.scanner.scanMarkets();
          
          // Update API count after scan
          console.log(`[APICALLS] ${CoinbaseClient.getApiCallCount()}`);

          if (opportunities.length > 0) {
            console.log(`[STATUS] Evaluating top ${Math.min(3, opportunities.length)} opportunities...`);
          }

          for (const opportunity of opportunities.slice(0, 3)) {
            if (this.paper.getPositionCount() >= config.MAX_POSITIONS) break;
            console.log(`[STATUS] Analyzing ${opportunity.symbol} - momentum ${opportunity.momentum.toFixed(2)}%`);
            await this.strategy.evaluateBuyOpportunity(opportunity);
            await this.sleep(2000);
          }
        } else {
          console.log(`[STATUS] Portfolio full (${config.MAX_POSITIONS}/${config.MAX_POSITIONS}) - monitoring positions`);
        }

        // Show portfolio summary
        const summary = this.paper.getPortfolioSummary();
        const apiCalls = CoinbaseClient.getApiCallCount();
        console.log(`[STATUS] Portfolio: $${summary.totalValue.toFixed(2)} | Cash: $${summary.cash.toFixed(2)} | Positions: ${summary.openPositions} | API: ${apiCalls}`);
        console.log(`[APICALLS] ${apiCalls}`);

        // Cycle completed successfully
        this.lastSuccessfulCycle = Date.now();
        this.consecutiveErrors = 0;
        
        const cycleDuration = Date.now() - cycleStartTime;
        console.log(`[STATUS] Cycle #${this.cycleCount} completed in ${(cycleDuration / 1000).toFixed(1)}s. Waiting ${config.SCAN_INTERVAL}s...`);
        await this.sleep(config.SCAN_INTERVAL * 1000);

      } catch (error) {
        this.errorCount++;
        this.consecutiveErrors++;
        
        this.logError(`mainLoop (cycle #${this.cycleCount})`, error);
        
        // Log additional context
        console.error(`  Total errors: ${this.errorCount}`);
        console.error(`  Consecutive errors: ${this.consecutiveErrors}`);
        console.error(`  Uptime: ${this.formatUptime()}`);
        console.error(`  Last successful cycle: ${this.lastSuccessfulCycle ? new Date(this.lastSuccessfulCycle).toISOString() : 'never'}`);
        
        // If too many consecutive errors, increase wait time
        let waitTime = 10000;
        if (this.consecutiveErrors >= 5) {
          waitTime = 60000;
          console.error(`  ⚠️ Multiple consecutive errors - waiting 60s before retry`);
        } else if (this.consecutiveErrors >= 3) {
          waitTime = 30000;
          console.error(`  ⚠️ Consecutive errors - waiting 30s before retry`);
        }
        
        console.log(`[STATUS] Error occurred, retrying in ${waitTime / 1000}s...`);
        await this.sleep(waitTime);
      }
    }
  }

  stop(reason = 'unknown') {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] 🛑 BOT STOPPING`);
    console.log(`  Reason: ${reason}`);
    console.log(`  Uptime: ${this.formatUptime()}`);
    console.log(`  Total cycles: ${this.cycleCount}`);
    console.log(`  Total errors: ${this.errorCount}`);
    console.log(`  Last successful cycle: ${this.lastSuccessfulCycle ? new Date(this.lastSuccessfulCycle).toISOString() : 'never'}`);
    
    // Log final portfolio state
    try {
      const summary = this.paper.getPortfolioSummary();
      console.log(`  Final portfolio: $${summary.totalValue.toFixed(2)} | Cash: $${summary.cash.toFixed(2)} | Positions: ${summary.openPositions}`);
    } catch (e) {
      console.log(`  Could not get final portfolio state: ${e.message}`);
    }
    
    this.isRunning = false;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const bot = new TradingBotDaemon();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  bot.stop('SIGTERM signal received');
  setTimeout(() => process.exit(0), 2000);
});

process.on('SIGINT', () => {
  bot.stop('SIGINT signal received (Ctrl+C)');
  setTimeout(() => process.exit(0), 2000);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  const timestamp = new Date().toISOString();
  console.error(`\n[${timestamp}] 💥 UNCAUGHT EXCEPTION:`);
  console.error(`  Message: ${error.message}`);
  console.error(`  Stack: ${error.stack}`);
  bot.stop('Uncaught exception');
  setTimeout(() => process.exit(1), 2000);
});

process.on('unhandledRejection', (reason, promise) => {
  const timestamp = new Date().toISOString();
  console.error(`\n[${timestamp}] 💥 UNHANDLED PROMISE REJECTION:`);
  console.error(`  Reason: ${reason}`);
  if (reason instanceof Error) {
    console.error(`  Stack: ${reason.stack}`);
  }
  // Don't exit, but log it prominently
  console.error(`  Bot will continue running but this should be investigated.`);
});

// Log startup
console.log(`[${new Date().toISOString()}] Bot daemon process started (PID: ${process.pid})`);

bot.start().catch(error => {
  const timestamp = new Date().toISOString();
  console.error(`\n[${timestamp}] 💥 FATAL ERROR DURING STARTUP:`);
  console.error(`  Message: ${error.message}`);
  console.error(`  Stack: ${error.stack}`);
  process.exit(1);
});
