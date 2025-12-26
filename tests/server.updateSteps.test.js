import { jest } from '@jest/globals';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { performUpdateSteps, _clearPendingUpdate } from '../server.js';

const PENDING_PATH = path.join(process.cwd(), '.update-pending');
const RESTART_PATH = path.join(process.cwd(), '.restart-bot');

beforeEach(async () => {
  // Ensure clean state
  try { await fs.unlink(PENDING_PATH); } catch (e) {}
  try { if (fsSync.existsSync(RESTART_PATH)) fsSync.unlinkSync(RESTART_PATH); } catch (e) {}
});

afterEach(() => {
  _clearPendingUpdate();
});

test('performUpdateSteps aborts on git fetch failure', async () => {
  const execAsync = jest.fn().mockImplementation((cmd, opts) => {
    if (cmd.includes('git fetch')) {
      const err = new Error('git fail');
      err.stdout = 'fatal';
      throw err;
    }
    return Promise.resolve({ stdout: '' });
  });

  await expect(performUpdateSteps(execAsync)).resolves.toBeUndefined();
  // Should not have created .update-pending
  expect(fsSync.existsSync(PENDING_PATH)).toBe(false);
});

test('performUpdateSteps aborts on backend npm install failure', async () => {
  const execAsync = jest.fn().mockImplementation((cmd, opts) => {
    if (cmd.includes('npm install') && (!opts || opts.cwd === process.cwd())) {
      const err = new Error('npm fail');
      err.stdout = 'npm error';
      throw err;
    }
    return Promise.resolve({ stdout: 'ok' });
  });

  await expect(performUpdateSteps(execAsync)).resolves.toBeUndefined();
  expect(fsSync.existsSync(PENDING_PATH)).toBe(false);
});

test('performUpdateSteps completes successfully and writes .update-pending', async () => {
  const execAsync = jest.fn().mockResolvedValue({ stdout: 'ok' });

  await expect(performUpdateSteps(execAsync)).resolves.toBeDefined();

  // Should have created .update-pending
  expect(fsSync.existsSync(PENDING_PATH)).toBe(true);
  const raw = await fs.readFile(PENDING_PATH, 'utf-8');
  const parsed = JSON.parse(raw);
  expect(parsed).toHaveProperty('timestamp');
  expect(Object.prototype.hasOwnProperty.call(parsed, 'newVersion')).toBe(true);
});

test('performUpdateSteps aborts when frontend install fails', async () => {
  const execAsync = jest.fn().mockImplementation((cmd, opts) => {
    if (cmd.includes('npm install --include=dev') || (opts && opts.cwd && opts.cwd.includes('frontend') && cmd.includes('npm install'))) {
      const err = new Error('frontend npm fail');
      err.stdout = 'npm front fail';
      throw err;
    }
    return Promise.resolve({ stdout: 'ok' });
  });

  await expect(performUpdateSteps(execAsync)).resolves.toBeUndefined();
  expect(fsSync.existsSync(PENDING_PATH)).toBe(false);
});

test('performUpdateSteps aborts when frontend build fails', async () => {
  const execAsync = jest.fn().mockImplementation((cmd, opts) => {
    if (cmd.includes('npm run build')) {
      const err = new Error('build fail');
      err.stdout = 'builderr';
      throw err;
    }
    return Promise.resolve({ stdout: 'ok' });
  });

  await expect(performUpdateSteps(execAsync)).resolves.toBeUndefined();
  expect(fsSync.existsSync(PENDING_PATH)).toBe(false);
});

test('performUpdateSteps restores user settings when savedSettings exists', async () => {
  // create a user-settings.json to be saved and restored
  await fs.writeFile('user-settings.json', JSON.stringify({ TEST_SETTING: true }));

  const execAsync = jest.fn().mockResolvedValue({ stdout: 'ok' });
  await expect(performUpdateSteps(execAsync)).resolves.toBeDefined();

  // Should have written config.js (restored merged settings)
  expect(fsSync.existsSync('config.js')).toBe(true);

  // cleanup
  try { fsSync.unlinkSync('user-settings.json'); } catch (e) {}
});