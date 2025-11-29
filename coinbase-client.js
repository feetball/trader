import dotenv from 'dotenv';

dotenv.config();

/**
 * Coinbase API Client wrapper
 * Uses public API endpoints for market data (no auth required)
 */
export class CoinbaseClient {
  constructor() {
    this.publicUrl = 'https://api.exchange.coinbase.com';
    this.proUrl = 'https://api.coinbase.com/api/v3/brokerage';
  }

  /**
   * Get all available products (trading pairs) - Public endpoint
   */
  async getProducts() {
    try {
      const response = await fetch(`${this.publicUrl}/products`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const products = await response.json();
      
      // Convert to expected format
      return products.map(p => ({
        product_id: p.id,
        base_currency_id: p.base_currency,
        quote_currency_id: p.quote_currency,
        status: p.status,
        trading_disabled: !p.post_only && p.status !== 'online', // More lenient
      }));
    } catch (error) {
      console.error('Error fetching products:', error.message);
      return [];
    }
  }

  /**
   * Get current market price for a product - Public endpoint
   */
  async getCurrentPrice(productId) {
    try {
      const response = await fetch(`${this.publicUrl}/products/${productId}/ticker`);
      if (!response.ok) return null;
      const data = await response.json();
      return parseFloat(data.price || 0);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get 24-hour stats for a product - Public endpoint
   */
  async getProductStats(productId) {
    try {
      const response = await fetch(`${this.publicUrl}/products/${productId}/stats`);
      if (!response.ok) return null;
      const data = await response.json();
      
      const open = parseFloat(data.open || 0);
      const last = parseFloat(data.last || 0);
      const priceChange = last - open;
      const priceChangePercent = open > 0 ? (priceChange / open) * 100 : 0;
      
      return {
        volume: parseFloat(data.volume || 0),
        priceChange,
        priceChangePercent,
        low: parseFloat(data.low || 0),
        high: parseFloat(data.high || 0),
        open,
        last,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get candles/historical data for momentum analysis - Public endpoint
   */
  async getCandles(productId, granularity = 300, limit = 20) {
    try {
      const end = Math.floor(Date.now() / 1000);
      const start = end - (limit * granularity);
      
      const response = await fetch(
        `${this.publicUrl}/products/${productId}/candles?start=${start}&end=${end}&granularity=${granularity}`
      );
      
      if (!response.ok) return [];
      const candles = await response.json();
      
      // Convert format: [time, low, high, open, close, volume]
      return candles.map(c => ({
        start: c[0].toString(),
        low: c[1].toString(),
        high: c[2].toString(),
        open: c[3].toString(),
        close: c[4].toString(),
        volume: c[5].toString(),
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Place a market buy order (Paper trading only - these won't be implemented)
   */
  async marketBuy(productId, usdAmount) {
    throw new Error('Real trading not supported - use PAPER_TRADING mode');
  }

  /**
   * Place a market sell order (Paper trading only - these won't be implemented)
   */
  async marketSell(productId, baseAmount) {
    throw new Error('Real trading not supported - use PAPER_TRADING mode');
  }

  /**
   * Get account balances (Not needed for paper trading)
   */
  async getAccounts() {
    throw new Error('Account access not needed for paper trading');
  }
}
