import { CoinbaseClient } from './coinbase-client.js';

async function debug() {
  const client = new CoinbaseClient();
  const products = await client.getProducts();
  
  console.log('Sample product:', products[0]);
  console.log('\nUSD pairs:', products.filter(p => p.product_id?.includes('-USD')).slice(0, 5));
}

debug();
