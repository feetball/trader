import { CoinbaseClient } from './coinbase-client.js';
import { MarketScanner } from './market-scanner.js';
import { PaperTradingEngine } from './paper-trading.js';
import { TradingStrategy } from './trading-strategy.js';
import { config } from './config-utils.js';

/**
 * Main Trading Bot
 */
class MomentumTradingBot {
  constructor() {
    this.client = new CoinbaseClient();
    this.scanner = new MarketScanner(this.client);
    this.paper = new PaperTradingEngine();
    this.strategy = new TradingStrategy(this.client, this.paper);
    this.isRunning = false;
    this.cycleCount = 0;
  }

  /**
   * Initialize and start the bot
   */
  async start() {
    console.log('🤖 MOMENTUM TRADING BOT STARTING...');
    console.log('='.repeat(60));
    console.log(`Mode: ${config.PAPER_TRADING ? '📄 PAPER TRADING' : '💰 LIVE TRADING'}`);
    console.log(`Max Price: $${config.MAX_PRICE}`);
    console.log(`Profit Target: ${config.PROFIT_TARGET}%`);
    console.log(`Momentum Threshold: ${config.MOMENTUM_THRESHOLD}%`);
    console.log(`Position Size: $${config.POSITION_SIZE}`);
    console.log(`Max Positions: ${config.MAX_POSITIONS}`);
    console.log(`Scan Interval: ${config.SCAN_INTERVAL}s`);
    console.log('='.repeat(60));

    // Load portfolio
    await this.paper.loadPortfolio();
    this.paper.printSummary();

    this.isRunning = true;

    // Start main loop
    await this.mainLoop();
  }

  /**
   * Main trading loop
   */
  async mainLoop() {
    while (this.isRunning) {
      try {
        this.cycleCount++;
        const timestamp = new Date().toLocaleTimeString();
        
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🔄 CYCLE #${this.cycleCount} | ${timestamp}`);
        console.log('='.repeat(60));

        // Step 1: Manage existing positions
        await this.strategy.managePositions();

        // Step 2: Scan for new opportunities (if we can take more positions)
        if (this.paper.getPositionCount() < config.MAX_POSITIONS) {
          const opportunities = await this.scanner.scanMarkets();

          // Step 3: Evaluate and execute buy signals
          for (const opportunity of opportunities.slice(0, 3)) { // Check top 3
            if (this.paper.getPositionCount() >= config.MAX_POSITIONS) {
              break;
            }

            await this.strategy.evaluateBuyOpportunity(opportunity);
            
            // Small delay between buys
            await this.sleep(2000);
          }
        } else {
          console.log('⏸️  Max positions reached, waiting for exits...');
        }

        // Step 4: Print summary every 10 cycles
        if (this.cycleCount % 10 === 0) {
          this.paper.printSummary();
        }

        // Wait before next cycle
        console.log(`\n⏳ Waiting ${config.SCAN_INTERVAL}s until next scan...`);
        await this.sleep(config.SCAN_INTERVAL * 1000);

      } catch (error) {
        console.error('❌ Error in main loop:', error.message);
        console.error(error.stack);
        
        // Wait a bit before retrying
        await this.sleep(10000);
      }
    }
  }

  /**
   * Stop the bot
   */
  stop() {
    console.log('\n🛑 Stopping bot...');
    this.isRunning = false;
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Start the bot
const bot = new MomentumTradingBot();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Received shutdown signal...');
  bot.paper.printSummary();
  process.exit(0);
});

// Start trading
bot.start().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
