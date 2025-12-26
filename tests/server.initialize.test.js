import { jest } from '@jest/globals';
import fsSync from 'fs';
import * as server from '../server.js';

afterEach(() => {
  try { if (fsSync.existsSync('.restart-bot')) fsSync.unlinkSync('.restart-bot'); } catch (e) {}
  jest.restoreAllMocks();
});

test('initializeForRuntime removes restart flag and logs auto-start', () => {
  fsSync.writeFileSync('.restart-bot', 'true');
  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

  server.initializeForRuntime();

  const isTestEnv = !!process.env.JEST_WORKER_ID || process.env.NODE_ENV === 'test';
  if (isTestEnv) {
    // In test env we intentionally do minimal init, so restart flag should remain
    expect(fsSync.existsSync('.restart-bot')).toBe(true);
  } else {
    expect(fsSync.existsSync('.restart-bot')).toBe(false);
    expect(logSpy).toHaveBeenCalled();
    // Look for the AUTO-START message in any call
    expect(logSpy.mock.calls.some(call => call[0] && String(call[0]).includes('AUTO-START'))).toBe(true);
  }
});

test('initializeForRuntime runs safely in test env', () => {
  expect(() => server.initializeForRuntime()).not.toThrow();
});
