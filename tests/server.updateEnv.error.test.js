import { jest } from '@jest/globals';

afterEach(() => jest.restoreAllMocks());

test('updateEnv logs error when writeFile fails', async () => {
  jest.resetModules();
  const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  // mock fs/promises to have writeFile reject
  await jest.unstable_mockModule('fs/promises', () => ({
    default: {
      readFile: async () => '',
      writeFile: async () => { throw new Error('disk full'); }
    },
    readFile: async () => '',
    writeFile: async () => { throw new Error('disk full'); }
  }));

  const { updateEnv } = await import('../server.js');

  await expect(updateEnv('FOO', 'bar')).resolves.not.toThrow();
  expect(errSpy).toHaveBeenCalled();

  errSpy.mockRestore();
});
