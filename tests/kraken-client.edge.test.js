import { jest } from '@jest/globals';
import { KrakenClient } from '../kraken-client.js'

describe('KrakenClient edge cases', () => {
  test('privateRequest throws when credentials missing', async () => {
    delete process.env.KRAKEN_API_KEY
    delete process.env.KRAKEN_API_SECRET
    const client = new KrakenClient()
    await expect(client.privateRequest('Balance')).rejects.toThrow('Kraken API credentials missing')
  })

  test('publicRequest throws on non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 })
    const client = new KrakenClient()
    await expect(client.publicRequest('Ticker')).rejects.toThrow()
  })
})