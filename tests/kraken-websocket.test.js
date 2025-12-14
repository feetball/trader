import { jest } from '@jest/globals'

// Mock the 'ws' module to provide controllable WebSocket instances
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
    // helper to simulate events
    _emit(evt, ...args) { if (this.handlers[evt]) this.handlers[evt](...args); }
  }
  return { default: MockWS };
});

const { KrakenWebSocket } = await import('../kraken-websocket.js');
const MockWS = (await import('ws')).default;

describe('KrakenWebSocket', () => {
  beforeEach(() => {
    createdSockets = [];
    jest.clearAllTimers();
  });

  test('connect sets up websocket and ping interval and subscribes', async () => {
    jest.useFakeTimers();
    const wsClient = new KrakenWebSocket();

    // Start connect (it will create a MockWS)
    const connectPromise = wsClient.connect();

    // Simulate open event
    const sock = createdSockets[0];
    expect(sock).toBeDefined();
    sock._emit('open');

    await connectPromise;
    // Advance timers only to clear the connection timeout without running ping intervals
    jest.advanceTimersByTime(10000);

    expect(wsClient.isConnected).toBe(true);

    // Subscribe while connected - should send message
    wsClient.subscribeToProducts(['BTC/USD', 'ETH/USD']);
    expect(sock.sent.length).toBeGreaterThan(0);
    expect(sock.sent[0]).toContain('subscribe');

    // cleanup
    wsClient.disconnect();
    // Fast-forward slightly to let disconnect clear intervals
    jest.advanceTimersByTime(1000);
    expect(wsClient.isConnected).toBe(false);
    jest.useRealTimers();
  });

  test('subscribe before connect stores subscriptions', () => {
    const wsClient = new KrakenWebSocket();
    wsClient.subscribeToProducts(['A/B', 'C/D']);
    expect(wsClient.subscribedProducts.has('A/B')).toBe(true);
    expect(wsClient.subscribedProducts.has('C/D')).toBe(true);
  });

  test('handleMessage ticker updates price and emits events', (done) => {
    const wsClient = new KrakenWebSocket();

    const seen = [];
    wsClient.on('ticker', (t) => {
      seen.push(t.price);
    });

    wsClient.on('priceChange', (p) => {
      // This should fire when previous price exists and change > 0.1%
      expect(p.productId).toBe('PAIR1');
      // First ticker price should be 2.5
      expect(seen[0]).toBeCloseTo(2.5);
      // The latest stored price should be 3.0
      expect(wsClient.getPrice('PAIR1')).toBeCloseTo(3.0);
      done();
    });

    // initial ticker (no previous price -> no priceChange emit)
    wsClient.handleMessage([123, { c: ['2.5', 'n'], v: ['1', '10'], o: ['1.0', '1.0'] }, 'ticker', 'PAIR1']);

    // second update with price change large enough
    wsClient.handleMessage([123, { c: ['3.0', 'n'], v: ['1', '20'], o: ['1.0', '1.0'] }, 'ticker', 'PAIR1']);
  });

  test('getPrice and hasFreshPrice behave correctly', () => {
    const wsClient = new KrakenWebSocket();
    wsClient.handleTicker('P1', { c: ['5.0', 'n'], v: ['1', '2'], o: ['5.0', '5.0'] });
    expect(wsClient.getPrice('P1')).toBeCloseTo(5.0);
    expect(wsClient.hasFreshPrice('P1')).toBe(true);
  });
});