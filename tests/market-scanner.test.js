import { jest } from '@jest/globals';
import { MarketScanner } from '../market-scanner.js'
import { config } from '../config-utils.js'

function makeMockClient() {
  return {
    getProducts: jest.fn(),
    getProductStats: jest.fn(),
    getCandles: jest.fn(),
  }
}

function makeMockWs() {
  return {
    connect: jest.fn(() => Promise.resolve()),
    subscribeToProducts: jest.fn(),
    on: jest.fn(),
    getPriceData: jest.fn(),
    hasFreshPrice: jest.fn(),
    getPrice: jest.fn(),
    disconnect: jest.fn(),
  }
}

describe('MarketScanner', () => {
  let client, ws, scanner

  beforeEach(() => {
    client = makeMockClient()
    ws = makeMockWs()
    scanner = new MarketScanner(client, ws)
    // avoid long sleeps in tests
    scanner.sleep = jest.fn(() => Promise.resolve())
    // reset config to sane defaults
    config.MAX_PRICE = 1
    config.MIN_VOLUME = 100
    config.MOMENTUM_WINDOW = 10
    config.MOMENTUM_THRESHOLD = 0.5
    config.RSI_FILTER = false
  })

  test('getProducts filters USD online products', async () => {
    client.getProducts.mockResolvedValue([
      { product_id: 'A', quote_currency_id: 'USD', status: 'online' },
      { product_id: 'B', quote_currency_id: 'BTC', status: 'online' },
      { product_id: 'C', quote_currency_id: 'USD', status: 'offline' }
    ])

    const products = await scanner.getProducts()
    expect(products).toHaveLength(1)
    expect(products[0].product_id).toBe('A')
  })

  test('getCachedStats caches results', async () => {
    client.getProductStats.mockResolvedValue({ last: 0.5 })
    const a = await scanner.getCachedStats('A')
    expect(a.last).toBe(0.5)
    client.getProductStats.mockResolvedValue({ last: 0.7 })
    const b = await scanner.getCachedStats('A')
    // should return cached value (still 0.5)
    expect(b.last).toBe(0.5)
    expect(client.getProductStats).toHaveBeenCalledTimes(1)
  })

  test('getSubDollarProducts returns products meeting price and volume', async () => {
    client.getProducts.mockResolvedValue([
      { product_id: 'P1', base_currency_id: 'COIN1', quote_currency_id: 'USD', status: 'online' },
      { product_id: 'P2', base_currency_id: 'COIN2', quote_currency_id: 'USD', status: 'online' }
    ])

    client.getProductStats.mockImplementation(async (id) => {
      if (id === 'P1') return { last: 0.8, volume: 200 }
      if (id === 'P2') return { last: 2, volume: 5000 }
      return null
    })

    const list = await scanner.getSubDollarProducts()
    expect(list).toHaveLength(1)
    expect(list[0].productId).toBe('P1')
  })

  test('calculateMomentum returns null when not enough candles', async () => {
    client.getCandles.mockResolvedValue([])
    const res = await scanner.calculateMomentum('P1', 0.5)
    expect(res).toBeNull()
  })

  test('calculateMomentum returns metrics for valid candles', async () => {
    // construct 10 candles
    const candles = []
    for (let i = 0; i < 10; i++) {
      candles.push({ high: (1 + i*0.01).toString(), low: (0.9 + i*0.01).toString(), close: (0.95 + i*0.01).toString(), volume: (100 + i).toString() })
    }
    client.getCandles.mockResolvedValue(candles)
    const res = await scanner.calculateMomentum('P1', 1.0)
    expect(res).toBeTruthy()
    expect(typeof res.score).toBe('number')
    expect(res.rsi === null || typeof res.rsi === 'number').toBe(true)
  })

  test('scanMarkets uses websocket prices when available', async () => {
    // stub subDollarProducts
    scanner.getSubDollarProducts = jest.fn().mockResolvedValue([
      { productId: 'P1', symbol: 'C1', baseVolume: 200 },
      { productId: 'P2', symbol: 'C2', baseVolume: 300 }
    ])

    // wsConnected should be true to skip init
    scanner.wsConnected = true

    ws.getPriceData.mockImplementation((pid) => {
      if (pid === 'P1') return { price: 0.5, priceChange24h: 1 }
      return null
    })

    // calculateMomentum will be called - mock it
    scanner.calculateMomentum = jest.fn().mockResolvedValueOnce({ score: 1, rsi: 50, volumeSurge: { isSurge: false }, priceAction: { favorable: true } })
      .mockResolvedValueOnce(null)

    const opps = await scanner.scanMarkets()
    expect(opps.length).toBe(1)
    expect(opps[0].productId).toBe('P1')
  })

  test('getCurrentPrice uses ws when fresh', async () => {
    scanner.wsConnected = true
    ws.hasFreshPrice.mockReturnValue(true)
    ws.getPrice.mockReturnValue(0.45)
    const p = await scanner.getCurrentPrice('P1')
    expect(p).toBe(0.45)
  })

  test('checkEntrySignal returns signal when momentum meets threshold', async () => {
    scanner.getCurrentPrice = jest.fn().mockResolvedValue(0.5)
    scanner.calculateMomentum = jest.fn().mockResolvedValue({ score: 1 })
    const sig = await scanner.checkEntrySignal('P1')
    expect(sig).toHaveProperty('productId', 'P1')
    expect(sig).toHaveProperty('price', 0.5)
  })

  test('clearCache empties caches and lastFullScan', () => {
    scanner.cachedProducts = [1]
    scanner.statsCache.set('a', { stats: {}, time: Date.now() })
    scanner.subDollarProducts = [1]
    scanner.lastFullScan = Date.now()
    scanner.clearCache()
    expect(scanner.cachedProducts.length).toBe(0)
    expect(scanner.statsCache.size).toBe(0)
    expect(scanner.subDollarProducts.length).toBe(0)
    expect(scanner.lastFullScan).toBe(0)
  })

  test('disconnect calls ws.disconnect', () => {
    scanner.disconnect()
    expect(ws.disconnect).toHaveBeenCalled()
    expect(scanner.wsConnected).toBe(false)
  })

  test('scanMarkets falls back to REST when websocket not connected', async () => {
    scanner.wsConnected = false
    // Avoid calling getProducts/getSubDollarProducts internals
    scanner.getSubDollarProducts = jest.fn().mockResolvedValue([])

    const spy = jest.spyOn(scanner, 'scanMarketsREST').mockResolvedValue([{ productId: 'P1' }])
    const res = await scanner.scanMarkets()
    expect(spy).toHaveBeenCalled()
    expect(res).toEqual([{ productId: 'P1' }])
    spy.mockRestore()
  })

  test('quickScan finds moving coins from websocket', async () => {
    scanner.initWebSocket = jest.fn().mockResolvedValue()
    scanner.wsConnected = true
    scanner.getSubDollarProducts = jest.fn().mockResolvedValue([
      { productId: 'P1', symbol: 'C1', baseVolume: 500 },
      { productId: 'P2', symbol: 'C2', baseVolume: 100 }
    ])

    ws.getPriceData.mockImplementation((pid) => {
      if (pid === 'P1') return { price: 0.5, recentChange: 1 }
      return null
    })

    scanner.calculateMomentum = jest.fn().mockResolvedValue({ score: 2 })

    const opps = await scanner.quickScan()
    expect(Array.isArray(opps)).toBe(true)
    expect(opps.length).toBe(1)
    expect(opps[0].productId).toBe('P1')
  })

  test('quickScanREST samples products and uses momentum', async () => {
    // Make getProducts return several items
    client.getProducts.mockResolvedValue([
      { product_id: 'P1', base_currency_id: 'C1' },
      { product_id: 'P2', base_currency_id: 'C2' },
      { product_id: 'P3', base_currency_id: 'C3' }
    ])

    // getCachedStats returns a cheap price
    client.getProductStats.mockResolvedValue({ last: 0.5, volume: 200, priceChangePercent: 1 })

    // stub calculateMomentum to return qualifying momentum
    const scanner2 = new (await import('../market-scanner.js')).MarketScanner(client, ws)
    scanner2.calculateMomentum = jest.fn().mockResolvedValue({ score: 2 })
    scanner2.sleep = jest.fn().mockResolvedValue()

    const res = await scanner2.quickScanREST()
    expect(Array.isArray(res)).toBe(true)
  })

  test('scanMarketsREST returns opportunities when momentum meets threshold', async () => {
    const scanner2 = new (await import('../market-scanner.js')).MarketScanner(client, ws)
    scanner2.getSubDollarProducts = jest.fn().mockResolvedValue([
      { productId: 'P1', symbol: 'C1', baseVolume: 200 }
    ])
    scanner2.getCachedStats = jest.fn().mockResolvedValue({ last: 0.5, volume: 200, priceChangePercent: 0 })
    scanner2.calculateMomentum = jest.fn().mockResolvedValue({ score: 2, volatility: 0 })
    scanner2.sleep = jest.fn().mockResolvedValue()

    const res = await scanner2.scanMarketsREST()
    expect(Array.isArray(res)).toBe(true)
    expect(res.length).toBe(1)
  })

  test('scanMarkets skips coins for RSI filter and volume surge filter', async () => {
    const scanner2 = new (await import('../market-scanner.js')).MarketScanner(client, ws)
    scanner2.getSubDollarProducts = jest.fn().mockResolvedValue([
      { productId: 'P1', symbol: 'C1', baseVolume: 200 }
    ])
    scanner2.getCachedStats = jest.fn().mockResolvedValue({ last: 0.5, volume: 200, priceChangePercent: 0 })
    // momentum with low rsi
    scanner2.calculateMomentum = jest.fn().mockResolvedValue({ score: 2, rsi: 10, volumeSurge: { ratio: 1.0, isSurge: false } })
    scanner2.sleep = jest.fn().mockResolvedValue()

    // Enable RSI filter with min > rsi to force skip
    const mod = await import('../config-utils.js')
    mod.config.RSI_FILTER = true
    mod.config.RSI_MIN = 20

    let res = await scanner2.scanMarketsREST()
    expect(res.length).toBe(0)

    // Now test volume surge filter blocks too-small surges
    mod.config.RSI_FILTER = false
    mod.config.VOLUME_SURGE_FILTER = true
    mod.config.VOLUME_SURGE_THRESHOLD = 200

    scanner2.calculateMomentum = jest.fn().mockResolvedValue({ score: 2, rsi: 50, volumeSurge: { ratio: 1.2, isSurge: true } })
    res = await scanner2.scanMarketsREST()
    expect(res.length).toBe(0)

    // Cleanup
    mod.config.VOLUME_SURGE_FILTER = false
  })

  test('calculateMomentum applies RSI penalty and volume surge bonus', async () => {
    // Mock indicators module for this test (ESM-safe)
    jest.resetModules()
    await jest.unstable_mockModule('../indicators.js', () => ({
      calculateRSI: () => 80,
      detectVolumeSurge: () => ({ isSurge: true, ratio: 2.5 }),
      checkPriceAction: () => ({ favorable: false }),
      scoreTrade: () => ({})
    }))

    // Create candles to allow computation
    const candles = []
    for (let i = 0; i < 10; i++) {
      candles.push({ high: (1 + i*0.01).toString(), low: (0.9 + i*0.01).toString(), close: (0.95 + i*0.01).toString(), volume: (100 + i).toString() })
    }
    client.getCandles.mockResolvedValue(candles)

    const scanner2 = new (await import('../market-scanner.js')).MarketScanner(client, ws)
    const res = await scanner2.calculateMomentum('P1', 1.0)
    expect(res).toBeTruthy()
    expect(res.rsi).toBe(80)
    expect(res.volumeSurge.isSurge).toBe(true)
    expect(typeof res.score).toBe('number')
  })
})
