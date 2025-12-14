import { jest } from '@jest/globals';

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

describe('CoinbaseWebSocket branches', () => {
  beforeEach(() => {
    createdSockets = [];
    jest.clearAllMocks();
  });

  test('attemptReconnect emits maxReconnectAttempts and logs when exceeded', () => {
    const ws = new CoinbaseWebSocket();
    ws.reconnectAttempts = ws.maxReconnectAttempts;
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    let emitted = false;
    ws.on('maxReconnectAttempts', () => { emitted = true; });

    ws.attemptReconnect();

    expect(errSpy).toHaveBeenCalled();
    expect(emitted).toBe(true);

    errSpy.mockRestore();
  });

  test('getMovingProducts returns products over threshold and is sorted', () => {
    const ws = new CoinbaseWebSocket();

    // seed prices with recentChange values
    const now = Date.now();
    ws.prices.set('BIG', { price: 1, recentChange: 5, timestamp: now });
    ws.prices.set('SMALL', { price: 1, recentChange: 0.1, timestamp: now });

    const moving = ws.getMovingProducts(0.5);
    expect(moving.some(m => m.productId === 'BIG')).toBe(true);
    expect(moving.some(m => m.productId === 'SMALL')).toBe(false);
    // single item and sorted
    expect(moving.length).toBe(1);
  });

  test('getAllPrices returns a copy of internal map', () => {
    const ws = new CoinbaseWebSocket();
    ws.prices.set('X', { price: 2 });

    const copy = ws.getAllPrices();
    expect(copy instanceof Map).toBe(true);
    expect(copy.get('X').price).toBe(2);

    // mutating copy doesn't affect original
    copy.set('Y', { price: 3 });
    expect(ws.prices.has('Y')).toBe(false);
  });
});
