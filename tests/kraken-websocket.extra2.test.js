import { jest } from '@jest/globals';

// Reuse existing ws mock pattern
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
    _emit(evt, ...args) { if (this.handlers[evt]) this.handlers[evt](...args); }
  }
  return { default: MockWS };
});

const { KrakenWebSocket } = await import('../kraken-websocket.js');
const MockWS = (await import('ws')).default;

describe('KrakenWebSocket extra branches', () => {
  beforeEach(() => {
    createdSockets = [];
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  test('handleMessage ignores heartbeat/pong/subscriptionStatus events', () => {
    const k = new KrakenWebSocket();
    expect(() => k.handleMessage({ event: 'heartbeat' })).not.toThrow();
    expect(() => k.handleMessage({ event: 'pong' })).not.toThrow();
    expect(() => k.handleMessage({ event: 'subscriptionStatus', status: 'subscribed', pair: 'X' })).not.toThrow();
  });

  test('attemptReconnect does nothing when at max attempts', () => {
    const k = new KrakenWebSocket();
    k.reconnectAttempts = k.maxReconnectAttempts;
    const spy = jest.spyOn(k, 'connect');
    k.attemptReconnect();
    expect(spy).not.toHaveBeenCalled();
  });

  test('attemptReconnect schedules a reconnect when below max', async () => {
    jest.useFakeTimers();
    const k = new KrakenWebSocket();
    k.maxReconnectAttempts = 2;
    // mock connect to avoid real WebSocket behavior
    k.connect = jest.fn().mockResolvedValue();

    expect(k.reconnectAttempts).toBe(0);
    k.attemptReconnect();
    // Should increment reconnectAttempts immediately
    expect(k.reconnectAttempts).toBe(1);

    // Advance timers by computed delay (reconnectDelay * 2^(attempt-1)) => 1000
    jest.advanceTimersByTime(1000 + 10);
    expect(k.connect).toHaveBeenCalled();
    jest.useRealTimers();
  });

  test('clearPingInterval clears interval safely', () => {
    const k = new KrakenWebSocket();
    k.pingInterval = setInterval(() => {}, 1000);
    k.clearPingInterval();
    expect(k.pingInterval).toBeNull();
  });

  test('disconnect clears state and subscriptions', () => {
    const k = new KrakenWebSocket();
    // simulate some state
    k.prices.set('P', { price: 1 });
    k.subscribedProducts.add('P');
    k.ws = { close: jest.fn() };
    k.isConnected = true;

    k.disconnect();
    expect(k.isConnected).toBe(false);
    expect(k.prices.size).toBe(0);
    expect(k.subscribedProducts.size).toBe(0);
    expect(k.ws).toBeNull();
  });
});
