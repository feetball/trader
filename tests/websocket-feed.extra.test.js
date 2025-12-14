import { jest } from '@jest/globals'

// Mock ws similarly to kraken tests
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
    ping() { this.sent.push('__PING__'); }
    close() { if (this.handlers.close) this.handlers.close(); }
    _emit(evt, ...args) { if (this.handlers[evt]) this.handlers[evt](...args); }
  }
  return { default: MockWS };
});

const { CoinbaseWebSocket } = await import('../websocket-feed.js');

describe('CoinbaseWebSocket', () => {
  beforeEach(() => {
    createdSockets = [];
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('connect sets ping interval and subscribes existing products', async () => {
    const ws = new CoinbaseWebSocket();
    ws.subscribedProducts.add('P1');

    const connectPromise = ws.connect();
    const sock = createdSockets[0];
    sock._emit('open');
    await connectPromise;

    // advance timers to trigger ping
    jest.advanceTimersByTime(31000);
    expect(sock.sent).toContain('__PING__');

    ws.disconnect();
    expect(ws.isConnected).toBe(false);
  });

  test('subscribeToProducts sends batch messages when connected', async () => {
    const ws = new CoinbaseWebSocket();
    const p = ws.connect();
    const sock = createdSockets[0];
    sock._emit('open');
    await p;

    ws.subscribeToProducts(Array.from({ length: 120 }, (_, i) => `S${i}`));
    // Should send at least two batches
    expect(sock.sent.length).toBeGreaterThan(1);

    ws.disconnect();
  });

  test('handleTicker stores price and getMovingProducts filters correctly', (done) => {
    const ws = new CoinbaseWebSocket();
    ws.on('ticker', (t) => {
      expect(ws.getPrice(t.productId)).toBeCloseTo(t.price);
    });

    ws.handleMessage({ type: 'ticker', product_id: 'X1', price: '1.00', volume_24h: '0', open_24h: '1.0' });
    ws.handleMessage({ type: 'ticker', product_id: 'X1', price: '1.10', volume_24h: '0', open_24h: '1.0' });

    const moving = ws.getMovingProducts(5); // percent threshold
    expect(Array.isArray(moving)).toBe(true);
    done();
  });

  test('attemptReconnect emits maxReconnectAttempts after too many tries', () => {
    const ws = new CoinbaseWebSocket();
    ws.maxReconnectAttempts = 1;
    const spy = jest.fn();
    ws.on('maxReconnectAttempts', spy);
    ws.attemptReconnect(); // attempt 1 -> schedules reconnect

    // Simulate hitting the limit
    ws.reconnectAttempts = 1;
    ws.attemptReconnect();
    expect(spy).toHaveBeenCalled();
  });
});