import { CoinbaseWebSocket } from '../websocket-feed.js';
import { jest } from '@jest/globals';

afterEach(() => jest.restoreAllMocks());

test('handleMessage logs subscriptions and error messages', () => {
  const ws = new CoinbaseWebSocket();
  const log = jest.spyOn(console, 'log').mockImplementation(() => {});
  const err = jest.spyOn(console, 'error').mockImplementation(() => {});

  ws.handleMessage({ type: 'subscriptions', channels: ['ticker', 'heartbeat'] });
  expect(log).toHaveBeenCalledWith('[WS] Active subscriptions: 2 channels');

  ws.handleMessage({ type: 'error', message: 'boom' });
  expect(err).toHaveBeenCalledWith('[WS] Error message:', 'boom');
});

test('getMovingProducts and hasFreshPrice behavior', () => {
  const ws = new CoinbaseWebSocket();
  ws.handleTicker({ product_id: 'P1', price: '10', volume_24h: '100', open_24h: '9' });
  expect(ws.hasFreshPrice('P1')).toBe(true);
  // Emit a second ticker to create a price change relative to previous
  ws.handleTicker({ product_id: 'P1', price: '11', volume_24h: '100', open_24h: '9' });
  const movers = ws.getMovingProducts(0.1);
  expect(movers.length).toBeGreaterThanOrEqual(1);
});

test('attemptReconnect logs max attempts and emits event when reached', () => {
  const ws = new CoinbaseWebSocket();
  ws.reconnectAttempts = 10;
  ws.maxReconnectAttempts = 10;
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  const emitSpy = jest.spyOn(ws, 'emit');

  ws.attemptReconnect();
  expect(spy).toHaveBeenCalledWith('[WS] Max reconnect attempts reached');
  expect(emitSpy).toHaveBeenCalledWith('maxReconnectAttempts');
});
