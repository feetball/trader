import { jest } from '@jest/globals';
import { KrakenClient } from '../kraken-client.js'

describe('KrakenClient API wrapper', () => {
  let client

  beforeEach(() => {
    client = new KrakenClient()
    global.fetch = jest.fn()
    process.env.KRAKEN_API_KEY = 'key'
    process.env.KRAKEN_API_SECRET = 'c2VjcmV0' // 'secret' base64
  })

  test('getSignature returns a string', () => {
    const sig = client.getSignature('/0/private/Balance', { nonce: '1' }, 'c2VjcmV0', '1')
    expect(typeof sig).toBe('string')
    expect(sig.length).toBeGreaterThan(0)
  })

  test('publicRequest returns result on success', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({ result: { foo: 'bar' } }) })
    const res = await client.publicRequest('AssetPairs')
    expect(res).toHaveProperty('foo')
  })

  test('getProducts maps kraken response', async () => {
    const fake = { 'XXBTZUSD': { wsname: 'XBT/USD', base: 'XXBT', quote: 'ZUSD' } }
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({ result: fake }) })
    const products = await client.getProducts()
    expect(products.find(p => p.product_id === 'XBT/USD')).toBeTruthy()
  })

  test('getCurrentPrice parses ticker', async () => {
    const ticker = { result: { XXBTZUSD: { c: ['50000.00', '10'] } } }
    global.fetch.mockResolvedValue({ ok: true, json: async () => ticker })
    const price = await client.getCurrentPrice('XXBTZUSD')
    expect(price).toBe(50000.00)
  })

  test('getCandles maps ohlc', async () => {
    const ohlc = { result: { XXBTZUSD: [ [1600000000, '1','1.2','0.9','1.1','1.05','100','10'], [1600000300, '1.1','1.3','1.0','1.2','1.15','200','12'] ] } }
    global.fetch.mockResolvedValue({ ok: true, json: async () => ohlc })
    const candles = await client.getCandles('XXBTZUSD', 300, 2)
    expect(candles).toHaveLength(2)
    expect(candles[0]).toHaveProperty('start')
    expect(candles[0]).toHaveProperty('open')
  })

  test('marketBuy calls privateRequest with volume calculated', async () => {
    // stub getCurrentPrice and privateRequest
    client.getCurrentPrice = jest.fn().mockResolvedValue(2)
    client.privateRequest = jest.fn().mockResolvedValue({ txid: '123' })
    const res = await client.marketBuy('XXBTZUSD', 100)
    expect(client.getCurrentPrice).toHaveBeenCalled()
    expect(client.privateRequest).toHaveBeenCalledWith('AddOrder', expect.objectContaining({ type: 'buy' }))
    expect(res).toHaveProperty('txid')
  })

  test('marketSell calls privateRequest', async () => {
    client.privateRequest = jest.fn().mockResolvedValue({ txid: 'sell' })
    const res = await client.marketSell('XXBTZUSD', '0.5')
    expect(client.privateRequest).toHaveBeenCalledWith('AddOrder', expect.objectContaining({ type: 'sell' }))
    expect(res).toHaveProperty('txid')
  })

  test('getAccounts maps balances', async () => {
    const bal = { result: { ZUSD: '100.5', XXBT: '0.01' } }
    global.fetch.mockResolvedValue({ ok: true, json: async () => bal })
    // privateRequest uses fetch - call getAccounts which calls privateRequest
    client.privateRequest = jest.fn().mockResolvedValue(bal.result)
    const acc = await client.getAccounts()
    expect(acc.find(a => a.currency === 'ZUSD').available).toBeCloseTo(100.5)
  })
})