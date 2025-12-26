import { KrakenClient } from '../kraken-client.js';
import { jest } from '@jest/globals';

// Mock global fetch
global.fetch = jest.fn();

describe('KrakenClient', () => {
  let client;

  beforeEach(() => {
    process.env.KRAKEN_API_KEY = 'test-key';
    process.env.KRAKEN_API_SECRET = 'test-secret';
    client = new KrakenClient();
    jest.clearAllMocks();
  });

  test('should be defined', () => {
    expect(client).toBeDefined();
  });

  test('getProducts should return formatted products', async () => {
    const mockResponse = {
      result: {
        'XXBTZUSD': {
          altname: 'XBTUSD',
          wsname: 'XBT/USD',
          base: 'XXBT',
          quote: 'ZUSD',
          status: 'online'
        },
        'XETHZUSD': {
          altname: 'ETHUSD',
          wsname: 'ETH/USD',
          base: 'XETH',
          quote: 'ZUSD',
          status: 'online'
        }
      }
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const products = await client.getProducts();
    expect(products).toHaveLength(2);
    expect(products[0].product_id).toBe('XBT/USD');
    expect(products[1].product_id).toBe('ETH/USD');
  });

  test('getCurrentPrice should return price', async () => {
    const mockResponse = {
      result: {
        'XXBTZUSD': {
          c: ['50000.00', '100']
        }
      }
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const price = await client.getCurrentPrice('XXBTZUSD');
    expect(price).toBe(50000.00);
  });
});
