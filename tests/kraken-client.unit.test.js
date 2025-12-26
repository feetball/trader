import { jest } from '@jest/globals';
import { KrakenClient } from '../kraken-client.js';

describe('KrakenClient', () => {
  let client;

  beforeEach(() => {
    client = new KrakenClient();
    // Ensure no real env credentials interfere
    client.key = undefined;
    client.secret = undefined;
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete global.fetch;
  });

  test('getSignature produces a base64 string', () => {
    const secret = Buffer.from('mysecret').toString('base64');
    const sig = client.getSignature('/0/private/Test', { a: 1 }, secret, '12345');
    expect(typeof sig).toBe('string');
    expect(sig.length).toBeGreaterThan(0);
    expect(/^[A-Za-z0-9+/=]+$/.test(sig)).toBe(true);
  });

  test('publicRequest throws on non-OK response and logs', async () => {
    const spyErr = jest.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    await expect(client.publicRequest('Ticker')).rejects.toThrow(/HTTP 500/);
    expect(spyErr).toHaveBeenCalled();
  });

  test('publicRequest throws when API returns error array', async () => {
    const spyErr = jest.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({ error: ['boom'], result: null }) });
    await expect(client.publicRequest('Ticker')).rejects.toThrow(/boom/);
    expect(spyErr).toHaveBeenCalled();
  });

  test('getProducts maps pairs and returns array', async () => {
    jest.spyOn(KrakenClient.prototype, 'publicRequest').mockResolvedValue({
      XXBTZUSD: { wsname: 'XBT/USD', base: 'XXBT', quote: 'ZUSD' }
    });
    const prods = await client.getProducts();
    expect(Array.isArray(prods)).toBe(true);
    expect(prods[0].product_id).toBe('XBT/USD');
    expect(prods[0].id).toBe('XXBTZUSD');
  });

  test('getProducts returns empty array on error', async () => {
    jest.spyOn(KrakenClient.prototype, 'publicRequest').mockRejectedValue(new Error('fail'));
    const prods = await client.getProducts();
    expect(prods).toEqual([]);
  });

  test('getCurrentPrice parses ticker result', async () => {
    jest.spyOn(KrakenClient.prototype, 'publicRequest').mockResolvedValue({ PAIR: { c: ['42.42'] } });
    const price = await client.getCurrentPrice('PAIR');
    expect(price).toBeCloseTo(42.42);
  });

  test('getCurrentPrice returns null on error', async () => {
    jest.spyOn(KrakenClient.prototype, 'publicRequest').mockRejectedValue(new Error('nope'));
    const price = await client.getCurrentPrice('PAIR');
    expect(price).toBeNull();
  });

  test('getCandles maps OHLC data', async () => {
    const rows = [
      [1600000000, '1', '2', '0.5', '1.5', '1.2', '100', 10],
      [1600000300, '1.5', '2.5', '1.0', '2.0', '1.8', '200', 12]
    ];
    jest.spyOn(KrakenClient.prototype, 'publicRequest').mockResolvedValue({ PAIR: rows });
    const candles = await client.getCandles('PAIR', 300, 2);
    expect(candles.length).toBe(2);
    expect(candles[0]).toHaveProperty('start');
    expect(candles[0].open).toBe(rows[0][1]);
  });

  test('getCandles returns empty array on error', async () => {
    jest.spyOn(KrakenClient.prototype, 'publicRequest').mockRejectedValue(new Error('bad'));
    const candles = await client.getCandles('PAIR');
    expect(candles).toEqual([]);
  });

  test('privateRequest throws when credentials missing', async () => {
    client.key = undefined;
    client.secret = undefined;
    await expect(client.privateRequest('Balance')).rejects.toThrow(/credentials missing/);
  });

  test('marketBuy throws when price cannot be fetched', async () => {
    jest.spyOn(KrakenClient.prototype, 'getCurrentPrice').mockResolvedValue(null);
    await expect(client.marketBuy('PAIR', 100)).rejects.toThrow(/Could not fetch price/);
  });

  test('marketBuy calls privateRequest with calculated volume', async () => {
    jest.spyOn(KrakenClient.prototype, 'getCurrentPrice').mockResolvedValue(2);
    const pr = jest.spyOn(KrakenClient.prototype, 'privateRequest').mockResolvedValue({ txid: 'ok' });
    const res = await client.marketBuy('PAIR', 10);
    expect(pr).toHaveBeenCalled();
    // volume = 10 / 2 = 5.00000000 (toFixed 8)
    const calledWith = pr.mock.calls[0][1];
    expect(calledWith.volume).toBe('5.00000000');
    expect(res).toEqual({ txid: 'ok' });
  });

  test('getAccounts maps balances', async () => {
    jest.spyOn(KrakenClient.prototype, 'privateRequest').mockResolvedValue({ XXBT: '1.234' });
    const accounts = await client.getAccounts();
    expect(accounts).toEqual([{ currency: 'XXBT', available: 1.234, hold: 0 }]);
  });

  test('privateRequest resolves when credentials present', async () => {
    client.key = 'key123';
    client.secret = Buffer.from('s').toString('base64');
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({ error: [], result: { success: true } }) });
    const res = await client.privateRequest('Balance');
    expect(res).toEqual({ success: true });
  });

  test('getProductStats parses ticker fields', async () => {
    const pair = { o: '1.0', c: ['1.5'], v: ['10', '100'], l: ['0.9','0.95'], h: ['1.6','1.7'] };
    jest.spyOn(KrakenClient.prototype, 'publicRequest').mockResolvedValue({ PAIR: pair });
    const stats = await client.getProductStats('PAIR');
    expect(stats).toHaveProperty('volume');
    expect(stats.last).toBeCloseTo(1.5);
  });

  test('marketSell forwards to privateRequest', async () => {
    const spy = jest.spyOn(KrakenClient.prototype, 'privateRequest').mockResolvedValue({ ok: true });
    const res = await client.marketSell('PAIR', '1.234');
    expect(spy).toHaveBeenCalledWith('AddOrder', expect.objectContaining({ type: 'sell' }));
    expect(res).toEqual({ ok: true });
  });
});
