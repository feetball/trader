import { jest } from '@jest/globals';
import { checkForUpdates } from '../server.js';

afterEach(() => jest.restoreAllMocks());

test('checkForUpdates handles non-ok response gracefully', async () => {
  const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  const orig = global.fetch;
  global.fetch = jest.fn(() => ({ ok: false, status: 500 }));

  await expect(checkForUpdates()).resolves.toBeUndefined();
  expect(errSpy).toHaveBeenCalled();

  global.fetch = orig;
  errSpy.mockRestore();
});
