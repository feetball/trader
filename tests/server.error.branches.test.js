import { jest } from '@jest/globals';
import fsSync from 'fs';

beforeEach(() => jest.resetModules());

describe('Server error branches', () => {
  test('POST /api/settings returns error when fs write fails', async () => {
    // mock fs/promises to throw on writeFile
    const realFs = await import('fs/promises');
    await jest.unstable_mockModule('fs/promises', () => ({
      ...realFs,
      writeFile: async () => { throw new Error('disk full'); }
    }));

    const serverMod = await import('../server.js');
    const { app } = serverMod;
    const request = (await import('supertest')).default;

    const res = await request(app).post('/api/settings').send({ MAX_PRICE: 2 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBeDefined();
  });

  test('GET /api/settings returns defaults when user-settings.json malformed', async () => {
    const path = 'user-settings.json';
    // write malformed json
    try { fsSync.writeFileSync(path, '{ bad json'); } catch (e) {}

    const serverMod = await import('../server.js');
    const { app } = serverMod;
    const request = (await import('supertest')).default;

    const res = await request(app).get('/api/settings');
    expect(res.status).toBe(200);
    expect(res.body).toBeTruthy();
    // Clean up
    try { fsSync.unlinkSync(path); } catch (e) {}
  });

  test('GET /api/settings/history returns entries when file exists', async () => {
    const history = [{ savedAt: 't1', settings: { A: 1 } }, { savedAt: 't2', settings: { B: 2 } }];
    try { fsSync.writeFileSync('settings-history.json', JSON.stringify(history, null, 2)); } catch (e) {}

    const serverMod = await import('../server.js');
    const { app } = serverMod;
    const request = (await import('supertest')).default;

    const res = await request(app).get('/api/settings/history');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(history.length);

    try { fsSync.unlinkSync('settings-history.json'); } catch (e) {}
  });

  test('POST /api/positions/sell returns error when positionId missing', async () => {
    const serverMod = await import('../server.js');
    const { app } = serverMod;
    const request = (await import('supertest')).default;

    const res = await request(app).post('/api/positions/sell').send({});
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Position ID required/);
  });

  test('GET /api/updates/status returns default when no cached', async () => {
    const serverMod = await import('../server.js');
    const { app } = serverMod;
    const request = (await import('supertest')).default;

    const res = await request(app).get('/api/updates/status');
    expect(res.status).toBe(200);
    expect(res.body.updateAvailable).toBeDefined();
  });
});
