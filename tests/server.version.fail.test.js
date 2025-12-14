import { jest } from '@jest/globals';

beforeEach(() => jest.resetModules());

test('GET /api/version returns unknown when package.json cannot be read', async () => {
  await jest.unstable_mockModule('fs/promises', () => ({ default: { readFile: async (p) => { if (p && p.endsWith('package.json')) throw new Error('not found'); return '{}' } } }));

  const serverMod = await import('../server.js');
  const { app } = serverMod;
  const request = (await import('supertest')).default;

  const res = await request(app).get('/api/version');
  expect(res.status).toBe(200);
  expect(res.body.version).toBeDefined();
});

test('GET /api/health returns 500 if package.json read fails', async () => {
  await jest.unstable_mockModule('fs/promises', () => ({ default: { readFile: async (p) => { if (p && p.endsWith('package.json')) throw new Error('nope'); return '{}' } } }));

  const serverMod = await import('../server.js');
  const { app } = serverMod;
  const request = (await import('supertest')).default;

  const res = await request(app).get('/api/health');
  expect(res.status).toBe(500);
  expect(res.body.status).toBe('error');
});
