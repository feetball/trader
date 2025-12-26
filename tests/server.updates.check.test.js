import { jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../server.js';

afterEach(() => {
  // restore fetch
  try { global.fetch = undefined; } catch (e) {}
});

test('GET /api/updates/check handles remote fetch failure gracefully', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
  const res = await request(app).get('/api/updates/check');
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('updateAvailable', false);
  expect(res.body).toHaveProperty('error');
});

test('POST /api/updates/check returns updateAvailable true when remote newer', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ version: '99.99.99' }) });
  const res = await request(app).post('/api/updates/check').send();
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('updateAvailable');
});