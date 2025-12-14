import { jest } from '@jest/globals';
import request from 'supertest';

// Mock dependencies
jest.unstable_mockModule('fs/promises', () => ({
  default: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    unlink: jest.fn(),
  }
}));

jest.unstable_mockModule('fs', () => ({
  default: {
    existsSync: jest.fn(),
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
    unlinkSync: jest.fn(),
  }
}));

jest.unstable_mockModule('child_process', () => ({
  spawn: jest.fn(),
  exec: jest.fn(),
}));

// Mock config
jest.unstable_mockModule('../config-utils.js', () => ({
  config: {
    EXCHANGE: 'COINBASE',
    PAPER_TRADING: true,
  },
  pickConfigSnapshot: jest.fn(),
}));

jest.unstable_mockModule('../config.default.js', () => ({
  defaultConfig: {
    EXCHANGE: 'COINBASE',
    PAPER_TRADING: true,
  }
}));

// Import app after mocking
const { app } = await import('../server.js');
const fs = (await import('fs/promises')).default;
const fsSync = (await import('fs')).default;

describe('API Server', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Ensure we clean up any server handles created during tests
    const mod = await import('../server.js');
    if (mod.shutdownForTests) mod.shutdownForTests();

    // Debug: print active handles to help track lingering timers/sockets
    try {
      const handles = process._getActiveHandles();
      console.log('[DEBUG] Active handles after server tests:', handles.map(h => h.constructor && h.constructor.name));
    } catch (e) {
      // ignore if not available
    }
  });

  test('GET /api/settings should return settings', async () => {
    fsSync.existsSync.mockReturnValue(true);
    fs.readFile.mockResolvedValue(JSON.stringify({ EXCHANGE: 'KRAKEN' }));

    const res = await request(app).get('/api/settings');
    expect(res.statusCode).toBe(200);
    expect(res.body.EXCHANGE).toBe('KRAKEN');
  });

  test('POST /api/settings should update settings and handle secrets', async () => {
    fs.readFile.mockResolvedValue('EXISTING_ENV=true');
    
    const res = await request(app).post('/api/settings').send({
      EXCHANGE: 'KRAKEN',
      KRAKEN_API_KEY: 'new-key',
      KRAKEN_API_SECRET: 'new-secret'
    });

    expect(res.statusCode).toBe(200);
    
    // Check if .env was updated (mocked fs.writeFile)
    expect(fs.writeFile).toHaveBeenCalledWith('.env', expect.stringContaining('KRAKEN_API_KEY=new-key'));
    expect(fs.writeFile).toHaveBeenCalledWith('.env', expect.stringContaining('KRAKEN_API_SECRET=new-secret'));
    
    // Check if user-settings.json was updated
    expect(fs.writeFile).toHaveBeenCalledWith('user-settings.json', expect.stringContaining('"EXCHANGE": "KRAKEN"'));
  });

  test('GET /api/portfolio returns portfolio summary', async () => {
    fs.readFile.mockResolvedValue(JSON.stringify({ cash: 5000, positions: [], closedTrades: [] }))
    const res = await request(app).get('/api/portfolio')
    expect(res.statusCode).toBe(200)
    expect(res.body.cash).toBe(5000)
  })

  test('POST /api/portfolio/reset resets and starts bot', async () => {
    // mock spawn to return a fake process object with listeners
    const fakeProc = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn((evt, cb) => {}),
      kill: jest.fn()
    }
    const child = await import('child_process')
    child.spawn.mockReturnValue(fakeProc)

    const res = await request(app).post('/api/portfolio/reset')
    expect(res.statusCode).toBe(200)
    expect(fs.writeFile).toHaveBeenCalledWith('paper-trading-data.json', expect.stringContaining('"cash": 10000'))

    // Stop the bot to avoid background processes during tests
    await request(app).post('/api/bot/stop')
  })

  test('POST /api/bot/start and /api/bot/stop works', async () => {
    // start when not running
    const fakeProc = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn((evt, cb) => {}),
      kill: jest.fn()
    }
    const child = await import('child_process')
    child.spawn.mockReturnValue(fakeProc)

    // Ensure bot is stopped before starting
    await request(app).post('/api/bot/stop')

    const startRes = await request(app).post('/api/bot/start')
    expect(startRes.statusCode).toBe(200)
    expect(typeof startRes.body.success).toBe('boolean')

    const stopRes = await request(app).post('/api/bot/stop')
    expect(stopRes.statusCode).toBe(200)
    expect(stopRes.body.success).toBe(true)
  })

  test('GET /api/positions/live returns current prices for positions', async () => {
    fs.readFile.mockResolvedValue(JSON.stringify({ cash: 1000, positions: [{ id: 'pos1', productId: 'P1', quantity: 2, entryPrice: 1, entryTime: Date.now() }], closedTrades: [] }))
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ price: '2.5' }) })
    const res = await request(app).get('/api/positions/live')
    expect(res.statusCode).toBe(200)
    expect(res.body[0].currentPrice).toBeCloseTo(2.5)
  })

  test('POST /api/positions/sell forces a sell and records trade', async () => {
    const portfolio = { cash: 1000, positions: [{ id: 'pos1', productId: 'P1', quantity: 2, entryPrice: 1, entryTime: Date.now(), investedAmount: 2 }], closedTrades: [] }
    fs.readFile.mockResolvedValue(JSON.stringify(portfolio))

    // Mock ticker fetch
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ price: '2' }) })

    const res = await request(app).post('/api/positions/sell').send({ positionId: 'pos1' })
    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
    expect(fs.writeFile).toHaveBeenCalledWith('paper-trading-data.json', expect.stringContaining('closedTrades'))
  })
  test('GET /api/updates/status returns default when no updates', async () => {
    const res = await request(app).get('/api/updates/status')
    expect(res.statusCode).toBe(200)
    expect(res.body.updateAvailable).toBe(false)
  })

  test('GET /api/version handles read failures gracefully', async () => {
    fs.readFile.mockRejectedValueOnce(new Error('no package'))
    const res = await request(app).get('/api/version')
    expect(res.statusCode).toBe(200)
    expect(res.body.version).toBe('unknown')
  })

  test('POST /api/settings restarts bot when it was running', async () => {
    // Start bot
    const fakeProc = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn((evt, cb) => {}),
      kill: jest.fn()
    }
    const child = await import('child_process')
    child.spawn.mockReturnValue(fakeProc)

    await request(app).post('/api/bot/start')

    // Now post settings - it should detect that bot was running and restart
    const res = await request(app).post('/api/settings').send({ EXCHANGE: 'KRAKEN' })
    expect(res.statusCode).toBe(200)
    expect(res.body.restarted).toBe(true)
  })

  test('POST /api/settings/reset removes settings and restarts if running', async () => {
    // Ensure user-settings exists
    fsSync.existsSync.mockReturnValue(true)

    // Start bot so we test restart path
    const fakeProc = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn((evt, cb) => {}),
      kill: jest.fn()
    }
    const child = await import('child_process')
    child.spawn.mockReturnValue(fakeProc)
    await request(app).post('/api/bot/start')

    const res = await request(app).post('/api/settings/reset')
    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
    expect(fs.unlink).toHaveBeenCalled()
  })
})
