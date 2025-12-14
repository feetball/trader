import { jest } from '@jest/globals';
import { CoinbaseClient } from '../coinbase-client.js'

describe('CoinbaseClient', () => {
  let client

  beforeEach(() => {
    client = new CoinbaseClient()
    global.fetch = jest.fn()
    CoinbaseClient.resetApiCallCount()
  })

  test('getProducts maps response', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => ([{ id: 'BTC-USD', base_currency: 'BTC', quote_currency: 'USD', status: 'online', post_only: false }]) })
    const prods = await client.getProducts()
    expect(prods[0].product_id).toBe('BTC-USD')
    expect(CoinbaseClient.getApiCallCount()).toBe(1)
  })

  test('getCurrentPrice parses ticker', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({ price: '123.45' }) })
    const p = await client.getCurrentPrice('BTC-USD')
    expect(p).toBeCloseTo(123.45)
    expect(CoinbaseClient.getApiCallCount()).toBe(1)
  })

  test('getProductStats parses stats', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({ open: '100', last: '110', volume: '1000', low: '90', high: '120' }) })
    const s = await client.getProductStats('BTC-USD')
    expect(s.last).toBe(110)
    expect(CoinbaseClient.getApiCallCount()).toBe(1)
  })

  test('getCandles caches results', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => ([[1,2,3,4,5,6]]) })
    const c1 = await client.getCandles('BTC-USD', 300, 1)
    const c2 = await client.getCandles('BTC-USD', 300, 1)
    expect(c1).toHaveLength(1)
    expect(c2).toHaveLength(1)
    expect(CoinbaseClient.getApiCallCount()).toBe(1) // cached should prevent second API call
  })

  test('marketBuy/marketSell throw errors for real trading', async () => {
    await expect(client.marketBuy('BTC-USD', 100)).rejects.toThrow()
    await expect(client.marketSell('BTC-USD', 0.1)).rejects.toThrow()
  })
})