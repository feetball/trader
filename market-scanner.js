import { config } from './config.js';

/**
 * Market Scanner - Identifies sub-$1 coins with momentum
 */
export class MarketScanner {
  constructor(coinbaseClient) {
    this.client = coinbaseClient;
    this.cachedProducts = [];
    this.lastScan = 0;
  }

  /**
   * Scan for tradeable sub-$1 coins with momentum
   */
  async scanMarkets() {
    console.log('[STATUS] Fetching all trading pairs from Coinbase...');
    
    // Get all products
    const products = await this.client.getProducts();
    
    // Filter for USD trading pairs that are active
    const usdPairs = products.filter(p => 
      p.quote_currency_id === 'USD' && 
      p.status === 'online'
    );

    console.log(`[STATUS] Found ${usdPairs.length} USD pairs - filtering for sub-$${config.MAX_PRICE} coins...`);

    const opportunities = [];
    let scannedCount = 0;
    let subDollarCount = 0;

    // Check each pair for sub-$1 price and momentum
    for (const product of usdPairs) {
      try {
        scannedCount++;
        
        // Log progress every 50 coins
        if (scannedCount % 50 === 0) {
          console.log(`[STATUS] Scanned ${scannedCount}/${usdPairs.length} pairs... found ${subDollarCount} sub-$1 coins`);
        }

        const price = await this.getCurrentPrice(product.product_id);
        
        // Skip if price is null or above threshold
        if (!price || price > config.MAX_PRICE) {
          continue;
        }

        subDollarCount++;

        // Get 24h stats and momentum
        const stats = await this.client.getProductStats(product.product_id);
        
        if (!stats) continue;

        // Check volume threshold
        if (stats.volume < config.MIN_VOLUME) {
          continue;
        }

        // Calculate momentum score
        const momentum = await this.calculateMomentum(product.product_id, price);
        
        if (momentum && momentum.score >= config.MOMENTUM_THRESHOLD) {
          console.log(`[STATUS] 🎯 Found opportunity: ${product.base_currency_id} +${momentum.score.toFixed(2)}% momentum`);
          opportunities.push({
            productId: product.product_id,
            symbol: product.base_currency_id,
            price,
            momentum: momentum.score,
            volume24h: stats.volume,
            priceChange24h: stats.priceChangePercent,
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        // Skip products that error
        continue;
      }
    }

    // Sort by momentum score (highest first)
    opportunities.sort((a, b) => b.momentum - a.momentum);

    console.log(`[STATUS] Scan complete: ${subDollarCount} sub-$1 coins, ${opportunities.length} with strong momentum`);
    
    if (opportunities.length > 0) {
      console.log('Top opportunities:');
      opportunities.slice(0, 5).forEach(opp => {
        console.log(`  ${opp.symbol}: $${opp.price.toFixed(4)} | Momentum: ${opp.momentum.toFixed(2)}% | Vol: $${(opp.volume24h/1000).toFixed(0)}k`);
      });
    } else {
      console.log(`[STATUS] No coins meet momentum threshold (>${config.MOMENTUM_THRESHOLD}%) right now`);
    }

    return opportunities;
  }

  /**
   * Get current price for a product
   */
  async getCurrentPrice(productId) {
    return await this.client.getCurrentPrice(productId);
  }

  /**
   * Calculate momentum based on recent price action
   */
  async calculateMomentum(productId, currentPrice) {
    try {
      const candles = await this.client.getCandles(productId, 300, 12); // 5 min candles
      
      if (!candles || candles.length < 3) {
        return null;
      }

      // Calculate price change over last 15 minutes (3 x 5-minute candles)
      const oldestCandle = candles[candles.length - 1];
      const oldPrice = parseFloat(oldestCandle.close);
      
      const priceChange = ((currentPrice - oldPrice) / oldPrice) * 100;

      // Calculate average volume
      const avgVolume = candles.reduce((sum, c) => sum + parseFloat(c.volume), 0) / candles.length;

      // Momentum score is price change percentage
      return {
        score: priceChange,
        avgVolume,
        timeframe: '15min',
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if a specific product meets entry criteria
   */
  async checkEntrySignal(productId) {
    const price = await this.getCurrentPrice(productId);
    
    if (!price || price > config.MAX_PRICE) {
      return null;
    }

    const momentum = await this.calculateMomentum(productId, price);
    
    if (momentum && momentum.score >= config.MOMENTUM_THRESHOLD) {
      return {
        productId,
        price,
        momentum: momentum.score,
        timestamp: Date.now(),
      };
    }

    return null;
  }
}
