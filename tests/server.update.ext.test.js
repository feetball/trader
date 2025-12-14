import { jest } from '@jest/globals';
import fs from 'fs/promises';
import fsSync from 'fs';

// Import fresh module to avoid residual intervals/state
beforeEach(() => {
  jest.resetModules();
});

describe('Server update and api rate behaviors', () => {
  test('startApiRateInterval updates apiRate and broadcasts when running', async () => {
    jest.useFakeTimers();
    const serverMod = await import('../server.js');
    const { startApiRateInterval, botStatus, _addWsClient, _clearWsClients } = serverMod;

    // spy messages
    const messages = [];
    const fakeClient = { send: (m) => messages.push(m), readyState: 1 };
    _addWsClient(fakeClient);

    // set running state and start interval
    botStatus.running = true;
    botStatus.apiCalls = 0;

    startApiRateInterval();

    // Simulate new API calls being noticed by interval
    botStatus.apiCalls = 4;

    // Advance one interval tick
    jest.advanceTimersByTime(2100);

    // Should have broadcast botStatus and updated apiRate
    expect(botStatus.apiRate).toBeGreaterThanOrEqual(1);
    const joined = messages.join('\n');
    expect(joined).toContain('botStatus');

    _clearWsClients();
    jest.useRealTimers();
  });

  test('startApiRateInterval does not broadcast when not running', async () => {
    jest.useFakeTimers();
    const serverMod = await import('../server.js');
    const { startApiRateInterval, botStatus, _addWsClient, _clearWsClients } = serverMod;

    const messages = [];
    const fakeClient = { send: (m) => messages.push(m), readyState: 1 };
    _addWsClient(fakeClient);

    botStatus.running = false;
    botStatus.apiCalls = 0;

    startApiRateInterval();

    botStatus.apiCalls = 10;

    jest.advanceTimersByTime(2100);

    // No botStatus broadcast expected when not running
    expect(messages.join('\n')).not.toContain('botStatus');

    _clearWsClients();
    jest.useRealTimers();
  });

  test('performUpdateSteps broadcasts updateFailed when backend install fails', async () => {
    const serverMod = await import('../server.js');
    const { performUpdateSteps, _addWsClient, _clearWsClients } = serverMod;

    const messages = [];
    const fakeClient = { send: (m) => messages.push(m), readyState: 1 };
    _addWsClient(fakeClient);

    const execAsync = async (cmd) => {
      if (cmd && cmd.includes('npm install 2>&1')) {
        throw { stdout: 'npm backend install failed' };
      }
      return { stdout: `OK: ${cmd || ''}` };
    };

    await performUpdateSteps(execAsync);

    const joined = messages.join('\n');
    expect(joined).toContain('updateFailed');
    expect(joined).toContain('Backend install failed');

    _clearWsClients();
  });

  test('performUpdateSteps restores user settings when saved', async () => {
    const serverMod = await import('../server.js');
    const { performUpdateSteps, _addWsClient, _clearWsClients } = serverMod;

    // create a user-settings.json to be restored
    const saved = { MAX_PRICE: 4, POSITION_SIZE: 25 };
    await fs.writeFile('user-settings.json', JSON.stringify(saved, null, 2));

    const messages = [];
    const fakeClient = { send: (m) => messages.push(m), readyState: 1 };
    _addWsClient(fakeClient);

    const execAsync = async (cmd) => ({ stdout: `OK: ${cmd || ''}` });

    await performUpdateSteps(execAsync);

    const joined = messages.join('\n');
    expect(joined).toContain('User settings restored');

    // config.js should exist and include MAX_PRICE setting
    expect(fsSync.existsSync('config.js')).toBe(true);
    const cfg = await fs.readFile('config.js', 'utf-8');
    expect(cfg).toContain('MAX_PRICE');

    // cleanup
    try { await fs.unlink('user-settings.json'); } catch (e) {}
    try { if (fsSync.existsSync('config.js')) await fs.unlink('config.js'); } catch (e) {}
    _clearWsClients();
  });
});
