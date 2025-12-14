import { jest } from '@jest/globals';

// Mock the ws module similar to other tests
let createdSockets = [];

jest.unstable_mockModule('ws', () => {
  class MockWS {
    constructor(url) {
      this.url = url;
      this.handlers = {};
      this.sent = [];
      createdSockets.push(this);
    }
    on(evt, cb) { this.handlers[evt] = cb; }
    send(payload) { this.sent.push(payload); }
    close() { if (this.handlers.close) this.handlers.close(); }
    ping() { /* noop */ }
    _emit(evt, ...args) { if (this.handlers[evt]) this.handlers[evt](...args); }
  }
  return { default: MockWS };
});

const { CoinbaseWebSocket } = await import('../websocket-feed.js');
const MockWS = (await import('ws')).default;

describe('CoinbaseWebSocket extra handlers', () => {
  beforeEach(() => {
    createdSockets = [];
    jest.clearAllMocks();
  });

  test('handleMessage handles subscriptions and error types', () => {
    const ws = new CoinbaseWebSocket();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    ws.handleMessage({ type: 'subscriptions', channels: ['ticker'] });
    expect(logSpy).toHaveBeenCalled();

    ws.handleMessage({ type: 'error', message: 'boom' });
    expect(errSpy).toHaveBeenCalled();

    logSpy.mockRestore();
    errSpy.mockRestore();
  });

  test('unsubscribeFromProducts sends unsubscribe when connected', async () => {
    jest.useFakeTimers();
    const wsClient = new CoinbaseWebSocket();
    const connectPromise = wsClient.connect();
    const sock = createdSockets[0];
    sock._emit('open');
    await connectPromise;

    // Subscribe then unsubscribe
    wsClient.subscribeToProducts(['P1']);
    expect(sock.sent.length).toBeGreaterThan(0);

    wsClient.unsubscribeFromProducts(['P1']);
    // Last sent should be unsubscribe message
    const last = JSON.parse(sock.sent[sock.sent.length - 1]);
    expect(last.type).toBe('unsubscribe');
    expect(last.product_ids).toContain('P1');

    wsClient.disconnect();
    jest.useRealTimers();
  });
});