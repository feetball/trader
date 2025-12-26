import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

export class KrakenClient {
  constructor() {
    this.url = 'https://api.kraken.com/0';
    this.key = process.env.KRAKEN_API_KEY;
    this.secret = process.env.KRAKEN_API_SECRET;
  }

  /**
   * Generate Kraken API Signature
   */
  getSignature(path, request, secret, nonce) {
    const message = JSON.stringify(request);
    const secret_buffer = Buffer.from(secret, 'base64');
    const hash = crypto.createHash('sha256');
    const hmac = crypto.createHmac('sha512', secret_buffer);
    const hash_digest = hash.update(nonce + message).digest('binary');
    const hmac_digest = hmac.update(path + hash_digest, 'binary').digest('base64');
    return hmac_digest;
  }

  /**
   * Public API Request
   */
  async publicRequest(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = `${this.url}/public/${endpoint}${query ? '?' + query : ''}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.error && data.error.length > 0) throw new Error(data.error.join(', '));
      return data.result;
    } catch (error) {
      console.error(`Kraken Public API Error (${endpoint}):`, error.message);
      throw error;
    }
  }

  /**
   * Private API Request
   */
  async privateRequest(endpoint, params = {}) {
    if (!this.key || !this.secret) throw new Error('Kraken API credentials missing');

    const path = `/0/private/${endpoint}`;
    const nonce = Date.now().toString();
    const body = { nonce, ...params };
    const signature = this.getSignature(path, body, this.secret, nonce);

    try {
      const response = await fetch(`${this.url}/private/${endpoint}`, {
        method: 'POST',
        headers: {
          'API-Key': this.key,
          'API-Sign': signature,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.error && data.error.length > 0) throw new Error(data.error.join(', '));
      return data.result;
    } catch (error) {
      console.error(`Kraken Private API Error (${endpoint}):`, error.message);
      throw error;
    }
  }

  /**
   * Get all available products (trading pairs)
   * Maps Kraken format to common format
   */
  async getProducts() {
    try {
      const pairs = await this.publicRequest('AssetPairs');
      return Object.entries(pairs).map(([key, p]) => ({
        product_id: p.wsname || key, // Use wsname (e.g., XBT/USD) if available
        id: key, // Kraken internal ID (e.g., XXBTZUSD)
        base_currency_id: p.base,
        quote_currency_id: p.quote,
        status: 'online', // Kraken doesn't give status per pair easily in this call
        trading_disabled: false
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Get current market price
   */
  async getCurrentPrice(productId) {
    try {
      // Kraken uses internal IDs for ticker (e.g., XXBTZUSD)
      // We might need to map from common name if passed
      const data = await this.publicRequest('Ticker', { pair: productId });
      const pairData = Object.values(data)[0];
      return parseFloat(pairData.c[0]); // c = [price, volume]
    } catch (error) {
      return null;
    }
  }

  /**
   * Get 24-hour stats
   */
  async getProductStats(productId) {
    try {
      const data = await this.publicRequest('Ticker', { pair: productId });
      const pairData = Object.values(data)[0];
      
      const open = parseFloat(pairData.o);
      const last = parseFloat(pairData.c[0]);
      const priceChange = last - open;
      const priceChangePercent = open > 0 ? (priceChange / open) * 100 : 0;

      return {
        volume: parseFloat(pairData.v[1]), // 24h volume
        priceChange,
        priceChangePercent,
        low: parseFloat(pairData.l[1]), // 24h low
        high: parseFloat(pairData.h[1]), // 24h high
        open,
        last
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get candles
   */
  async getCandles(productId, granularity = 300, limit = 20) {
    try {
      // Kraken interval is in minutes (1, 5, 15, 30, 60, 240, 1440, 10080, 21600)
      const interval = Math.floor(granularity / 60); 
      const data = await this.publicRequest('OHLC', { pair: productId, interval });
      const pairData = Object.values(data)[0];
      
      // Kraken returns [time, open, high, low, close, vwap, volume, count]
      // We need [start, low, high, open, close, volume]
      // Sort descending by time first if needed, but Kraken returns ascending
      
      return pairData.slice(-limit).map(c => ({
        start: c[0].toString(),
        open: c[1],
        high: c[2],
        low: c[3],
        close: c[4],
        volume: c[6]
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Place market buy order
   */
  async marketBuy(productId, usdAmount) {
    // Kraken market buy by volume (volume = usdAmount / price)
    // Or use 'viqc' (volume in quote currency) if supported, but standard is base volume
    // Ideally we calculate volume first
    const price = await this.getCurrentPrice(productId);
    if (!price) throw new Error('Could not fetch price for volume calculation');
    
    const volume = (usdAmount / price).toFixed(8); // 8 decimals safe for most

    return this.privateRequest('AddOrder', {
      pair: productId,
      type: 'buy',
      ordertype: 'market',
      volume: volume
    });
  }

  /**
   * Place market sell order
   */
  async marketSell(productId, baseAmount) {
    return this.privateRequest('AddOrder', {
      pair: productId,
      type: 'sell',
      ordertype: 'market',
      volume: baseAmount
    });
  }

  /**
   * Get account balances
   */
  async getAccounts() {
    const balances = await this.privateRequest('Balance');
    // Map to common format
    return Object.entries(balances).map(([currency, balance]) => ({
      currency,
      available: parseFloat(balance),
      hold: 0 // Kraken doesn't separate hold in simple Balance call easily without OpenOrders
    }));
  }
}
