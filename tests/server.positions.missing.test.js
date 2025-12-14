import request from 'supertest';
import { app } from '../server.js';

test('POST /api/positions/sell without positionId returns error', async () => {
  const res = await request(app).post('/api/positions/sell').send({});
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(false);
  expect(res.body.message).toMatch(/Position ID required/);
});
