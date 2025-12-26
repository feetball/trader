import { jest } from '@jest/globals'

// Mock fs/promises and fs (sync) before importing server
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

const fs = (await import('fs/promises')).default;
const fsSync = (await import('fs')).default;
// Mock child_process so startBot spawn calls can be controlled
jest.unstable_mockModule('child_process', () => ({ spawn: jest.fn() }));
const server = await import('../server.js');

describe('server helper functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('updateEnv writes new file when none exists', async () => {
    fs.readFile.mockRejectedValue(new Error('no .env'));
    await server.updateEnv('TEST_KEY', 'value123');
    expect(fs.writeFile).toHaveBeenCalled();
    const written = fs.writeFile.mock.calls[0][1];
    expect(written).toContain('TEST_KEY=value123');
  });

  test('updateEnv updates existing key', async () => {
    fs.readFile.mockResolvedValue('A=1\nB=2');
    await server.updateEnv('B', '22');
    expect(fs.writeFile).toHaveBeenCalled();
    const written = fs.writeFile.mock.calls[0][1];
    expect(written).toContain('B=22');
  });

  test('maybeSetTimeout runs immediately in test env', () => {
    const called = [];
    const ret = server.maybeSetTimeout(() => called.push('ran'), 1000);
    expect(called).toContain('ran');
    expect(ret).toBeNull();
  });

  test('startApiRateInterval updates apiRate when apiCalls increase', () => {
    jest.useFakeTimers();

    // Seed botStatus
    server.app; // ensure imported
    const { startApiRateInterval } = server;
    // Set apiCalls > lastApiCallCount
    server.botStatus.apiCalls = 5;
    server.botStatus.running = true;

    startApiRateInterval();

    // Advance interval to trigger
    jest.advanceTimersByTime(2100);

    expect(server.botStatus.apiRate).toBeGreaterThanOrEqual(1);
    jest.useRealTimers();
  });

  test('startBot returns false when spawn fails', async () => {
    const child = await import('child_process');
    child.spawn.mockImplementation(() => { throw new Error('spawn fail') });
    const started = server.startBot();
    expect(started).toBe(false);
  });

  test('startBot parses stdout and stderr correctly', async () => {
    const child = await import('child_process');
    // Create fake process that captures callbacks
    const fakeProc = {
      stdout: { on: jest.fn((evt, cb) => { if (evt === 'data') fakeProc._dataCb = cb; }) },
      stderr: { on: jest.fn((evt, cb) => { if (evt === 'data') fakeProc._errCb = cb; }) },
      on: jest.fn((evt, cb) => { if (evt === 'close') fakeProc._closeCb = cb; }),
      kill: jest.fn()
    };
    child.spawn.mockReturnValue(fakeProc);

    // Start the bot
    const started = server.startBot();
    expect(started).toBe(true);

    // Simulate APICALLS line
    await fakeProc._dataCb(Buffer.from('[APICALLS] 3\n'));
    expect(server.botStatus.apiCalls).toBe(3);
    expect(server.botStatus.apiRate).toBeGreaterThanOrEqual(1);

    // Simulate STATUS line
    await fakeProc._dataCb(Buffer.from('[STATUS] All good\n'));
    expect(server.botStatus.message).toContain('All good');
    expect(server.botStatus.logs.some(l => l.message && l.message.includes('All good'))).toBe(true);

    // Simulate CYCLE line
    await fakeProc._dataCb(Buffer.from('CYCLE #7\n'));
    expect(server.botStatus.cycleCount).toBe(7);

    // Simulate stderr
    await fakeProc._errCb(Buffer.from('something broke\n'));
    expect(server.botStatus.message).toMatch(/Error/);

    // Cleanup
    server.shutdownForTests();
  });
});