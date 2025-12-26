import { jest } from '@jest/globals';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { broadcastPortfolio, _addWsClient, _clearWsClients } from '../server.js';

const DATA_PATH = process.env.PAPER_TRADING_DATA || path.join(process.cwd(), 'paper-trading-data.json');

beforeEach(async () => {
  _clearWsClients();
  const sample = {
    cash: 10000,
    positions: [{ id: 'p1', symbol: 'C1', investedAmount: 10 }],
    closedTrades: [{ symbol: 'C1', profit: 1, investedAmount: 10 }]
  };
  await fs.writeFile(DATA_PATH, JSON.stringify(sample, null, 2));
});

afterEach(() => {
  try { fsSync.unlinkSync(DATA_PATH); } catch (e) {}
});

test('broadcastPortfolio sends portfolioSummary, positions and trades', async () => {
  const fakeClient = { readyState: 1, send: jest.fn() };
  _addWsClient(fakeClient);

  await broadcastPortfolio();

  // called multiple times for each broadcast
  expect(fakeClient.send.mock.calls.length).toBeGreaterThanOrEqual(3);
  const messages = fakeClient.send.mock.calls.map(c => JSON.parse(c[0]));
  const types = messages.map(m => m.type);
  expect(types).toEqual(expect.arrayContaining(['portfolioSummary', 'positions', 'trades']));
});