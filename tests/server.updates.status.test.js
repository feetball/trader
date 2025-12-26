import { jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../server.js';

test('GET /api/updates/status returns defaults when no cached info', async () => {
  const res = await request(app).get('/api/updates/status');
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('updateAvailable');
  expect(res.body.updateAvailable).toBe(false);
});

// Simulate a manual check where remote version is same/older
test('POST /api/updates/check returns updateAvailable false when remote not newer', async () => {
  // Mock fetch to return same version
  const orig = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ version: '0.0.0' }) });

  const res = await request(app).post('/api/updates/check').send();
  expect(res.status).toBe(200);
  expect(res.body.updateAvailable).toBe(false);

  global.fetch = orig;
});
