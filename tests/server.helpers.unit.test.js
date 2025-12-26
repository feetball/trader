import { jest } from '@jest/globals';
import fs from 'fs';

afterEach(() => jest.restoreAllMocks());

test('readSettingsHistory returns array from disk', async () => {
  jest.resetModules();
  const { readSettingsHistory } = await import('../server.js');
  const data = [{ savedAt: 't1' }];
  fs.writeFileSync('settings-history.json', JSON.stringify(data, null, 2));

  const res = await readSettingsHistory();
  expect(Array.isArray(res)).toBe(true);
  expect(res.length).toBeGreaterThan(0);

  fs.unlinkSync('settings-history.json');
});

test('writeSettingsHistory trims to last 50 entries', async () => {
  jest.resetModules();
  const { writeSettingsHistory } = await import('../server.js');
  const many = Array.from({ length: 60 }, (_, i) => ({ i }));
  await writeSettingsHistory(many);
  const file = JSON.parse(fs.readFileSync('settings-history.json', 'utf-8'));
  expect(file.length).toBe(50);
  fs.unlinkSync('settings-history.json');
});

test('updateApiRate updates apiRate based on apiCalls', async () => {
  jest.resetModules();
  const { updateApiRate, botStatus } = await import('../server.js');
  botStatus.apiCalls = 5;
  // call updateApiRate directly
  updateApiRate();
  expect(botStatus.apiRate).toBeGreaterThanOrEqual(0);
});

test('addLog appends message and trims > MAX_LOGS', async () => {
  jest.resetModules();
  const { addLog, botStatus } = await import('../server.js');

  // add several logs
  for (let i = 0; i < 10; i++) addLog(`m${i}`);
  expect(botStatus.logs.length).toBeGreaterThanOrEqual(10);

  // simulate many logs to force trimming
  for (let i = 0; i < 600; i++) addLog(`x${i}`);
  expect(botStatus.logs.length).toBeLessThanOrEqual(500);
});

test('updateLog writes to console', async () => {
  jest.resetModules();
  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  const { updateLog } = await import('../server.js');
  updateLog('hello');
  expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('hello'));
  logSpy.mockRestore();
});