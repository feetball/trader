import { jest } from '@jest/globals';
import { CoinbaseWebSocket } from '../websocket-feed.js'

describe('CoinbaseWebSocket', () => {
  let ws

  beforeEach(() => {
    ws = new CoinbaseWebSocket()
  })

  test('handleTicker updates prices and emits events', () => {
    const msg = { type: 'ticker', product_id: 'BTC-USD', price: '100', volume_24h: '1000', open_24h: '90' }
    const priceCb = jest.fn()
    ws.on('ticker', priceCb)
    ws.handleTicker(msg)
    expect(ws.getPrice('BTC-USD')).toBe(100)
    expect(ws.getPriceData('BTC-USD')).toHaveProperty('price', 100)
    expect(priceCb).toHaveBeenCalled()
  })

  test('hasFreshPrice returns false for old data', () => {
    ws.prices.set('A', { price: 1, timestamp: Date.now() - 60000 })
    expect(ws.hasFreshPrice('A')).toBe(false)
  })

  test('getMovingProducts filters by recentChange', () => {
    ws.prices.set('A', { price: 1, recentChange: 1 })
    ws.prices.set('B', { price: 1, recentChange: 0.2 })
    const moving = ws.getMovingProducts(0.5)
    expect(moving.length).toBe(1)
    expect(moving[0].productId).toBe('A')
  })

  test('subscribe stores products when not connected', () => {
    ws.isConnected = false
    ws.subscribeToProducts(['A','B'])
    expect(ws.subscribedProducts.has('A')).toBe(true)
    expect(ws.subscribedProducts.has('B')).toBe(true)
  })

  test('disconnect clears state', () => {
    ws.prices.set('A', { price: 1 })
    ws.subscribedProducts.add('A')
    ws.disconnect()
    expect(ws.prices.size).toBe(0)
    expect(ws.subscribedProducts.size).toBe(0)
    expect(ws.isConnected).toBe(false)
  })
})