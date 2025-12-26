import { jest } from '@jest/globals';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import request from 'supertest';
import { app, startApiRateInterval, _addWsClient, _clearWsClients, shutdownForTests, botStatus } from '../server.js';

const DATA_PATH = process.env.PAPER_TRADING_DATA || path.join(process.cwd(), 'paper-trading-data.json');

afterEach(() => {
  try { shutdownForTests(); } catch (e) {}
  _clearWsClients();
});

test('startApiRateInterval updates api rate and broadcasts to ws clients', () => {
  jest.useFakeTimers();

  const fakeClient = { readyState: 1, send: jest.fn() };
  _addWsClient(fakeClient);

  // Ensure bot is running and has new apiCalls
  botStatus.running = true;
  botStatus.apiCalls = 5;

  startApiRateInterval();

  // Advance to trigger interval
  jest.advanceTimersByTime(2000);

  expect(fakeClient.send).toHaveBeenCalled();
  // botStatus.apiRate should have been updated to at least 1
  expect(botStatus.apiRate).toBeGreaterThanOrEqual(1);

  jest.useRealTimers();
});

test('GET /api/positions/live returns enriched position prices', async () => {
  // Create data file
  const initial = {
    cash: 10000,
    positions: [
      {
        id: 'p1',
        symbol: 'C1',
        productId: 'C1-USD',
        entryPrice: 1.0,
        investedAmount: 100,
        quantity: 100,
        buyFee: 0.25,
        entryTime: Date.now() - 1000
      }
    ],
    closedTrades: []
  };
  await fs.writeFile(DATA_PATH, JSON.stringify(initial, null, 2));

  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ price: '2.50' }) });

  // First successful fetch - candidate only, not yet committed
  const res1 = await request(app).get('/api/positions/live').send();
  expect(res1.status).toBe(200);
  expect(Array.isArray(res1.body)).toBe(true);
  expect(res1.body[0]).toHaveProperty('currentPrice', 2.5);
  expect(botStatus.exchangeApiStatus).not.toBe('ok');

  // Second consecutive successful fetch should commit the OK state
  const res2 = await request(app).get('/api/positions/live').send();
  expect(res2.status).toBe(200);
  expect(botStatus.exchangeApiStatus).toBe('ok');
});

test('GET /api/positions/live sets rate-limited when API returns 429', async () => {
  const initial = {
    cash: 10000,
    positions: [{ id: 'p2', symbol: 'C2', productId: 'C2-USD', entryPrice: 1.0, investedAmount: 100, quantity: 100, buyFee: 0.25, entryTime: Date.now() - 1000 }],
    closedTrades: []
  };
  await fs.writeFile(DATA_PATH, JSON.stringify(initial, null, 2));

  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 429 });

  // Need two consecutive 429 calls to commit the rate-limited state
  await request(app).get('/api/positions/live').send();
  expect(botStatus.exchangeApiStatus).not.toBe('rate-limited');
  await request(app).get('/api/positions/live').send();
  expect(botStatus.exchangeApiStatus).toBe('rate-limited');
});

test('GET /api/positions/live sets error when fetch throws', async () => {
  const initial = {
    cash: 10000,
    positions: [{ id: 'p3', symbol: 'C3', productId: 'C3-USD', entryPrice: 1.0, investedAmount: 100, quantity: 100, buyFee: 0.25, entryTime: Date.now() - 1000 }],
    closedTrades: []
  };
  await fs.writeFile(DATA_PATH, JSON.stringify(initial, null, 2));

  global.fetch = jest.fn().mockRejectedValue(new Error('network'));

  // Need two consecutive failures to commit 'error'
  await request(app).get('/api/positions/live').send();
  expect(botStatus.exchangeApiStatus).not.toBe('error');
  await request(app).get('/api/positions/live').send();
  expect(botStatus.exchangeApiStatus).toBe('error');
});

// Kraken tests

test('GET /api/positions/live returns enriched position prices for Kraken', async () => {
  // Switch to Kraken exchange
  const { config } = await import('../config-utils.js');
  config.EXCHANGE = 'KRAKEN';

  const initial = {
    cash: 10000,
    positions: [{ id: 'pk1', symbol: 'K1', productId: 'XBTUSD', entryPrice: 1.0, investedAmount: 100, quantity: 100, buyFee: 0.25, entryTime: Date.now() - 1000 }],
    closedTrades: []
  };
  await fs.writeFile(DATA_PATH, JSON.stringify(initial, null, 2));

  // Mock Kraken response shape
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ result: { XBTUSD: { c: ['123.45'] } } }) });

  const res1 = await request(app).get('/api/positions/live').send();
  expect(res1.status).toBe(200);
  expect(Array.isArray(res1.body)).toBe(true);
  expect(res1.body[0]).toHaveProperty('currentPrice', 123.45);
  expect(botStatus.exchangeApiStatus).not.toBe('ok');

  // Second consecutive Kraken success commits the OK state
  const res2 = await request(app).get('/api/positions/live').send();
  expect(res2.status).toBe(200);
  expect(botStatus.exchangeApiStatus).toBe('ok');

  // Revert exchange
  config.EXCHANGE = 'COINBASE';
});

test('GET /api/positions/live handles Kraken 429 rate-limit', async () => {
  const { config } = await import('../config-utils.js');
  config.EXCHANGE = 'KRAKEN';

  const initial = {
    cash: 10000,
    positions: [{ id: 'pk2', symbol: 'K2', productId: 'XBTUSD', entryPrice: 1.0, investedAmount: 100, quantity: 100, buyFee: 0.25, entryTime: Date.now() - 1000 }],
    closedTrades: []
  };
  await fs.writeFile(DATA_PATH, JSON.stringify(initial, null, 2));

  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 429 });

  // Need two consecutive Kraken 429 responses to commit rate-limited
  await request(app).get('/api/positions/live').send();
  expect(botStatus.exchangeApiStatus).not.toBe('rate-limited');
  await request(app).get('/api/positions/live').send();
  expect(botStatus.exchangeApiStatus).toBe('rate-limited');

  config.EXCHANGE = 'COINBASE';
});

test('GET /api/positions/live handles Kraken fetch error', async () => {
  const { config } = await import('../config-utils.js');
  config.EXCHANGE = 'KRAKEN';

  const initial = {
    cash: 10000,
    positions: [{ id: 'pk3', symbol: 'K3', productId: 'XBTUSD', entryPrice: 1.0, investedAmount: 100, quantity: 100, buyFee: 0.25, entryTime: Date.now() - 1000 }],
    closedTrades: []
  };
  await fs.writeFile(DATA_PATH, JSON.stringify(initial, null, 2));

  global.fetch = jest.fn().mockRejectedValue(new Error('offline'));

  // Need two consecutive Kraken failures to commit 'error'
  await request(app).get('/api/positions/live').send();
  expect(botStatus.exchangeApiStatus).not.toBe('error');
  await request(app).get('/api/positions/live').send();
  expect(botStatus.exchangeApiStatus).toBe('error');

  config.EXCHANGE = 'COINBASE';
});

test('POST /api/portfolio/reset stops running bot and restarts it', async () => {
  // Start bot first
  await request(app).post('/api/bot/start').send();

  const res = await request(app).post('/api/portfolio/reset').send();
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('success', true);
  expect(res.body).toHaveProperty('restarted', true);
});