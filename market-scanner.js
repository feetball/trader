import { config } from './config.js';
import { CoinbaseWebSocket } from './websocket-feed.js';

/**
 * Market Scanner - Identifies sub-$1 coins with momentum
 * Uses WebSocket for real-time prices (no rate limit!)
 * Only uses REST API for momentum candle data
 */
export class MarketScanner {
  constructor(coinbaseClient) {
    this.client = coinbaseClient;
    this.ws = new CoinbaseWebSocket();
    this.wsConnected = false;
    this.cachedProducts = [];
    this.productsCacheTime = 0;
    this.PRODUCTS_CACHE_TTL = 300000; // Cache products for 5 minutes
    this.statsCache = new Map();
    this.STATS_CACHE_TTL = 60000; // Cache stats for 60 seconds (volume doesn't change fast)
    this.subDollarProducts = []; // Cached list of sub-$1 products
    this.lastFullScan = 0;
    this.FULL_SCAN_INTERVAL = 300000; // Full scan every 5 minutes
  }

  /**
   * Initialize WebSocket connection
   */
  async initWebSocket() {
    if (this.wsConnected) return;

    try {
      await this.ws.connect();
      this.wsConnected = true;

      // Get products and subscribe to sub-$1 ones
      const products = await this.getProducts();
      const productIds = products.map(p => p.product_id);
      
      console.log(`[WS] Subscribing to ${productIds.length} products for real-time prices...`);
      this.ws.subscribeToProducts(productIds);

      // Handle disconnection
      this.ws.on('disconnected', () => {
        this.wsConnected = false;
      });

      this.ws.on('connected', () => {
        this.wsConnected = true;
      });

    } catch (error) {
      console.error('[WS] Failed to connect:', error.message);
      this.wsConnected = false;
    }
  }

  /**
   * Get products with caching
   */
  async getProducts() {
    const now = Date.now();
    if (this.cachedProducts.length > 0 && (now - this.productsCacheTime) < this.PRODUCTS_CACHE_TTL) {
      return this.cachedProducts;
    }

    console.log('[STATUS] Refreshing product list cache...');
    const products = await this.client.getProducts();
    
    // Filter for USD trading pairs that are active
    this.cachedProducts = products.filter(p => 
      p.quote_currency_id === 'USD' && 
      p.status === 'online'
    );
    this.productsCacheTime = now;
    
    return this.cachedProducts;
  }

  /**
   * Get stats with caching - includes price, volume, and 24h change
   */
  async getCachedStats(productId) {
    const now = Date.now();
    const cached = this.statsCache.get(productId);
    
    if (cached && (now - cached.time) < this.STATS_CACHE_TTL) {
      return cached.stats;
    }

    const stats = await this.client.getProductStats(productId);
    if (stats) {
      this.statsCache.set(productId, { stats, time: now });
    }
    return stats;
  }

  /**
   * Sleep helper for rate limiting
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get sub-$1 products with volume (cached, refreshed every 5 min)
   * Uses REST API but only runs every 5 minutes
   */
  async getSubDollarProducts() {
    const now = Date.now();
    
    // Use cached list if recent
    if (this.subDollarProducts.length > 0 && (now - this.lastFullScan) < this.FULL_SCAN_INTERVAL) {
      return this.subDollarProducts;
    }

    console.log('[STATUS] Running full product scan (every 5 min)...');
    const products = await this.getProducts();
    
    // Fetch stats in batches with rate limiting
    const candidates = [];
    const batchSize = 8;
    
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      const promises = batch.map(async (product) => {
        const stats = await this.getCachedStats(product.product_id);
        return { product, stats };
      });
      
      const results = await Promise.all(promises);
      results.forEach(r => {
        if (r.stats && r.stats.last <= config.MAX_PRICE && r.stats.volume >= config.MIN_VOLUME) {
          candidates.push({
            productId: r.product.product_id,
            symbol: r.product.base_currency_id,
            baseVolume: r.stats.volume
          });
        }
      });

      await this.sleep(1000); // Rate limit
      
      if ((i + batchSize) % 80 === 0) {
        console.log(`[STATUS] Scanned ${Math.min(i + batchSize, products.length)}/${products.length} pairs...`);
      }
    }

    this.subDollarProducts = candidates;
    this.lastFullScan = now;
    console.log(`[STATUS] Found ${candidates.length} sub-$${config.MAX_PRICE} coins with good volume`);
    
