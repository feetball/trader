import { KrakenWebSocket } from '../kraken-websocket.js';

test('KrakenWebSocket handleTicker and events', done => {
  const k = new KrakenWebSocket();

  const events = [];
  k.on('ticker', (d) => events.push(['ticker', d]));
  k.on('priceChange', (d) => events.push(['priceChange', d]));

  // First ticker - no price change event expected
  k.handleTicker('PAIR', { c: ['1.50', '0'], v: ['0', '100'], o: ['0', '1.40'] });
  expect(k.getPrice('PAIR')).toBeCloseTo(1.5);
  expect(k.hasFreshPrice('PAIR')).toBe(true);

  // Second ticker - large change should emit priceChange
  k.handleTicker('PAIR', { c: ['1.80', '0'], v: ['0', '150'], o: ['0', '1.40'] });

  // Defer assertions to next tick to allow events to fire
  setImmediate(() => {
    const types = events.map(e => e[0]);
    expect(types).toContain('ticker');
    expect(types).toContain('priceChange');
    done();
  });
});

test('subscribeToProducts when disconnected stores subscriptions', () => {
  const k = new KrakenWebSocket();
  k.subscribeToProducts(['A', 'B']);
  expect(k.subscribedProducts.has('A')).toBe(true);
  expect(k.subscribedProducts.has('B')).toBe(true);
});