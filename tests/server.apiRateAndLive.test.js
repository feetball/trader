import { jest } from '@jest/globals';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import request from 'supertest';
import { app, startApiRateInterval, _addWsClient, _clearWsClients, shutdownForTests, botStatus } from '../server.js';

const DATA_PATH = path.join(process.cwd(), 'paper-trading-data.json');

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

  const res = await request(app).get('/api/positions/live').send();
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body[0]).toHaveProperty('currentPrice', 2.5);
});

test('POST /api/portfolio/reset stops running bot and restarts it', async () => {
  // Start bot first
  await request(app).post('/api/bot/start').send();

  const res = await request(app).post('/api/portfolio/reset').send();
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('success', true);
  expect(res.body).toHaveProperty('restarted', true);
});