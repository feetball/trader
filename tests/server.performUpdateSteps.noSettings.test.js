import { jest } from '@jest/globals';
import fsSync from 'fs';
import * as fs from 'fs/promises';
import { performUpdateSteps } from '../server.js';

afterEach(() => jest.restoreAllMocks());

test('performUpdateSteps succeeds when no saved settings exist', async () => {
  // ensure user-settings.json does not exist
  jest.spyOn(fsSync, 'existsSync').mockImplementation((p) => {
    if (p.endsWith('user-settings.json')) return false;
    return fsSync.existsSync(p);
  });

  const execAsync = jest.fn(async (cmd) => ({ stdout: 'ok' }));

  const result = await performUpdateSteps(execAsync);
  expect(result).toHaveProperty('timestamp');
});
