import { jest } from '@jest/globals';
import fsSync from 'fs';
import * as fs from 'fs/promises';

import request from 'supertest';

// Ensure reset picks up fallback when default parsing fails

afterEach(() => jest.restoreAllMocks());

test('POST /api/settings/reset falls back to default when parsing fails', async () => {
  // write a config.default.js with no match
  const orig = fsSync.readFileSync;
  jest.spyOn(fsSync, 'readFileSync').mockImplementation((p) => {
    if (p.endsWith('config.default.js')) return 'no defaults here';
    return orig(p, 'utf-8');
  });

  const { app } = await import('../server.js');
  const res = await request(app).post('/api/settings/reset').send();
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
});
