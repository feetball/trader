import { jest } from '@jest/globals';
import { CoinbaseWebSocket } from '../websocket-feed.js'

describe('CoinbaseWebSocket intervals and reconnect', () => {
  test('clearPingInterval clears interval', () => {
    const ws = new CoinbaseWebSocket()
    ws.pingInterval = setInterval(() => {}, 1000)
    ws.clearPingInterval()
    expect(ws.pingInterval).toBeNull()
  })

  test('attemptReconnect emits maxReconnectAttempts when limit reached', (done) => {
    const ws = new CoinbaseWebSocket()
    ws.reconnectAttempts = ws.maxReconnectAttempts
    ws.on('maxReconnectAttempts', () => done())
    ws.attemptReconnect()
  })
})