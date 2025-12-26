import { jest } from '@jest/globals';
import fsSync from 'fs';
import fs from 'fs/promises';

beforeEach(() => jest.resetModules());

test('maybeSetTimeout runs immediately in test env and swallows errors', async () => {
  const serverMod = await import('../server.js');
  const { maybeSetTimeout } = serverMod;

  // should not throw even if fn throws
  expect(() => maybeSetTimeout(() => { throw new Error('boom') }, 10)).not.toThrow();
});

test('broadcastPortfolio skips clients that are not OPEN', async () => {
  const serverMod = await import('../server.js');
  const { broadcastPortfolio, _addWsClient, _clearWsClients } = serverMod;

  const messages = [];
  const fakeClient = { send: (m) => messages.push(m), readyState: 0 };
  _addWsClient(fakeClient);

  // Create a minimal data file so broadcastPortfolio attempts to read
  const portfolio = { cash: 100, positions: [], closedTrades: [] };
  await fs.writeFile('paper-trading-data.json', JSON.stringify(portfolio, null, 2));

  await broadcastPortfolio();

  // Since client.readyState !== 1, it should not have received messages
  expect(messages.length).toBe(0);

  _clearWsClients();
});

test('_clearPendingUpdate removes persisted file', async () => {
  const serverMod = await import('../server.js');
  const { _clearPendingUpdate } = serverMod;

  const p = '.update-pending';
  try { fsSync.writeFileSync(p, '{}'); } catch (e) {}
  expect(fsSync.existsSync(p)).toBe(true);

  _clearPendingUpdate();
  expect(fsSync.existsSync(p)).toBe(false);
});
