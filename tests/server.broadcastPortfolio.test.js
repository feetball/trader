import { jest } from '@jest/globals';
import fsSync from 'fs';
import * as fs from 'fs/promises';
import { broadcastPortfolio, _addWsClient, _clearWsClients } from '../server.js';

// If paper-trading-data.json missing, broadcastPortfolio should not throw
test('broadcastPortfolio handles missing file gracefully', async () => {
  const p = process.env.PAPER_TRADING_DATA || 'paper-trading-data.json';
  try { if (fsSync.existsSync(p)) fsSync.unlinkSync(p); } catch (e) {}
  await expect(broadcastPortfolio()).resolves.toBeUndefined();
});

// If file exists, it should read and attempt to broadcast (we'll attach fake ws clients)
test('broadcastPortfolio reads file and broadcasts to ws clients', async () => {
  const sample = { cash: 10000, positions: [], closedTrades: [] };
  await fs.writeFile(process.env.PAPER_TRADING_DATA || 'paper-trading-data.json', JSON.stringify(sample, null, 2));

  const client = { readyState: 1, send: jest.fn() };
  _addWsClient(client);

  await broadcastPortfolio();

  expect(client.send).toHaveBeenCalled();

  _clearWsClients();
  try { if (fsSync.existsSync(p)) fsSync.unlinkSync(p); } catch (e) {}
});
