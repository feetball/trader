import { CoinbaseClient } from './coinbase-client.js';
import { MarketScanner } from './market-scanner.js';

async function quickScan() {
  console.log('🔍 Running quick market scan...\n');
  
  const client = new CoinbaseClient();
  const scanner = new MarketScanner(client);
  
  const opportunities = await scanner.scanMarkets();
  
  if (opportunities.length > 0) {
    console.log(`\n✅ Found ${opportunities.length} opportunities meeting criteria!`);
    console.log('\nNote: These coins show momentum NOW. Run `npm start` to trade them.');
  } else {
    console.log('\n⏸️  No opportunities found right now.');
    console.log('This is normal - the bot will keep scanning every 30 seconds.');
    console.log('\nTip: Lower MOMENTUM_THRESHOLD in config.js to see more opportunities (but lower quality).');
  }
}

quickScan();
