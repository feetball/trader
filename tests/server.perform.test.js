import { jest } from '@jest/globals';
import request from 'supertest';

// Reset module registry so we can import a fresh server.js with mocks applied
jest.resetModules();

// We'll spy on real fs methods instead of mocking the module to avoid module cache issues
const { app } = await import('../server.js');
const fsSync = (await import('fs')).default;
const fsPromises = (await import('fs/promises')).default;
import { performUpdateSteps } from '../server.js';

describe('performUpdateSteps', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('completes successful update flow and writes update-pending', async () => {
    // Arrange: set cached update info by calling updates/check (mock fetch)
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ version: '2.0.0' }) });
    await request(app).post('/api/updates/check');

    // Spy on settings and fs
    jest.spyOn(fsSync, 'existsSync').mockReturnValue(true);
    jest.spyOn(fsSync, 'readFileSync').mockImplementation((p) => {
      if (p.endsWith('user-settings.json')) return JSON.stringify({ EXCHANGE: 'KRAKEN' });
      if (p.endsWith('config.default.js')) return 'defaultConfig = { }';
      if (p.endsWith('frontend/tsconfig.json')) return JSON.stringify({});
      return '';
    });
    jest.spyOn(fsSync, 'writeFileSync').mockImplementation(() => {});
    jest.spyOn(fsSync, 'unlinkSync').mockImplementation(() => {});
    jest.spyOn(fsPromises, 'writeFile').mockImplementation(async () => {});

    // Simulate execAsync behavior
    const execAsync = jest.fn(async (cmd, opts) => {
      if (cmd.startsWith('git fetch')) return {}; // ok
      if (cmd.startsWith('git reset')) return { stdout: 'reset-ok' };
      if (cmd.includes('npm install') && (!cmd.includes('run build'))) return { stdout: 'npm ok' };
      if (cmd.includes('npm run build')) return { stdout: 'build ok' };
      return { stdout: '' };
    });

    // Act
    const result = await performUpdateSteps(execAsync);

    // Assert: it should have read settings and defaults and returned a pending update
    expect(fsSync.readFileSync).toHaveBeenCalledWith(expect.stringContaining('user-settings.json'), 'utf-8');
    expect(fsSync.readFileSync).toHaveBeenCalledWith(expect.stringContaining('config.default.js'), 'utf-8');
    expect(result).toHaveProperty('timestamp');
  });

  test('handles git fetch failure gracefully', async () => {
    const execAsync = jest.fn(async (cmd) => {
      if (cmd.startsWith('git fetch')) throw new Error('git failed');
      return { stdout: '' };
    });

    // Spy on console to capture updateFailed broadcast via updateLog
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const result = await performUpdateSteps(execAsync);
    // On failure, result should be undefined since function returns early
    expect(result).toBeUndefined();
    spy.mockRestore();
  });

  test('handles backend npm install failure', async () => {
    const execAsync = jest.fn(async (cmd) => {
      if (cmd.includes('npm install') && !cmd.includes('frontend')) throw new Error('npm backend fail');
      if (cmd.startsWith('git fetch')) return {};
      if (cmd.startsWith('git reset')) return { stdout: '' };
      return { stdout: '' };
    });

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const result = await performUpdateSteps(execAsync);
    expect(result).toBeUndefined();
    spy.mockRestore();
  });

  test('handles frontend npm install failure', async () => {
    const execAsync = jest.fn(async (cmd) => {
      if (cmd.startsWith('git fetch')) return {};
      if (cmd.startsWith('git reset')) return { stdout: '' };
      if (cmd.includes('npm install --include=dev')) throw new Error('frontend npm fail');
      return { stdout: '' };
    });

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const result = await performUpdateSteps(execAsync);
    expect(result).toBeUndefined();
    spy.mockRestore();
  });

  test('handles frontend build failure', async () => {
    const execAsync = jest.fn(async (cmd) => {
      if (cmd.startsWith('git fetch')) return {};
      if (cmd.startsWith('git reset')) return { stdout: '' };
      if (cmd.includes('npm run build')) throw new Error('build failed');
      if (cmd.includes('npm install')) return { stdout: 'npm ok' };
      return { stdout: '' };
    });

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const result = await performUpdateSteps(execAsync);
    expect(result).toBeUndefined();
    spy.mockRestore();
  });

  test('logs warning when tsconfig patch fails', async () => {
    const execAsync = jest.fn(async (cmd) => {
      if (cmd.startsWith('git fetch')) return {};
      if (cmd.startsWith('git reset')) return { stdout: '' };
      if (cmd.includes('npm install')) return { stdout: 'npm ok' };
      if (cmd.includes('npm run build')) return { stdout: 'build ok' };
      return { stdout: '' };
    });

    // Simulate tsconfig read throwing
    jest.spyOn(fsSync, 'readFileSync').mockImplementation((p) => {
      if (p.endsWith('frontend/tsconfig.json')) throw new Error('tsconfig missing');
      return '';
    });

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const result = await performUpdateSteps(execAsync);
    expect(result).toHaveProperty('timestamp');
    spy.mockRestore();
  });
});