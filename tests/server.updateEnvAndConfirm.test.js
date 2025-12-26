import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import request from 'supertest';
import { app, updateEnv, _clearPendingUpdate } from '../server.js';

const ENV_PATH = path.join(process.cwd(), '.env');
const PENDING_PATH = path.join(process.cwd(), '.update-pending');
const RESTART_PATH = path.join(process.cwd(), '.restart-bot');

beforeEach(async () => {
  // Clean files
  try { await fs.unlink(ENV_PATH); } catch (e) {}
  try { await fs.unlink(PENDING_PATH); } catch (e) {}
  try { if (fsSync.existsSync(RESTART_PATH)) fsSync.unlinkSync(RESTART_PATH); } catch (e) {}
});

afterEach(() => {
  _clearPendingUpdate();
});

test('updateEnv adds new key when .env missing', async () => {
  await updateEnv('TEST_KEY', '1234');
  const raw = await fs.readFile(ENV_PATH, 'utf-8');
  expect(raw).toContain('TEST_KEY=1234');
});

test('updateEnv replaces existing key', async () => {
  await fs.writeFile(ENV_PATH, 'FOO=bar\n');
  await updateEnv('FOO', 'baz');
  const raw = await fs.readFile(ENV_PATH, 'utf-8');
  expect(raw).toContain('FOO=baz');
  expect(raw.match(/FOO=/g).length).toBe(1);
});

test('POST /api/updates/apply marks pending and POST /api/updates/confirm clears and creates restart flag', async () => {
  // Ensure no pending initially
  const resApply = await request(app).post('/api/updates/apply').send();
  expect(resApply.status).toBe(200);
  expect(resApply.body).toHaveProperty('success', true);
  // .update-pending should exist
  expect(fsSync.existsSync(PENDING_PATH)).toBe(true);

  // Now confirm
  const resConfirm = await request(app).post('/api/updates/confirm').send();
  expect(resConfirm.status).toBe(200);
  expect(resConfirm.body).toHaveProperty('success', true);
  // .update-pending should be removed and .restart-bot should be created
  expect(fsSync.existsSync(PENDING_PATH)).toBe(false);
  expect(fsSync.existsSync(RESTART_PATH)).toBe(true);
});

test('POST /api/updates/confirm when no pending returns failure', async () => {
  // Ensure cleaned
  await request(app).post('/api/updates/confirm').send();
  const res = await request(app).post('/api/updates/confirm').send();
  expect(res.body).toHaveProperty('success', false);
  expect(res.body.message).toMatch(/No update pending/);
});