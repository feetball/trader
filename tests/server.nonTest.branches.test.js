import { jest } from '@jest/globals';
import fsSync from 'fs';
import request from 'supertest';

// These tests import a fresh server.js module with "non-test" env
// to exercise branches guarded by isTestEnv.

afterEach(() => {
  // cleanup artifacts
  try { if (fsSync.existsSync('.restart-bot')) fsSync.unlinkSync('.restart-bot'); } catch (e) {}
});

test('initializeForRuntime executes non-test branches (startApiRateInterval, checkForUpdates, auto-start bot)', async () => {
  jest.resetModules();

  // Ensure module computes isTestEnv=false
  const origJest = process.env.JEST_WORKER_ID;
  const origNode = process.env.NODE_ENV;
  delete process.env.JEST_WORKER_ID;
  process.env.NODE_ENV = 'development';

  // Create restart flag so initializeForRuntime will try to auto-start
  fsSync.writeFileSync('.restart-bot', 'true');

  const server = await import('../server.js');

  // Spy on global.setInterval to observe startApiRateInterval behavior indirectly
  const setIntSpy = jest.spyOn(global, 'setInterval').mockImplementation(() => 42);
  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

  server.initializeForRuntime();

  // setInterval should have been called to schedule hourly checks (startApiRateInterval or direct interval)
  expect(setIntSpy).toHaveBeenCalled();
  // restart flag existed, so initialize should have removed it and logged AUTO-START
  expect(fsSync.existsSync('.restart-bot')).toBe(false);
  expect(logSpy.mock.calls.some(call => String(call[0]).includes('AUTO-START'))).toBe(true);

  // restore
  setIntSpy.mockRestore();
  logSpy.mockRestore();
  process.env.JEST_WORKER_ID = origJest;
  process.env.NODE_ENV = origNode;
});

test('POST /api/updates/apply schedules performUpdateSteps when not in test env', async () => {
  jest.resetModules();
  const origJest = process.env.JEST_WORKER_ID;
  const origNode = process.env.NODE_ENV;
  delete process.env.JEST_WORKER_ID;
  process.env.NODE_ENV = 'development';

  const server = await import('../server.js');

  // spy on setTimeout to ensure update schedule path is used (don't call the cb)
  const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation(() => 1);

  const res = await request(server.app).post('/api/updates/apply').send();
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);

  expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 500);

  // We don't assert on .update-pending file here; just ensure scheduling happened

  setTimeoutSpy.mockRestore();
  process.env.JEST_WORKER_ID = origJest;
  process.env.NODE_ENV = origNode;
});
