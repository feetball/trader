import { CoinbaseClient } from './coinbase-client.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Test script to verify Coinbase API connection
 */
async function testConnection() {
  console.log('🔧 Testing Coinbase API connection...\n');

  try {
    const client = new CoinbaseClient();

    // Test 1: Get products
    console.log('Test 1: Fetching products...');
    const products = await client.getProducts();
    console.log(`✅ Success! Found ${products.length} products\n`);

    // Test 2: Get a sample price (BTC-USD)
    console.log('Test 2: Fetching BTC-USD price...');
    const btcPrice = await client.getCurrentPrice('BTC-USD');
    console.log(`✅ Success! BTC Price: $${btcPrice?.toFixed(2)}\n`);

    // Test 3: Get stats for a sub-$1 coin
    console.log('Test 3: Looking for sub-$1 coins...');
    let count = 0;
    for (const product of products.slice(0, 50)) {
      if (product.quote_currency_id === 'USD' && product.status === 'online') {
        const price = await client.getCurrentPrice(product.product_id);
        if (price && price < 1) {
          console.log(`   ${product.base_currency_id}: $${price.toFixed(4)}`);
          count++;
          if (count >= 5) break;
        }
      }
    }
    console.log(`✅ Found ${count} sub-$1 coins\n`);

    console.log('✅ All tests passed! Bot is ready to run.');
    console.log('\nTo start the bot, run: npm start');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nPlease check your .env file has correct CB_API_KEY and CB_API_SECRET');
  }
}

testConnection();
