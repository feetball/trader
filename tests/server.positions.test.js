import { jest } from '@jest/globals';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import request from 'supertest';
import { app } from '../server.js';

const DATA_PATH = path.join(process.cwd(), 'paper-trading-data.json');

beforeEach(async () => {
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
});

test('sell without positionId returns error', async () => {
  const res = await request(app).post('/api/positions/sell').send({});
  expect(res.body).toHaveProperty('success', false);
  expect(res.body.message).toMatch(/Position ID required/);
});

test('sell with unknown position returns not found', async () => {
  const res = await request(app).post('/api/positions/sell').send({ positionId: 'nope' });
  expect(res.body).toHaveProperty('success', false);
  expect(res.body.message).toMatch(/Position not found/);
});

test('sell with fetch failure falls back to entry price and records trade', async () => {
  // Mock global fetch to throw
  global.fetch = jest.fn().mockImplementation(() => { throw new Error('net fail'); });

  const res = await request(app).post('/api/positions/sell').send({ positionId: 'p1' });
  expect(res.body).toHaveProperty('success', true);
  expect(res.body.trade).toBeDefined();
  expect(res.body.trade.exitPrice).toBe(1.0);

  const raw = await fs.readFile(DATA_PATH, 'utf-8');
  const parsed = JSON.parse(raw);
  expect(parsed.positions.length).toBe(0);
  expect(parsed.closedTrades.length).toBe(1);
});

test('sell with fetch success uses current price', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ price: '2.00' }) });

  const res = await request(app).post('/api/positions/sell').send({ positionId: 'p1' });
  expect(res.body).toHaveProperty('success', true);
  expect(res.body.trade.exitPrice).toBeCloseTo(2.0);
});