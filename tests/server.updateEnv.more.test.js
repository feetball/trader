import { jest } from '@jest/globals';
import fsSync from 'fs';
import * as fs from 'fs/promises';
import { updateEnv } from '../server.js';

afterEach(() => {
  try { if (fsSync.existsSync('.env')) fsSync.unlinkSync('.env'); } catch (e) {}
});

test('updateEnv replaces existing key and preserves others', async () => {
  fsSync.writeFileSync('.env', 'KRAKEN_API_KEY=old\nOTHER=1\n');
  await updateEnv('KRAKEN_API_KEY', 'newkey');
  const content = await fs.readFile('.env', 'utf-8');
  expect(content).toContain('KRAKEN_API_KEY=newkey');
  expect(content).toContain('OTHER=1');
});

test('updateEnv appends key when missing', async () => {
  try { fsSync.unlinkSync('.env'); } catch (e) {}
  await updateEnv('FOO', 'bar');
  const content = await fs.readFile('.env', 'utf-8');
  expect(content).toContain('FOO=bar');
});
