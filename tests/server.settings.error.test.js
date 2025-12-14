import { jest } from '@jest/globals';
import fs from 'fs/promises';
import request from 'supertest';
import { app } from '../server.js';

afterEach(() => jest.restoreAllMocks());

test('POST /api/settings responds with error when fs.writeFile fails', async () => {
  // cause writeFile to fail to hit error branch
  const spy = jest.spyOn(fs, 'writeFile').mockRejectedValue(new Error('disk full'));

  const res = await request(app).post('/api/settings').send({ KRAKEN_API_KEY: 'k', KRAKEN_API_SECRET: 's', MAX_PRICE: 2 });
  expect(res.status).toBe(200);
  // Since server catches and returns { success: false } on error
  expect(res.body.success).toBe(false);

  spy.mockRestore();
});