    return candidates;
  }

  /**
   * Fast scan using WebSocket prices - NO rate limit!
   * Checks ALL sub-$1 coins but uses WebSocket for prices where available
   */
  async scanMarkets() {
    // Ensure WebSocket is connected
    await this.initWebSocket();

    // Get the list of sub-$1 products (cached, refreshed every 5 min)
    const subDollarProducts = await this.getSubDollarProducts();
    
    if (!this.wsConnected) {
      console.log('[STATUS] WebSocket not connected, falling back to REST scan...');
      return this.scanMarketsREST();
    }

    console.log(`[STATUS] Scanning ${subDollarProducts.length} sub-$${config.MAX_PRICE} coins...`);

    const opportunities = [];
    const coinsToCheck = [];
    let wsHits = 0;
    let wsMisses = 0;

    // Phase 1: Get current prices from WebSocket (instant, no API calls!)
    // For coins without WS data, we'll fetch via REST
    for (const product of subDollarProducts) {
      const priceData = this.ws.getPriceData(product.productId);
      
      if (priceData && priceData.price <= config.MAX_PRICE) {
        wsHits++;
        coinsToCheck.push({
          ...product,
          price: priceData.price,
          priceChange24h: priceData.priceChange24h,
          hasWsData: true
        });
      } else {
        wsMisses++;
        // No WebSocket data - will need to fetch price via REST
        coinsToCheck.push({
          ...product,
          price: null,
          priceChange24h: null,
          hasWsData: false
        });
      }
    }

    console.log(`[STATUS] WebSocket prices: ${wsHits}/${subDollarProducts.length} (${wsMisses} need REST)`);

    // Phase 2: Check momentum for ALL coins
    const batchSize = 8;
    for (let i = 0; i < coinsToCheck.length; i += batchSize) {
      const batch = coinsToCheck.slice(i, i + batchSize);
      const promises = batch.map(async (coin) => {
        try {
          // Get price - from WebSocket or REST
          let price = coin.price;
          if (!price) {
            const stats = await this.getCachedStats(coin.productId);
            if (!stats) return null;
            price = stats.last;
            if (price > config.MAX_PRICE) return null;
          }

          const momentum = await this.calculateMomentum(coin.productId, price);
          
          if (momentum && momentum.score >= config.MOMENTUM_THRESHOLD) {
            return {
              productId: coin.productId,
              symbol: coin.symbol,
              price: price,
              momentum: momentum.score,
              volume24h: coin.baseVolume,
              priceChange24h: coin.priceChange24h || 0,
              volatility: momentum.volatility || 0,
              timestamp: Date.now(),
            };
          }
          return null;
        } catch (error) {
          return null;
        }
      });

      const results = await Promise.all(promises);
      results.forEach(r => {
        if (r) {
          console.log(`[STATUS] 🎯 Found opportunity: ${r.symbol} +${r.momentum.toFixed(2)}% momentum`);
          opportunities.push(r);
        }
      });

      // Rate limit for candle fetches
      if (i + batchSize < coinsToCheck.length) {
        await this.sleep(1000);
      }
    }

    // Sort by momentum score
    opportunities.sort((a, b) => {
      const momentumDiff = b.momentum - a.momentum;
      if (Math.abs(momentumDiff) < 0.5) {
        return b.volatility - a.volatility;
      }
      return momentumDiff;
    });

    console.log(`[STATUS] Scan complete: ${opportunities.length} opportunities found`);
    
    if (opportunities.length > 0) {
      console.log('Top opportunities:');
      opportunities.slice(0, 5).forEach(opp => {
        console.log(`  ${opp.symbol}: $${opp.price.toFixed(4)} | Momentum: ${opp.momentum.toFixed(2)}% | Vol: $${(opp.volume24h/1000).toFixed(0)}k`);
      });
    }

    return opportunities;
  }

  /**
   * Fallback REST-based scan (used when WebSocket unavailable)
   */
  async scanMarketsREST() {
    console.log('[STATUS] Using REST API fallback scan...');
    
    const subDollarProducts = await this.getSubDollarProducts();
    const opportunities = [];

    // Check momentum with rate limiting
    const batchSize = 8;
    for (let i = 0; i < subDollarProducts.length; i += batchSize) {
      const batch = subDollarProducts.slice(i, i + batchSize);
      const promises = batch.map(async (product) => {
        try {
          const stats = await this.getCachedStats(product.productId);
          if (!stats) return null;

          const momentum = await this.calculateMomentum(product.productId, stats.last);
          
          if (momentum && momentum.score >= config.MOMENTUM_THRESHOLD) {
            return {
              productId: product.productId,
              symbol: product.symbol,
              price: stats.last,
              momentum: momentum.score,
              volume24h: stats.volume,
              priceChange24h: stats.priceChangePercent,
              volatility: momentum.volatility || 0,
              timestamp: Date.now(),
            };
          }
          return null;
        } catch (error) {
          return null;
        }
      });

      const results = await Promise.all(promises);
      results.forEach(r => {
        if (r) {
          console.log(`[STATUS] 🎯 Found opportunity: ${r.symbol} +${r.momentum.toFixed(2)}% momentum`);
          opportunities.push(r);
        }
      });

      await this.sleep(1000);
    }

    opportunities.sort((a, b) => b.momentum - a.momentum);
    return opportunities;
  }

  /**
   * Quick scan using WebSocket - super fast!
   */
  async quickScan(existingPositions = []) {
    await this.initWebSocket();
    
    if (!this.wsConnected) {
      return this.quickScanREST(existingPositions);
    }

    const opportunities = [];
    const subDollarProducts = await this.getSubDollarProducts();
    
    // Get coins showing movement from WebSocket
    const movingCoins = [];
    for (const product of subDollarProducts) {
      const priceData = this.ws.getPriceData(product.productId);
      if (priceData && Math.abs(priceData.recentChange) >= 0.5) {
        movingCoins.push({
          ...product,
          price: priceData.price,
          recentChange: priceData.recentChange
        });
      }
    }

    // Check momentum for moving coins only
    for (const coin of movingCoins.slice(0, 20)) {
      try {
        const momentum = await this.calculateMomentum(coin.productId, coin.price);
        if (momentum && momentum.score >= config.MOMENTUM_THRESHOLD) {
          opportunities.push({
            productId: coin.productId,
            symbol: coin.symbol,
            price: coin.price,
            momentum: momentum.score,
            volume24h: coin.baseVolume,
            priceChange24h: coin.recentChange,
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        continue;
      }
    }

    opportunities.sort((a, b) => b.momentum - a.momentum);
    return opportunities;
  }

  /**
   * Quick scan fallback using REST
   */
  async quickScanREST(existingPositions = []) {
    const opportunities = [];
    const products = await this.getProducts();
    
    const sampleSize = Math.min(50, products.length);
    const shuffled = [...products].sort(() => Math.random() - 0.5);
    const sample = shuffled.slice(0, sampleSize);

    for (const product of sample) {
      try {
        const stats = await this.getCachedStats(product.product_id);
        if (!stats || stats.last > config.MAX_PRICE || stats.volume < config.MIN_VOLUME) continue;

        const momentum = await this.calculateMomentum(product.product_id, stats.last);
        if (momentum && momentum.score >= config.MOMENTUM_THRESHOLD) {
          opportunities.push({
            productId: product.product_id,
            symbol: product.base_currency_id,
            price: stats.last,
            momentum: momentum.score,
            volume24h: stats.volume,
            priceChange24h: stats.priceChangePercent,
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        continue;
      }
    }

    opportunities.sort((a, b) => b.momentum - a.momentum);
    return opportunities;
  }

  /**
   * Get current price - uses WebSocket if available, falls back to REST
   */
  async getCurrentPrice(productId) {
    // Try WebSocket first (instant, no API call)
    if (this.wsConnected && this.ws.hasFreshPrice(productId)) {
      return this.ws.getPrice(productId);
    }
    
    // Fallback to REST with caching
    const stats = await this.getCachedStats(productId);
    return stats ? stats.last : null;
  }

  /**
   * Calculate momentum based on recent price action
   */
  async calculateMomentum(productId, currentPrice) {
    try {
      // Use MOMENTUM_WINDOW from config (in minutes), with 5-min candles
      const candleCount = Math.max(3, Math.ceil(config.MOMENTUM_WINDOW / 5));
      const candles = await this.client.getCandles(productId, 300, candleCount); // 5 min candles
      
      if (!candles || candles.length < 3) {
        return null;
      }

      // Calculate price change over the momentum window
      const oldestCandle = candles[candles.length - 1];
      const oldPrice = parseFloat(oldestCandle.close);
      
      const priceChange = ((currentPrice - oldPrice) / oldPrice) * 100;

      // Calculate volatility (high-low range average)
      let totalRange = 0;
      candles.forEach(c => {
        const high = parseFloat(c.high);
        const low = parseFloat(c.low);
        const mid = (high + low) / 2;
        if (mid > 0) {
          totalRange += ((high - low) / mid) * 100;
        }
      });
      const volatility = totalRange / candles.length;

      // Calculate average volume
      const avgVolume = candles.reduce((sum, c) => sum + parseFloat(c.volume), 0) / candles.length;

      return {
        score: priceChange,
        volatility,
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

  /**
   * Clear caches (useful when config changes)
   */
  clearCache() {
    this.cachedProducts = [];
    this.productsCacheTime = 0;
    this.statsCache.clear();
    this.subDollarProducts = [];
    this.lastFullScan = 0;
  }

  /**
   * Disconnect WebSocket (for cleanup)
   */
  disconnect() {
    if (this.ws) {
      this.ws.disconnect();
      this.wsConnected = false;
    }
  }
}
