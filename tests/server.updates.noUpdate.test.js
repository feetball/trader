import { jest } from '@jest/globals';
import request from 'supertest';

test('GET /api/updates/check returns updateAvailable=false when versions equal', async () => {
  // stub fetch to return same version as package.json
  const orig = global.fetch;
  global.fetch = jest.fn(() => ({ ok: true, json: async () => ({ version: '0.8.45' }) }));

  const { app } = await import('../server.js');
  const res = await request(app).get('/api/updates/check');
  expect(res.status).toBe(200);
  expect(res.body.updateAvailable).toBe(false);

  global.fetch = orig;
});
