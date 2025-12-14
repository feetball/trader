import { jest } from '@jest/globals';
import fsSync from 'fs';
import fs from 'fs/promises';

beforeEach(() => jest.resetModules());

test('updateEnv creates .env when missing and updates existing keys', async () => {
  const serverMod = await import('../server.js');
  const { updateEnv } = serverMod;

  // ensure .env removed
  try { fsSync.unlinkSync('.env'); } catch (e) {}

  await updateEnv('TEST_KEY', '1');
  let content = await fs.readFile('.env', 'utf-8');
  expect(content).toContain('TEST_KEY=1');

  // update same key
  await updateEnv('TEST_KEY', '2');
  content = await fs.readFile('.env', 'utf-8');
  expect(content).toContain('TEST_KEY=2');

  // cleanup
  try { fsSync.unlinkSync('.env'); } catch (e) {}
});
