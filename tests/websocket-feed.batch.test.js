import { jest } from '@jest/globals'

jest.unstable_mockModule('ws', () => {
  class MockWS {
    constructor(url) {
      this.url = url;
      this.sent = [];
      this.handlers = {};
    }
    on(evt, cb) { this.handlers[evt] = cb; }
    send(payload) { this.sent.push(payload); }
    ping() { this.pingCalled = true; }
    close() { if (this.handlers.close) this.handlers.close(); }
    _emit(evt, ...args) { if (this.handlers[evt]) this.handlers[evt](...args); }
  }
  return { default: MockWS };
});

const { CoinbaseWebSocket } = await import('../websocket-feed.js');

describe('CoinbaseWebSocket batching and unsubscribe', () => {
  test('subscribeToProducts batches into multiple sends when >100', async () => {
    const ws = new CoinbaseWebSocket();
    const mock = { sent: [], send(payload) { this.sent.push(payload) } };
    // fake connected websocket
    ws.ws = mock;
    ws.isConnected = true;

    const products = Array.from({ length: 250 }, (_, i) => `P${i}`);
    ws.subscribeToProducts(products);

    // Should have sent 3 messages (100,100,50)
    expect(mock.sent.length).toBe(3);
    const p0 = JSON.parse(mock.sent[0]);
    expect(p0.type).toBe('subscribe');
    expect(p0.product_ids.length).toBe(100);
  });

  test('unsubscribeFromProducts sends correct unsubscribe message when connected', () => {
    const ws = new CoinbaseWebSocket();
    const mock = { sent: [], send: (payload) => mock.sent.push(payload), readyState: 1 };
    ws.ws = mock;
    ws.isConnected = true;
    ws.subscribedProducts = new Set(['A', 'B', 'C']);

    ws.unsubscribeFromProducts(['B']);

    expect(mock.sent.length).toBe(1);
    const msg = JSON.parse(mock.sent[0]);
    expect(msg.type).toBe('unsubscribe');
    expect(msg.product_ids).toContain('B');
  });
});