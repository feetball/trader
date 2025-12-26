import { jest } from '@jest/globals';
import fsSync from 'fs';
import * as fs from 'fs/promises';
import request from 'supertest';
import { app, updateEnv, broadcastPortfolio, _addWsClient, _clearWsClients, maybeSetTimeout, checkForUpdates } from '../server.js';

afterEach(() => jest.restoreAllMocks());


test('broadcastPortfolio skips non-ready clients', async () => {
  const sample = { cash: 10000, positions: [], closedTrades: [] };
  await fs.writeFile('paper-trading-data.json', JSON.stringify(sample, null, 2));

  const client1 = { readyState: 1, send: jest.fn() };
  const client2 = { readyState: 0, send: jest.fn() };

  _addWsClient(client1);
  _addWsClient(client2);

  await broadcastPortfolio();

  expect(client1.send).toHaveBeenCalled();
  expect(client2.send).not.toHaveBeenCalled();

  _clearWsClients();
  try { if (fsSync.existsSync('paper-trading-data.json')) fsSync.unlinkSync('paper-trading-data.json'); } catch (e) {}
});

test('GET /api/settings/history returns empty array when file malformed', async () => {
  const p = 'settings-history.json';
  try { fsSync.unlinkSync(p); } catch (e) {}
  fsSync.writeFileSync(p, 'notjson');

  const res = await request(app).get('/api/settings/history');
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.length).toBe(0);

  try { fsSync.unlinkSync(p); } catch (e) {}
});

test('maybeSetTimeout executes immediately and swallows thrown errors in test env', () => {
  const spy = jest.fn(() => { throw new Error('boom'); });
  expect(() => maybeSetTimeout(spy, 100)).not.toThrow();
});

test('checkForUpdates handles fetch rejection and logs error', async () => {
  const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  const origFetch = global.fetch;
  global.fetch = jest.fn().mockRejectedValue(new Error('net fail'));

  await expect(checkForUpdates()).resolves.toBeUndefined();
  expect(errSpy).toHaveBeenCalled();

  global.fetch = origFetch;
});
