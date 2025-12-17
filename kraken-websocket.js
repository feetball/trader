import WebSocket from 'ws';
import { EventEmitter } from 'events';

export class KrakenWebSocket extends EventEmitter {
  constructor() {
    super();
    this.ws = null;
    this.url = 'wss://ws.kraken.com';
    this.prices = new Map();
    this.subscribedProducts = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.isConnected = false;
    this.pingInterval = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      if (this.ws && this.isConnected) {
        resolve();
        return;
      }

      console.log('[WS] Connecting to Kraken WebSocket feed...');
      this.ws = new WebSocket(this.url);

      this.ws.on('open', () => {
        console.log('[WS] Connected to Kraken WebSocket');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        this.pingInterval = setInterval(() => {
          if (this.ws && this.isConnected) {
            this.ws.send(JSON.stringify({ event: 'ping' }));
          }
        }, 30000);

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
          // Ignore
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
        if (!this.isConnected) reject(error);
      });

      setTimeout(() => {
        if (!this.isConnected) reject(new Error('WebSocket connection timeout'));
      }, 10000);
    });
  }

  clearPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WS] Max reconnect attempts reached');
      this.emit('maxReconnectAttempts');
      return;
    }
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    setTimeout(() => this.connect().catch(() => {}), delay);
  }

  subscribeToProducts(productIds) {
    if (!this.ws || !this.isConnected) {
      productIds.forEach(id => this.subscribedProducts.add(id));
      return;
    }

    productIds.forEach(id => this.subscribedProducts.add(id));

    // Kraken allows max 100 pairs per message usually, but safer to batch
    const batchSize = 50;
    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize);
      const msg = {
        event: 'subscribe',
        pair: batch,
        subscription: { name: 'ticker' }
      };
      this.ws.send(JSON.stringify(msg));
    }
    console.log(`[WS] Subscribed to ${productIds.length} products`);
  }

  handleMessage(message) {
    if (Array.isArray(message)) {
      // Data message: [channelID, data, channelName, pair]
      const [channelID, data, channelName, pair] = message;
      if (channelName === 'ticker') {
        this.handleTicker(pair, data);
      }
    } else {
      // Event message
      if (message.event === 'heartbeat') return;
      if (message.event === 'pong') return;
      if (message.event === 'subscriptionStatus') {
        // console.log(`[WS] Subscription status: ${message.status} for ${message.pair}`);
      }
    }
  }

  handleTicker(pair, data) {
    // Kraken ticker data: { c: [price, volume], v: [today, 24h], ... }
    const price = parseFloat(data.c[0]);
    const volume24h = parseFloat(data.v[1]);
    const open24h = parseFloat(data.o[1]); // o = [today, 24h]
    
    const priceChange24h = open24h > 0 ? ((price - open24h) / open24h) * 100 : 0;

    const oldData = this.prices.get(pair);
    const oldPrice = oldData?.price || price;
    const priceChangePercent = oldPrice > 0 ? ((price - oldPrice) / oldPrice) * 100 : 0;

    this.prices.set(pair, {
      price,
      volume24h,
      priceChange24h,
      timestamp: Date.now(),
      previousPrice: oldPrice,
      recentChange: priceChangePercent
    });

    if (Math.abs(priceChangePercent) > 0.1) {
      this.emit('priceChange', {
        productId: pair,
        price,
        previousPrice: oldPrice,
        changePercent: priceChangePercent,
        volume24h,
        priceChange24h
      });
    }

    this.emit('ticker', { productId: pair, price, volume24h, priceChange24h });
  }

  getPrice(productId) {
    return this.prices.get(productId)?.price || null;
  }

  getPriceData(productId) {
    return this.prices.get(productId) || null;
  }

  hasFreshPrice(productId) {
    const data = this.prices.get(productId);
    if (!data) return false;
    return (Date.now() - data.timestamp) < 30000;
  }

  disconnect() {
    this.clearPingInterval();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.prices.clear();
    this.subscribedProducts.clear();
  }
}
