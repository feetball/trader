import { jest } from '@jest/globals';
import request from 'supertest';

// Reset modules so server.js picks up fresh state
jest.resetModules();

// Mock fs sync methods to capture writes
jest.unstable_mockModule('fs', () => ({
  default: {
    existsSync: jest.fn().mockReturnValue(true),
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
    unlinkSync: jest.fn(),
  }
}));

const { app } = await import('../server.js');
const fsSync = (await import('fs')).default;

describe('POST /api/updates/confirm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ version: '1.0.0' }) });
  });

  test('confirms pending update and writes restart flag', async () => {
    // Trigger an update to set pendingUpdate in test mode
    await request(app).post('/api/updates/check');
    await request(app).post('/api/updates/apply');

    // Now confirm
    const res = await request(app).post('/api/updates/confirm');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // Should write a .restart-bot flag
    expect(fsSync.writeFileSync).toHaveBeenCalledWith(expect.stringContaining('.restart-bot'), 'true');

    // Should remove .update-pending if exists
    expect(fsSync.unlinkSync).toHaveBeenCalled();
  });

  test('returns error when no pending update', async () => {
    // Ensure fresh server with no pending
    jest.resetModules();
    const { app: freshApp } = await import('../server.js');

    const res = await request(freshApp).post('/api/updates/confirm');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(false);
  });
});