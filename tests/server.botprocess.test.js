import { jest } from '@jest/globals';
import { EventEmitter } from 'events';

beforeEach(() => jest.resetModules());

test('startBot processes stdout/stderr and close events', async () => {
  // Mock child_process.spawn to return controllable child and expose getter
  await jest.unstable_mockModule('child_process', () => {
    let lastChild = null;
    return {
      spawn: () => {
        const child = new EventEmitter();
        child.stdout = new EventEmitter();
        child.stderr = new EventEmitter();
        child.kill = jest.fn(() => {});
        lastChild = child;
        return child;
      },
      __getLastChild: () => lastChild,
    };
  });

  const childMod = await import('child_process');
  const serverMod = await import('../server.js');
  const { app, _addWsClient, _clearWsClients } = serverMod;
  const request = (await import('supertest')).default;

  const messages = [];
  const fakeClient = { send: (m) => messages.push(m), readyState: 1 };
  _addWsClient(fakeClient);

  // start bot via API
  const startRes = await request(app).post('/api/bot/start').send();
  expect(startRes.status).toBe(200);
  expect(startRes.body.success).toBe(true);

  // get the fake child and emit stdout/stderr messages
  const child = childMod.__getLastChild();
  expect(child).toBeDefined();

  // emit stdout messages that the server parses
  child.stdout.emit('data', Buffer.from('[APICALLS] 7\n'));
  child.stdout.emit('data', Buffer.from('[STATUS] All good\n'));
  child.stdout.emit('data', Buffer.from('CYCLE #3\n'));
  child.stdout.emit('data', Buffer.from('PAPER BUY TEST\n'));

  // emit stderr
  child.stderr.emit('data', Buffer.from('some warning\n'));

  // emit close
  child.emit('close', 0);

  // Ensure the broadcasts included botStatus updates
  const joined = messages.join('\n');
  expect(joined).toContain('botStatus');
  expect(joined).toContain('All good');

  _clearWsClients();
});
