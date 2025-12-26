import { jest } from '@jest/globals';

describe('config-utils loading behavior', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test('merges user settings when user-settings.json exists', async () => {
    jest.resetModules();
    jest.unstable_mockModule('fs', () => ({
      default: {
        existsSync: jest.fn(() => true),
        readFileSync: jest.fn(() => JSON.stringify({ POSITION_SIZE: 123, EXTRA_FLAG: true }))
      }
    }));

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const { config, pickConfigSnapshot } = await import('../config-utils.js');

    // config should include overridden POSITION_SIZE
    expect(config.POSITION_SIZE).toBe(123);

    // pickConfigSnapshot should include known keys
    const snap = pickConfigSnapshot(config);
    expect(snap.POSITION_SIZE).toBe(123);

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test('falls back to defaults when fs throws', async () => {
    jest.resetModules();
    jest.unstable_mockModule('fs', () => ({
      default: {
        existsSync: () => { throw new Error('boom'); },
        readFileSync: () => '{}'
      }
    }));

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const mod = await import('../config-utils.js');

    // When the module loads it should have used defaults
    expect(mod.config.MAX_PRICE).toBeDefined();
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });
});
