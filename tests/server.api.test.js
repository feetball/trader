import request from 'supertest';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { jest } from '@jest/globals';
import { app, shutdownForTests, _addWsClient, _clearWsClients, _clearPendingUpdate, performUpdateSteps, broadcastPortfolio } from '../server.js';

const DATA_FILE = 'paper-trading-data.json';
const UPDATE_FLAG = '.update-pending';
const ENV_FILE = '.env';

describe('Server API', () => {
  afterEach(async () => {
    // cleanup artifacts
    try { if (fsSync.existsSync(DATA_FILE)) await fs.unlink(DATA_FILE); } catch(e) {}
    try { if (fsSync.existsSync(UPDATE_FLAG)) await fs.unlink(UPDATE_FLAG); } catch(e) {}
    try { if (fsSync.existsSync(ENV_FILE)) await fs.unlink(ENV_FILE); } catch(e) {}
    _clearWsClients();
    // cleanup any pending state
    shutdownForTests();
    jest.resetAllMocks();
  });

  test('GET /api/portfolio returns default when file missing', async () => {
    try { if (fsSync.existsSync(DATA_FILE)) await fs.unlink(DATA_FILE); } catch(e) {}
    const res = await request(app).get('/api/portfolio');
    expect(res.status).toBe(200);
    expect(res.body.cash).toBe(10000);
  });

  test('GET /api/positions returns [] when file missing', async () => {
    try { if (fsSync.existsSync(DATA_FILE)) await fs.unlink(DATA_FILE); } catch(e) {}
    const res = await request(app).get('/api/positions');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  test('POST /api/updates/apply marks update pending and broadcasts updateReady', async () => {
    // Add fake ws client to capture messages
    const messages = [];
    const fakeClient = { send: (msg) => messages.push(msg), readyState: 1 };
    _addWsClient(fakeClient);

    const res = await request(app).post('/api/updates/apply').send();
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // .update-pending file should be written in test mode
    expect(fsSync.existsSync(UPDATE_FLAG)).toBe(true);

    // Broadcast message for updateReady should have been sent
    const joined = messages.join('\n');
    expect(joined).toContain('updateReady');
  });

  test('POST /api/updates/confirm returns failure when no pending update', async () => {
    // Ensure no pending update exists from previous tests
    try { if (fsSync.existsSync(UPDATE_FLAG)) await fs.unlink(UPDATE_FLAG); } catch(e) {}
    // Clear in-memory pending update helper
    try { _clearPendingUpdate(); } catch(e) {}

    const res = await request(app).post('/api/updates/confirm').send();
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
  });

  test('performUpdateSteps broadcasts updateFailed when git fetch fails', async () => {
    const messages = [];
    const fakeClient = { send: (msg) => messages.push(msg), readyState: 1 };
    _addWsClient(fakeClient);

    // mock execAsync to reject with stdout/stderr
    const execAsync = async () => { throw { stdout: 'fatal: could not fetch' }; };

    await performUpdateSteps(execAsync);

    const joined = messages.join('\n');
    expect(joined).toContain('updateFailed');
  });

  test('performUpdateSteps success path broadcasts updateReady and completes', async () => {
    const messages = [];
    const fakeClient = { send: (msg) => messages.push(msg), readyState: 1 };
    _addWsClient(fakeClient);

    // execAsync resolves for all commands
    const execAsync = async (cmd, opts) => ({ stdout: `OK: ${cmd || ''}` });

    await performUpdateSteps(execAsync);

    const joined = messages.join('\n');
    expect(joined).toContain('updateReady');
    expect(joined).toContain('✅ Update complete');
  });

  test('POST /api/positions/sell performs a force sell and records trade', async () => {
    // create a portfolio with one position
    const now = Date.now();
    const portfolio = { cash: 10000, positions: [{ id: 'p1', productId: 'P-USD', quantity: 10, entryPrice: 1, entryTime: now, investedAmount: 10, buyFee: 0.1, symbol: 'C1' }], closedTrades: [] };
    await fs.writeFile(DATA_FILE, JSON.stringify(portfolio, null, 2));

    // stub fetch to return a higher price
    const orig = global.fetch;
    global.fetch = jest.fn(() => ({ ok: true, json: async () => ({ price: '3.00' }) }));

    const res = await request(app).post('/api/positions/sell').send({ positionId: 'p1' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.trade).toBeTruthy();
    expect(res.body.trade.exitPrice).toBe(3);

    // confirm portfolio file updated
    const file = JSON.parse(await fs.readFile(DATA_FILE, 'utf-8'));
    expect(file.positions.length).toBe(0);
    expect(file.closedTrades.length).toBe(1);

    global.fetch = orig;
  });

  test('POST /api/updates/check broadcasts updateAvailable when remote version is higher', async () => {
    const messages = [];
    const fakeClient = { send: (msg) => messages.push(msg), readyState: 1 };
    _addWsClient(fakeClient);

    // stub global.fetch to return a remote package with higher version
    const orig = global.fetch;
    global.fetch = jest.fn(() => ({ ok: true, json: async () => ({ version: '99.99.99' }) }));

    const res = await request(app).post('/api/updates/check').send();
    expect(res.status).toBe(200);
    expect(res.body.updateAvailable).toBe(true);

    const joined = messages.join('\n');
    expect(joined).toContain('updateAvailable');

    global.fetch = orig;
  });

  test('startBot via startBot() uses spawn and /api/settings restarts when running', async () => {
    // call startBot() exported from server (will spawn a short-lived bot-daemon)
    const { startBot } = await import('../server.js');
    const started = startBot();
    expect(started).toBe(true);

    // Now call POST /api/settings to trigger restart branch
    const res = await request(app).post('/api/settings').send({ MAX_PRICE: 2 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // restarted may be true or false depending on timing; ensure property exists
    expect(Object.prototype.hasOwnProperty.call(res.body, 'restarted')).toBe(true);
  });

  test('POST /api/positions/sell handles fetch failure gracefully', async () => {
    // create portfolio with one position
    const now = Date.now();
    const portfolio = { cash: 10000, positions: [{ id: 'p2', productId: 'P-USD', quantity: 5, entryPrice: 1, entryTime: now, investedAmount: 5, buyFee: 0.1, symbol: 'C2' }], closedTrades: [] };
    await fs.writeFile(DATA_FILE, JSON.stringify(portfolio, null, 2));

    // stub fetch to throw
    const orig = global.fetch;
    global.fetch = jest.fn(() => { throw new Error('offline'); });

    const res = await request(app).post('/api/positions/sell').send({ positionId: 'p2' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.trade).toBeTruthy();

    global.fetch = orig;
  });

  test('GET /api/performance-by-coin and /api/trades and /api/activity return computed results', async () => {
    // craft closedTrades and positions to exercise aggregation
    const now = Date.now();
    const closedTrades = [
      { symbol: 'AAA', profit: 10, investedAmount: 100, exitTime: now - 1000, exitPrice: 2, profitPercent: 10 },
      { symbol: 'AAA', profit: -5, investedAmount: 50, exitTime: now - 500, exitPrice: 1.5, profitPercent: -10 }
    ];
    const portfolio = { cash: 10000, positions: [], closedTrades };
    await fs.writeFile(DATA_FILE, JSON.stringify(portfolio, null, 2));

    const perf = await request(app).get('/api/performance-by-coin');
    expect(perf.status).toBe(200);
    expect(Array.isArray(perf.body)).toBe(true);
    expect(perf.body.length).toBeGreaterThanOrEqual(1);

    const trades = await request(app).get('/api/trades');
    expect(trades.status).toBe(200);
    expect(Array.isArray(trades.body)).toBe(true);

    const activity = await request(app).get('/api/activity');
    expect(activity.status).toBe(200);
    expect(Array.isArray(activity.body)).toBe(true);
  });

  test('POST /api/updates/confirm succeeds when pending update exists', async () => {
    // Trigger test-mode apply to set pendingUpdate
    await request(app).post('/api/updates/apply').send();

    // Now confirm
    const res = await request(app).post('/api/updates/confirm').send();
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // .restart-bot should be created
    expect(fsSync.existsSync('.restart-bot')).toBe(true);

    // cleanup
    try { await fs.unlink('.restart-bot'); } catch(e) {}
  });

  test('checkForUpdates broadcasts only when update becomes available', async () => {
    const messages = [];
    const fakeClient = { send: (msg) => messages.push(msg), readyState: 1 };

    const orig = global.fetch;

    // Reset modules to ensure cachedUpdateInfo is cleared
    jest.resetModules();
    global.fetch = jest.fn(() => ({ ok: true, json: async () => ({ version: '99.99.99' }) }));

    const serverFresh = await import('../server.js');
    serverFresh._addWsClient(fakeClient);

    await serverFresh.checkForUpdates();

    const joined = messages.join('\n');
    expect(joined).toContain('updateAvailable');

    global.fetch = orig;
  });

  test('POST /api/bot/start and /api/bot/stop behave correctly', async () => {
    // Ensure bot is stopped
    try { await request(app).post('/api/bot/stop').send(); } catch (e) {}

    const startRes = await request(app).post('/api/bot/start').send();
    expect(startRes.status).toBe(200);
    expect(startRes.body.success).toBe(true);

    const stopRes = await request(app).post('/api/bot/stop').send();
    expect(stopRes.status).toBe(200);
    expect(stopRes.body.success).toBe(true);
  });

  test('POST /api/settings/reset restores defaults and returns settings', async () => {
    // write a user-settings.json
    const user = { MAX_PRICE: 2, POSITION_SIZE: 50 };
    await fs.writeFile('user-settings.json', JSON.stringify(user, null, 2));

    const res = await request(app).post('/api/settings/reset').send();
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.settings).toBeTruthy();
  });

  test('broadcastPortfolio sends portfolioSummary, positions, and trades', async () => {
    const messages = [];
    const fakeClient = { send: (msg) => messages.push(msg), readyState: 1 };
    _addWsClient(fakeClient);

    const portfolio = {
      cash: 5000,
      positions: [{ id: 'p1', investedAmount: 100, quantity: 10, entryPrice: 10, entryTime: Date.now(), symbol: 'X' }],
      closedTrades: [{ symbol: 'X', profit: 10, netProfit: 9, totalFees: 1 }]
    };
    await fs.writeFile(DATA_FILE, JSON.stringify(portfolio, null, 2));

    await broadcastPortfolio();

    const joined = messages.join('\n');
    expect(joined).toContain('portfolioSummary');
    expect(joined).toContain('positions');
    expect(joined).toContain('trades');
  });

  test('POST /api/portfolio/reset resets portfolio and restarts bot', async () => {
    // Start bot first
    await request(app).post('/api/bot/start').send();

    const res = await request(app).post('/api/portfolio/reset').send();
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.restarted).toBeDefined();
  });

  test('performUpdateSteps broadcasts updateFailed when build fails', async () => {
    const messages = [];
    const fakeClient = { send: (msg) => messages.push(msg), readyState: 1 };
    _addWsClient(fakeClient);

    const execAsync = async (cmd) => {
      if (cmd && cmd.includes('npm run build')) {
        throw { stdout: 'Build error' };
      }
      return { stdout: `OK: ${cmd || ''}` };
    };

    await performUpdateSteps(execAsync);

    const joined = messages.join('\n');
    expect(joined).toContain('updateFailed');
    expect(joined).toContain('Frontend build failed');
    _clearWsClients();
  });

  test('performUpdateSteps warns when tsconfig.json cannot be patched', async () => {
    const tsPath = './frontend/tsconfig.json';
    const backupPath = './frontend/tsconfig.json.bak';
    const messages = [];
    const fakeClient = { send: (msg) => messages.push(msg), readyState: 1 };
    _addWsClient(fakeClient);

    // Temporarily move tsconfig out of the way to force a read failure
    let moved = false;
    try {
      if (fsSync.existsSync(tsPath)) {
        fsSync.renameSync(tsPath, backupPath);
        moved = true;
      }

      const execAsync = async (cmd) => ({ stdout: `OK: ${cmd || ''}` });

      await performUpdateSteps(execAsync);

      const joined = messages.join('\n');
      expect(joined).toContain('could not patch tsconfig.json');
    } finally {
      // Restore tsconfig if we moved it
      try { if (moved && fsSync.existsSync(backupPath)) fsSync.renameSync(backupPath, tsPath); } catch (e) {}
      _clearWsClients();
    }
  });

  test('performUpdateSteps broadcasts updateFailed when frontend install fails', async () => {
    const messages = [];
    const fakeClient = { send: (msg) => messages.push(msg), readyState: 1 };
    _addWsClient(fakeClient);

    const execAsync = async (cmd) => {
      if (cmd && cmd.includes('--include=dev')) {
        throw { stdout: 'npm frontend install failed' };
      }
      return { stdout: `OK: ${cmd || ''}` };
    };

    await performUpdateSteps(execAsync);

    const joined = messages.join('\n');
    expect(joined).toContain('updateFailed');
    expect(joined).toContain('Frontend install failed');
    _clearWsClients();
  });

  test('GET /api/updates/check handles fetch failure gracefully', async () => {
    // stub global.fetch to throw
    const orig = global.fetch;
    global.fetch = jest.fn(() => { throw new Error('network'); });

    const res = await request(app).get('/api/updates/check');
    expect(res.status).toBe(200);
    expect(res.body.updateAvailable).toBe(false);
    expect(res.body.error).toBeDefined();

    global.fetch = orig;
  });

  test('POST /api/settings writes KRAKEN API keys to .env', async () => {
    try { if (fsSync.existsSync(ENV_FILE)) await fs.unlink(ENV_FILE); } catch(e) {}

    const payload = { KRAKEN_API_KEY: 'key-123', KRAKEN_API_SECRET: 'secret-abc' };
    const res = await request(app).post('/api/settings').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const content = await fs.readFile(ENV_FILE, 'utf-8');
    expect(content).toContain('KRAKEN_API_KEY=key-123');
    expect(content).toContain('KRAKEN_API_SECRET=secret-abc');
  });

  test('GET /api/positions/live returns positions with currentPrice null when fetch throws', async () => {
    // create a minimal paper trading file with one position
    const now = Date.now();
    const portfolio = { cash: 10000, positions: [{ id: 'p1', productId: 'P-USD', quantity: 1, entryPrice: 1, entryTime: now, investedAmount: 1, symbol: 'C1' }], closedTrades: [] };
    await fs.writeFile(DATA_FILE, JSON.stringify(portfolio, null, 2));

    // stub fetch to throw
    const orig = global.fetch;
    global.fetch = jest.fn(() => { throw new Error('offline'); });

    const res = await request(app).get('/api/positions/live');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].currentPrice).toBeNull();

    global.fetch = orig;
  });

  test('broadcastPortfolio handles missing file without throwing', async () => {
    try { if (fsSync.existsSync(DATA_FILE)) await fs.unlink(DATA_FILE); } catch(e) {}
    await expect(async () => await broadcastPortfolio()).resolves.not.toThrow();
  });
});
