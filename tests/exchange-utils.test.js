import { mapProductIdToKrakenPair } from '../exchange-utils.js';

test('maps Coinbase BTC-USD to Kraken XBTUSD', () => {
  expect(mapProductIdToKrakenPair('BTC-USD')).toBe('XBTUSD');
});

test('maps lowercase and spaces to normalized pair', () => {
  expect(mapProductIdToKrakenPair(' eth - usd ')).toBe('ETHUSD');
});

test('returns unchanged when already Kraken style', () => {
  expect(mapProductIdToKrakenPair('XBTUSD')).toBe('XBTUSD');
});

test('returns input if not a string', () => {
  expect(mapProductIdToKrakenPair(null)).toBe(null);
});
