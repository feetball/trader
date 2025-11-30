import WebSocket from 'ws';
import { EventEmitter } from 'events';

/**
 * Coinbase WebSocket Feed for real-time price updates
 * No rate limits - prices stream in real-time
 */
export class CoinbaseWebSocket extends EventEmitter {
  constructor() {
    super();
    this.ws = null;
    this.url = 'wss://ws-feed.exchange.coinbase.com';
    this.prices = new Map(); // productId -> { price, timestamp }
    this.subscribedProducts = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.isConnected = false;
    this.pingInterval = null;
  }

  /**
   * Connect to WebSocket feed
   */
  async connect() {
    return new Promise((resolve, reject) => {
      if (this.ws && this.isConnected) {
        resolve();
        return;
      }

      console.log('[WS] Connecting to Coinbase WebSocket feed...');
      
      this.ws = new WebSocket(this.url);

      this.ws.on('open', () => {
        console.log('[WS] Connected to Coinbase WebSocket');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Start ping interval to keep connection alive
        this.pingInterval = setInterval(() => {
          if (this.ws && this.isConnected) {
            this.ws.ping();
          }
        }, 30000);

        // Resubscribe to products if we had any
        if (this.subscribedProducts.size > 0) {
          this.subscribeToProducts(Array.from(this.subscribedProducts));
        }
        
        this.emit('connected');
        resolve();
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          // Ignore parse errors
        }
      });

      this.ws.on('close', () => {
        console.log('[WS] WebSocket connection closed');
        this.isConnected = false;
        this.clearPingInterval();
        this.emit('disconnected');
        this.attemptReconnect();
      });

      this.ws.on('error', (error) => {
        console.error('[WS] WebSocket error:', error.message);
        this.emit('error', error);
        if (!this.isConnected) {
          reject(error);
        }
      });

      this.ws.on('pong', () => {
        // Connection is alive
      });

      // Timeout for initial connection
      setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error('WebSocket connection timeout'));
        }
      }, 10000);
    });
  }

  /**
   * Clear ping interval
   */
  clearPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Attempt to reconnect
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WS] Max reconnect attempts reached');
      this.emit('maxReconnectAttempts');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch(() => {
        // Will trigger another reconnect attempt
      });
    }, delay);
  }

  /**
   * Subscribe to product ticker updates
   */
  subscribeToProducts(productIds) {
    if (!this.ws || !this.isConnected) {
      // Store for later subscription
      productIds.forEach(id => this.subscribedProducts.add(id));
      return;
    }

    // Add to subscribed set
    productIds.forEach(id => this.subscribedProducts.add(id));

    // Subscribe in batches of 100 to avoid message size limits
    const batchSize = 100;
    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize);
      
      const subscribeMessage = {
        type: 'subscribe',
        product_ids: batch,
        channels: ['ticker']
      };

      this.ws.send(JSON.stringify(subscribeMessage));
    }

    console.log(`[WS] Subscribed to ${productIds.length} products`);
  }

  /**
   * Unsubscribe from products
   */
  unsubscribeFromProducts(productIds) {
    if (!this.ws || !this.isConnected) return;

    productIds.forEach(id => this.subscribedProducts.delete(id));

    const unsubscribeMessage = {
      type: 'unsubscribe',
      product_ids: productIds,
      channels: ['ticker']
    };

    this.ws.send(JSON.stringify(unsubscribeMessage));
  }

  /**
   * Handle incoming WebSocket message
   */
  handleMessage(message) {
    switch (message.type) {
      case 'ticker':
        this.handleTicker(message);
        break;
      case 'subscriptions':
        console.log(`[WS] Active subscriptions: ${message.channels?.length || 0} channels`);
        break;
      case 'error':
        console.error('[WS] Error message:', message.message);
        break;
    }
  }

  /**
   * Handle ticker update
   */
  handleTicker(ticker) {
    const productId = ticker.product_id;
    const price = parseFloat(ticker.price);
    const volume24h = parseFloat(ticker.volume_24h || 0);
    const open24h = parseFloat(ticker.open_24h || price);
    
    const priceChange24h = open24h > 0 ? ((price - open24h) / open24h) * 100 : 0;

    const oldData = this.prices.get(productId);
    const oldPrice = oldData?.price || price;
    const priceChangePercent = oldPrice > 0 ? ((price - oldPrice) / oldPrice) * 100 : 0;

    this.prices.set(productId, {
      price,
      volume24h,
      open24h,
      priceChange24h,
      timestamp: Date.now(),
      previousPrice: oldPrice,
      recentChange: priceChangePercent
    });

    // Emit event for significant price changes (> 0.1%)
    if (Math.abs(priceChangePercent) > 0.1) {
      this.emit('priceChange', {
        productId,
        price,
        previousPrice: oldPrice,
        changePercent: priceChangePercent,
        volume24h,
        priceChange24h
      });
    }

    // Emit general update
    this.emit('ticker', { productId, price, volume24h, priceChange24h });
  }

  /**
   * Get current price for a product
   */
  getPrice(productId) {
    const data = this.prices.get(productId);
    return data?.price || null;
  }

  /**
   * Get all current prices
   */
  getAllPrices() {
    return new Map(this.prices);
  }

  /**
   * Get price data with metadata
   */
  getPriceData(productId) {
    return this.prices.get(productId) || null;
  }

  /**
   * Check if we have fresh price data (< 30 seconds old)
   */
  hasFreshPrice(productId) {
    const data = this.prices.get(productId);
    if (!data) return false;
    return (Date.now() - data.timestamp) < 30000;
  }

  /**
   * Get products with significant recent movement
   */
  getMovingProducts(thresholdPercent = 0.5) {
    const moving = [];
    
    for (const [productId, data] of this.prices) {
      if (Math.abs(data.recentChange) >= thresholdPercent) {
        moving.push({
          productId,
          ...data
        });
      }
    }

    return moving.sort((a, b) => Math.abs(b.recentChange) - Math.abs(a.recentChange));
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    this.clearPingInterval();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.prices.clear();
    this.subscribedProducts.clear();
    console.log('[WS] Disconnected from Coinbase WebSocket');
  }
}
