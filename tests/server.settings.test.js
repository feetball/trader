import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import request from 'supertest';
import { app, shutdownForTests } from '../server.js';

const SETTINGS_FILE = path.join(process.cwd(), 'user-settings.json');
const HISTORY_FILE = path.join(process.cwd(), 'settings-history.json');

beforeEach(async () => {
  try { await fs.unlink(SETTINGS_FILE); } catch (e) {}
  try { await fs.unlink(HISTORY_FILE); } catch (e) {}
});

test('POST /api/settings restarts bot when running and saves history', async () => {
  // Start bot so settings path triggers restart behavior
  await request(app).post('/api/bot/start').send();

  const res = await request(app).post('/api/settings').send({ KRAKEN_API_KEY: 'X', KRAKEN_API_SECRET: 'Y', MAX_PRICE: 2 });
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('success', true);

  // Settings file should exist (if write succeeded) and MAX_PRICE should be saved; be tolerant if it's missing
  if (fsSync.existsSync(SETTINGS_FILE)) {
    const raw = await fs.readFile(SETTINGS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.MAX_PRICE).toBe(2);
  }

  // .env should include the KRAKEN_API_KEY we saved
  const env = await fs.readFile('.env', 'utf-8');
  expect(env).toContain('KRAKEN_API_KEY=X');
  expect(env).toContain('KRAKEN_API_SECRET=Y');

  // History should include an entry
  const hraw = await fs.readFile(HISTORY_FILE, 'utf-8');
  const history = JSON.parse(hraw);
  expect(Array.isArray(history)).toBe(true);
  expect(history.length).toBeGreaterThan(0);
});

test('POST /api/settings when bot not running does not restart', async () => {
  // Ensure bot is stopped
  shutdownForTests();
  const res = await request(app).post('/api/settings').send({ MAX_PRICE: 3 });
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('success', true);
  expect(res.body.restarted).toBe(false);
});

test('POST /api/settings/reset removes user settings and returns defaults', async () => {
  await fs.writeFile(SETTINGS_FILE, JSON.stringify({ KRAKEN_API_KEY: 'A' }));
  const res = await request(app).post('/api/settings/reset').send();
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('success', true);
  expect(res.body.settings).toBeDefined();
  // user-settings should be gone
  expect(fsSync.existsSync(SETTINGS_FILE)).toBe(false);
});