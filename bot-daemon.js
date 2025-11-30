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
  }

  async start() {
    console.log('🤖 MOMENTUM TRADING BOT STARTING...');
    console.log(`Mode: ${config.PAPER_TRADING ? '📄 PAPER TRADING' : '💰 LIVE TRADING'}`);
    console.log(`Max Price: $${config.MAX_PRICE} | Profit Target: ${config.PROFIT_TARGET}%`);
    console.log(`Position Size: $${config.POSITION_SIZE} | Max Positions: ${config.MAX_POSITIONS}`);

    // Reset API call counter on start
    CoinbaseClient.resetApiCallCount();
    console.log('📊 API call counter reset');

    await this.paper.loadPortfolio();
    this.isRunning = true;

    await this.mainLoop();
  }

  async mainLoop() {
    while (this.isRunning) {
      try {
        this.cycleCount++;
        const timestamp = new Date().toLocaleTimeString();
        
        console.log(`🔄 CYCLE #${this.cycleCount} | ${timestamp}`);

        // Manage existing positions
        const posCount = this.paper.getPositionCount();
        if (posCount > 0) {
          console.log(`[STATUS] Checking ${posCount} open position(s) for profit targets...`);
        }
        await this.strategy.managePositions();

        // Scan for new opportunities
        if (this.paper.getPositionCount() < config.MAX_POSITIONS) {
          console.log(`[STATUS] Scanning ${config.MAX_POSITIONS - this.paper.getPositionCount()} slots available for new positions`);
          const opportunities = await this.scanner.scanMarkets();

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

        console.log(`[STATUS] Waiting ${config.SCAN_INTERVAL}s until next scan...`);
        await this.sleep(config.SCAN_INTERVAL * 1000);

      } catch (error) {
        console.error('❌ Error in main loop:', error.message);
        console.log(`[STATUS] Error occurred, retrying in 10s...`);
        await this.sleep(10000);
      }
    }
  }

  stop() {
    console.log('🛑 Stopping bot...');
    this.isRunning = false;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const bot = new TradingBotDaemon();

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM signal');
  bot.stop();
  setTimeout(() => process.exit(0), 1000);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT signal');
  bot.stop();
  setTimeout(() => process.exit(0), 1000);
});

bot.start().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
