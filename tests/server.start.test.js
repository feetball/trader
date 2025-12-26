import { jest } from '@jest/globals';
import request from 'supertest';

jest.unstable_mockModule('child_process', () => ({
  spawn: jest.fn(),
}));

const { app } = await import('../server.js');
const child = await import('child_process');

describe('Server bot start behavior', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    // Ensure bot is stopped before each test
    try { await request(app).post('/api/bot/stop'); } catch (e) {}
  });

  test('POST /api/bot/start succeeds and parses stdout APICALLS messages', async () => {
    const listeners = {};
    const fakeProc = {
      stdout: { on: (evt, cb) => { listeners.stdout = cb; } },
      stderr: { on: jest.fn() },
      on: jest.fn((evt, cb) => { listeners[evt] = cb; }),
    };
    child.spawn.mockReturnValue(fakeProc);

    const res = await request(app).post('/api/bot/start');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // Simulate stdout data arriving with APICALLS
    listeners.stdout(Buffer.from('[APICALLS] 7\n'));

    const status = await request(app).get('/api/bot/status');
    expect(status.body.apiCalls).toBe(7);
  });

  test('POST /api/bot/start returns error when spawn throws', async () => {
    // Ensure no bot is running before we test spawn failure
    const mod = await import('../server.js');
    if (mod.shutdownForTests) mod.shutdownForTests();
    child.spawn.mockImplementation(() => { throw new Error('spawn fail') });

    const res = await request(app).post('/api/bot/start');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Failed to start|spawn fail/);
  });
});