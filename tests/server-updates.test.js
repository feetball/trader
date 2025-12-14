import { jest } from '@jest/globals';
import request from 'supertest';

// Mock fs and child_process similar to server.test.js
jest.unstable_mockModule('fs/promises', () => ({
  default: {
    readFile: jest.fn(() => JSON.stringify({ version: '0.8.43' })),
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
  exec: jest.fn(() => Promise.resolve({ stdout: 'ok' })),
  spawn: jest.fn(),
}));

// Import app after mocks
const { app } = await import('../server.js');
const fs = (await import('fs/promises')).default;
const fsSync = (await import('fs')).default;

describe('Server updates endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  test('GET /api/updates/check returns updateAvailable true when remote newer', async () => {
    // local package.json is 0.8.43 (from fs.readFile mock default)
    // remote has higher version
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({ version: '1.0.0' }) });

    const res = await request(app).get('/api/updates/check');
    expect(res.statusCode).toBe(200);
    expect(res.body.updateAvailable).toBe(true);
    expect(res.body.latestVersion).toBe('1.0.0');
  });

  test('POST /api/updates/check broadcasts and returns info', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({ version: '1.0.0' }) });
    const res = await request(app).post('/api/updates/check');
    expect(res.statusCode).toBe(200);
    expect(res.body.updateAvailable).toBe(true);
  });

  test('POST /api/updates/apply returns success and writes update-pending', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({ version: '1.0.0' }) });
    const res = await request(app).post('/api/updates/apply');
    expect(res.statusCode).toBe(200);
    // Allow any synchronous test-mode handlers to run
    await new Promise(resolve => setImmediate(resolve));
    // It should have attempted to write .update-pending via fsSync
    expect(fsSync.writeFileSync).toHaveBeenCalled();
    expect(res.body.success).toBe(true);
  });
});
