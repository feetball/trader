import { jest } from '@jest/globals';
import { KrakenWebSocket } from '../kraken-websocket.js';

afterEach(() => jest.restoreAllMocks());

test('subscribeToProducts stores subscriptions when disconnected', () => {
  const k = new KrakenWebSocket();
  k.subscribeToProducts(['P1', 'P2']);
  expect(k.subscribedProducts.has('P1')).toBe(true);
  expect(k.subscribedProducts.has('P2')).toBe(true);
});

test('subscribeToProducts sends batched subscribe messages when connected', () => {
  const k = new KrakenWebSocket();
  const send = jest.fn();
  k.ws = { send };
  k.isConnected = true;

  // make 120 products to force batching
  const products = Array.from({ length: 120 }, (_, i) => `P${i}`);
  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

  k.subscribeToProducts(products);

  // Expect multiple send calls (batch size 50 -> 3 batches)
  expect(send).toHaveBeenCalled();
  expect(logSpy).toHaveBeenCalledWith('[WS] Subscribed to 120 products');
});

test('handleTicker emits ticker and priceChange appropriately', () => {
  const k = new KrakenWebSocket();
  const tSpy = jest.fn();
  const pSpy = jest.fn();
  k.on('ticker', tSpy);
  k.on('priceChange', pSpy);

  // Initial ticker sets price but change percent is 0 (no priceChange emitted)
  k.handleTicker('PAIR', { c: ['10', '0'], v: ['0', '100'], o: ['9', '9'] });
  expect(tSpy).toHaveBeenCalledTimes(1);
  expect(pSpy).toHaveBeenCalledTimes(0);

  // New ticker with larger price causes priceChange event
  k.handleTicker('PAIR', { c: ['11', '0'], v: ['0', '120'], o: ['9', '9'] });
  expect(tSpy).toHaveBeenCalledTimes(2);
  expect(pSpy).toHaveBeenCalledTimes(1);

  // getPrice and getPriceData
  expect(k.getPrice('PAIR')).toBeCloseTo(11);
  const data = k.getPriceData('PAIR');
  expect(data).toHaveProperty('price');
});

test('hasFreshPrice returns expected boolean', () => {
  const k = new KrakenWebSocket();
  k.handleTicker('PAIR2', { c: ['5', '0'], v: ['0', '10'], o: ['4', '4'] });
  expect(k.hasFreshPrice('PAIR2')).toBe(true);

  // make timestamp old
  const d = k.getPriceData('PAIR2');
  d.timestamp = Date.now() - 60000; // 60s old
  expect(k.hasFreshPrice('PAIR2')).toBe(false);
});

test('attemptReconnect increments and calls connect when below limit', () => {
  jest.useFakeTimers();
  const k = new KrakenWebSocket();
  k.connect = jest.fn().mockRejectedValue(new Error('no')); // avoid actual connect
  k.reconnectDelay = 5;
  k.maxReconnectAttempts = 3;
  k.reconnectAttempts = 0;

  k.attemptReconnect();
  expect(k.reconnectAttempts).toBe(1);

  // run timer to invoke connect
  jest.runOnlyPendingTimers();
  expect(k.connect).toHaveBeenCalled();
  jest.useRealTimers();
});

test('attemptReconnect does nothing when at max attempts', () => {
  const k = new KrakenWebSocket();
  k.reconnectAttempts = 3;
  k.maxReconnectAttempts = 3;
  k.connect = jest.fn();
  k.attemptReconnect();
  expect(k.connect).not.toHaveBeenCalled();
});

test('clearPingInterval and disconnect clear resources', () => {
  jest.useFakeTimers();
  const k = new KrakenWebSocket();
  const send = jest.fn();
  k.ws = { send, close: jest.fn() };
  k.isConnected = true;
  k.pingInterval = setInterval(() => {}, 1000);
  k.subscribedProducts.add('P1');
  k.prices.set('P1', { price: 1, timestamp: Date.now() });

  k.clearPingInterval();
  expect(k.pingInterval).toBeNull();

  k.disconnect();
  expect(k.ws).toBeNull();
  expect(k.isConnected).toBe(false);
  expect(k.prices.size).toBe(0);
  expect(k.subscribedProducts.size).toBe(0);

  jest.useRealTimers();
});
