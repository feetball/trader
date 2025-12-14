import { jest } from '@jest/globals';
import fs from 'fs';

afterEach(() => jest.restoreAllMocks());

test('performUpdateSteps logs git failure', async () => {
  jest.resetModules();
  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

  // execAsync that throws on git commands
  const execAsync = async (cmd) => {
    if (cmd.includes('git')) throw { stdout: '', stderr: 'git error' };
    return { stdout: '' };
  };

  const { performUpdateSteps } = await import('../server.js');

  await expect(performUpdateSteps(execAsync)).resolves.toBeUndefined();
  expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/Git pull failed|Git pull failed/));

  logSpy.mockRestore();
});

test('performUpdateSteps logs backend npm install failure', async () => {
  jest.resetModules();
  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

  const execAsync = async (cmd) => {
    if (cmd.includes('git')) return { stdout: '' };
    if (cmd.includes('npm install') && !cmd.includes('--include=dev')) throw new Error('npm install failed');
    return { stdout: '' };
  };

  const { performUpdateSteps } = await import('../server.js');

  await expect(performUpdateSteps(execAsync)).resolves.toBeUndefined();
  expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/Backend install failed|Backend install failed/));

  logSpy.mockRestore();
});

test('performUpdateSteps logs frontend build failure', async () => {
  jest.resetModules();
  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

  const execAsync = async (cmd) => {
    if (cmd.includes('git')) return { stdout: '' };
    if (cmd.includes('npm install --include=dev')) return { stdout: '' };
    if (cmd.includes('npm run build')) throw { stdout: '', stderr: 'build fail' };
    return { stdout: '' };
  };

  const { performUpdateSteps } = await import('../server.js');

  await expect(performUpdateSteps(execAsync)).resolves.toBeUndefined();
  expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/Frontend build failed|Frontend build failed/));

  logSpy.mockRestore();
});

import request from 'supertest';

test('POST /api/updates/apply (test mode) then confirm clears pending and writes restart flag', async () => {
  jest.resetModules();
  // cleanup files
  try { fs.unlinkSync('.update-pending'); } catch (e) {}
  try { fs.unlinkSync('.restart-bot'); } catch (e) {}

  const { app } = await import('../server.js');
  const agent = request(app);

  const applyRes = await agent.post('/api/updates/apply').send();
  expect(applyRes.status).toBe(200);
  expect(applyRes.body.success).toBe(true);

  // pending file should exist
  expect(fs.existsSync('.update-pending')).toBe(true);

  const confirmRes = await agent.post('/api/updates/confirm').send();
  expect(confirmRes.status).toBe(200);
  expect(confirmRes.body.success).toBe(true);

  // pending removed, restart flag created
  expect(fs.existsSync('.update-pending')).toBe(false);
  expect(fs.existsSync('.restart-bot')).toBe(true);

  // cleanup
  try { fs.unlinkSync('.restart-bot'); } catch (e) {}
});

test('POST /api/updates/confirm returns failure when no pending', async () => {
  jest.resetModules();
  try { fs.unlinkSync('.update-pending'); } catch (e) {}
  try { fs.unlinkSync('.restart-bot'); } catch (e) {}

  const { app } = await import('../server.js');
  const agent = request(app);

  const res = await agent.post('/api/updates/confirm').send();
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(false);
  expect(res.body.message).toMatch(/No update pending/);
});

// Test broadcastPortfolio error path by mocking fs/promises.readFile to throw
test('broadcastPortfolio handles readFile error gracefully', async () => {
  jest.resetModules();

  // mock fs/promises to throw
  await jest.unstable_mockModule('fs/promises', () => ({
    default: { readFile: async () => { throw new Error('disk fail'); } },
    readFile: async () => { throw new Error('disk fail'); }
  }));

  const { broadcastPortfolio } = await import('../server.js');

  await expect(broadcastPortfolio()).resolves.toBeUndefined();
});

// GET /api/positions/live should return [] when fetch throws
test('GET /api/positions/live handles fetch errors and returns []', async () => {
  jest.resetModules();
  const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(() => { throw new Error('net'); });

  const { app } = await import('../server.js');
  const res = await request(app).get('/api/positions/live');
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.length).toBe(0);

  fetchSpy.mockRestore();
});

// maybeSetTimeout should execute immediately in test env
test('maybeSetTimeout executes immediately in test env', async () => {
  jest.resetModules();
  const { maybeSetTimeout } = await import('../server.js');
  let called = false;
  const ret = maybeSetTimeout(() => { called = true; }, 500);
  expect(called).toBe(true);
  expect(ret).toBeNull();
});
