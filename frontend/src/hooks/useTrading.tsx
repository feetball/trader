'use client'

import { useState, useCallback, useEffect, useRef, createContext, useContext, ReactNode } from 'react'
import apiClient from '@/lib/api'

interface Portfolio {
  totalValue?: number
  cash?: number
  roi?: number
  positionsValue?: number
  totalProfit?: number
  totalNetProfit?: number
  totalFees?: number
  totalTrades?: number
  winRate?: number
  winningTrades?: number
  losingTrades?: number
  openPositions?: number
}

interface Position {
  id: string
  symbol: string
  entryPrice: number
  currentPrice?: number
  currentPL?: number
  currentPLPercent?: number
  investedAmount: number
  entryTime: number
  holdTime?: number
}

interface Trade {
  symbol: string
  entryPrice: number
  exitPrice: number
  quantity?: number
  investedAmount?: number
  profit: number
  netProfit?: number
  profitPercent: number
  netProfitPercent?: number
  totalFees?: number
  holdTimeMs?: number
  entryTime: number
  exitTime: number
  reason: string
}

interface CoinPerformance {
  symbol: string
  profit: number
  trades: number
  winRate: number
  wins: number
  losses: number
  avgProfit?: number
  avgHoldTime?: number
}

interface Activity {
  symbol: string
  profit: number
  profitPercent: number
  reason: string
  entryPrice?: number
  exitPrice?: number
  holdTimeMs: number
  timestamp: number
}

interface BotStatus {
  running: boolean
  message: string
  lastUpdate: number
  cycleCount: number
  apiCalls: number
  apiRate: number
  apiRateHourly: number
  logs: Array<{ timestamp: string; message: string }>
}

interface Settings {
  PAPER_TRADING: boolean
  MAX_PRICE: number
  PROFIT_TARGET: number
  MOMENTUM_THRESHOLD: number
  MOMENTUM_WINDOW: number
  SCAN_INTERVAL: number
  OPEN_POSITION_SCAN_INTERVAL: number
  POSITION_SIZE: number
  MAX_POSITIONS: number
  MIN_VOLUME: number
  STOP_LOSS: number
  ENABLE_TRAILING_PROFIT: boolean
  TRAILING_STOP_PERCENT: number
  MIN_MOMENTUM_TO_RIDE: number
  VOLUME_SURGE_FILTER: boolean
  VOLUME_SURGE_THRESHOLD: number
  RSI_FILTER: boolean
  RSI_MIN: number
  RSI_MAX: number
  MAKER_FEE_PERCENT: number
  TAKER_FEE_PERCENT: number
  TAX_PERCENT: number
}

interface SettingsHistoryEntry {
  savedAt: string
  comment?: string
  [key: string]: any
}

interface UpdatePrompt {
  visible: boolean
  newVersion: string | null
  mode?: 'available' | 'ready' | 'applying' | 'complete'
}

export interface TradingContextType {
  // State
  loading: boolean
  botLoading: boolean
  wsConnected: boolean
  lastUpdate: string
  appVersion: string
  updateLogs: string[]
  updatePrompt: UpdatePrompt
  portfolio: Portfolio
  positions: Position[]
  livePositions: Position[]
  trades: Trade[]
  coinPerformance: CoinPerformance[]
  activities: Activity[]
  botStatus: BotStatus
  settings: Settings
  settingsHistory: SettingsHistoryEntry[]
  settingsComment: string
  totalUnrealizedPL: number
  coinbaseApiStatus: 'ok' | 'rate-limited' | 'error' | 'unknown'
  
  // Functions
  setSettingsComment: (comment: string) => void
  startBot: () => Promise<void>
  stopBot: () => Promise<void>
  resetPortfolio: () => Promise<boolean>
  loadSettings: () => Promise<void>
  loadSettingsHistory: () => Promise<void>
  saveSettings: () => Promise<any>
  resetSettings: () => Promise<void>
  confirmUpdate: () => Promise<any>
  applyUpdate: () => Promise<any>
  refreshBotStatus: () => Promise<void>
  refreshData: () => Promise<void>
  refreshLivePositions: () => Promise<void>
  initialize: () => Promise<void>
  cleanup: () => void
  clearUpdateLogs: () => void
  forceSellPosition: (positionId: string) => Promise<any>
  openCoinbase: (symbol: string) => void
}

const TradingContext = createContext<TradingContextType | undefined>(undefined)

export function TradingProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false)
  const [botLoading, setBotLoading] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState('')
  const [appVersion, setAppVersion] = useState('...')
  const [updateLogs, setUpdateLogs] = useState<string[]>([])
  const [updatePrompt, setUpdatePrompt] = useState<UpdatePrompt>({ visible: false, newVersion: null, mode: undefined })

  const [portfolio, setPortfolio] = useState<Portfolio>({})
  const [positions, setPositions] = useState<Position[]>([])
  const [livePositions, setLivePositions] = useState<Position[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [coinPerformance, setCoinPerformance] = useState<CoinPerformance[]>([])
  const [activities, setActivities] = useState<Activity[]>([])

  const [botStatus, setBotStatus] = useState<BotStatus>({
    running: false,
    message: 'Bot is stopped',
    lastUpdate: Date.now(),
    cycleCount: 0,
    apiCalls: 0,
    apiRate: 0,
    apiRateHourly: 0,
    logs: [],
  })

  const [settings, setSettings] = useState<Settings>({
    PAPER_TRADING: true,
    MAX_PRICE: 1.0,
    PROFIT_TARGET: 1.5,
    MOMENTUM_THRESHOLD: 2.0,
    MOMENTUM_WINDOW: 10,
    SCAN_INTERVAL: 10,
    OPEN_POSITION_SCAN_INTERVAL: 5,
    POSITION_SIZE: 100,
    MAX_POSITIONS: 10,
    MIN_VOLUME: 50000,
    STOP_LOSS: -2.0,
    ENABLE_TRAILING_PROFIT: true,
    TRAILING_STOP_PERCENT: 0.5,
    MIN_MOMENTUM_TO_RIDE: 0.5,
    VOLUME_SURGE_FILTER: true,
    VOLUME_SURGE_THRESHOLD: 150,
    RSI_FILTER: true,
    RSI_MIN: 50,
    RSI_MAX: 70,
    MAKER_FEE_PERCENT: 0.25,
    TAKER_FEE_PERCENT: 0.5,
    TAX_PERCENT: 0,
  })

  const [settingsHistory, setSettingsHistory] = useState<SettingsHistoryEntry[]>([])
  const [settingsComment, setSettingsComment] = useState('')
  const [coinbaseApiStatus, setCoinbaseApiStatus] = useState<'ok' | 'rate-limited' | 'error' | 'unknown'>('unknown')

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const initializedRef = useRef(false)
  const updateInProgressRef = useRef(false)

  const totalUnrealizedPL = livePositions.reduce((sum, pos) => sum + (pos.currentPL || 0), 0)

  // API Functions
  const startBot = useCallback(async () => {
    setBotLoading(true)
    try {
      await apiClient.post('/bot/start')
      await refreshBotStatus()
    } catch (error) {
      console.error('Error starting bot:', error)
    } finally {
      setBotLoading(false)
    }
  }, [])

  const stopBot = useCallback(async () => {
    setBotLoading(true)
    try {
      await apiClient.post('/bot/stop')
      await refreshBotStatus()
    } catch (error) {
      console.error('Error stopping bot:', error)
    } finally {
      setBotLoading(false)
    }
  }, [])

  const resetPortfolio = useCallback(async () => {
    try {
      await apiClient.post('/portfolio/reset')
      await refreshData()
      return true
    } catch (error) {
      console.error('Error resetting portfolio:', error)
      return false
    }
  }, [])

  const loadSettingsHistory = useCallback(async () => {
    try {
      const res = await apiClient.get('/settings/history')
      setSettingsHistory(Array.isArray(res.data) ? res.data : [])
    } catch (error) {
      console.error('Error loading settings history:', error)
    }
  }, [])

  const loadSettings = useCallback(async () => {
    try {
      const [settingsRes, historyRes] = await Promise.all([
        apiClient.get('/settings'),
        apiClient.get('/settings/history'),
      ])
      setSettings(settingsRes.data)
      setSettingsHistory(Array.isArray(historyRes.data) ? historyRes.data : [])
      setSettingsComment('')
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }, [])

  const saveSettings = useCallback(async () => {
    try {
      const payload = { ...settings, settingsComment }
      const res = await apiClient.post('/settings', payload)
      await loadSettingsHistory()
      return res.data
    } catch (error) {
      console.error('Error saving settings:', error)
      throw error
    }
  }, [settings, settingsComment])

  const resetSettings = useCallback(async () => {
    try {
      const res = await apiClient.post('/settings/reset')
      if (res.data.success) {
        setSettings(res.data.settings)
        setSettingsComment('')
        await loadSettingsHistory()
      }
    } catch (error) {
      console.error('Error resetting settings:', error)
      throw error
    }
  }, [])

  const refreshBotStatus = useCallback(async () => {
    try {
      const res = await apiClient.get('/bot/status')
      setBotStatus(res.data)
    } catch (error) {
      console.error('Error fetching bot status:', error)
    }
  }, [])

  const refreshData = useCallback(async () => {
    setLoading(true)
    try {
      const [portfolioRes, positionsRes, livePositionsRes, tradesRes, performanceRes, activityRes] = await Promise.all([
        apiClient.get('/portfolio'),
        apiClient.get('/positions'),
        apiClient.get('/positions/live'),
        apiClient.get('/trades'),
        apiClient.get('/performance-by-coin'),
        apiClient.get('/activity'),
      ])

      setPortfolio(portfolioRes.data)
      setPositions(positionsRes.data)
      setLivePositions(livePositionsRes.data)
      // Limit trades client-side as well for safety
      setTrades((tradesRes.data || []).slice(-200))
      setCoinPerformance(performanceRes.data)
      setActivities(activityRes.data)
      setLastUpdate(new Date().toLocaleTimeString())

      await refreshBotStatus()
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshLivePositions = useCallback(async () => {
    try {
      const [portfolioRes, liveRes, perfRes, activityRes, tradesRes] = await Promise.all([
        apiClient.get('/portfolio'),
        apiClient.get('/positions/live'),
        apiClient.get('/performance-by-coin'),
        apiClient.get('/activity'),
        apiClient.get('/trades'),
      ])
      setPortfolio(portfolioRes.data)
      setLivePositions(liveRes.data)
      setCoinPerformance(perfRes.data)
      setActivities(activityRes.data)
      // Limit trades client-side as well for safety
      setTrades((tradesRes.data || []).slice(-200))
      setLastUpdate(new Date().toLocaleTimeString())
      // If we got data successfully, API is OK
      if (liveRes.data) {
        setCoinbaseApiStatus('ok')
      }
    } catch (e: any) {
      // Check for rate limiting or API errors
      if (e?.response?.status === 429) {
        setCoinbaseApiStatus('rate-limited')
      } else if (e?.response?.status >= 500) {
        setCoinbaseApiStatus('error')
      }
    }
  }, [])

  const confirmUpdate = useCallback(async () => {
    try {
      setUpdatePrompt({ visible: false, newVersion: null })
      const res = await apiClient.post('/updates/confirm')
      setUpdateLogs(prev => [...prev, res.data?.message || 'Requested server restart'])
      setUpdatePrompt({ visible: true, mode: 'complete', newVersion: null })
      return res.data
    } catch (err) {
      setUpdateLogs(prev => [...prev, `[UPDATE] Error confirming update: ${err instanceof Error ? err.message : 'Unknown error'}`])
      throw err
    }
  }, [])

  const applyUpdate = useCallback(async () => {
    try {
      setUpdatePrompt(prev => ({ ...prev, mode: 'applying' }))
      const res = await apiClient.post('/updates/apply')
      setUpdateLogs(prev => [...prev, res.data?.message || 'Update application started'])
      setUpdatePrompt(prev => ({ ...prev, mode: 'complete' }))
      return res.data
    } catch (err) {
      setUpdateLogs(prev => [...prev, `[UPDATE] Error applying update: ${err instanceof Error ? err.message : 'Unknown error'}`])
      setUpdatePrompt({ visible: false, newVersion: null })
      throw err
    }
  }, [])

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    const wsProtocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'ws://localhost:3001'
      : `${wsProtocol}//${window.location.host}`

    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('[WS] Connected to server')
      setWsConnected(true)

      if (updateInProgressRef.current) {
        console.log('[WS] Server is back after update, reloading page...')
        setUpdateLogs(prev => [...prev, '[UPDATE] Server is back online, reloading...'])
        setTimeout(() => {
          window.location.reload()
        }, 500)
      }
    }

    ws.onmessage = (event) => {
      try {
        const { type, data } = JSON.parse(event.data)

        if (type === 'botStatus') {
          setBotStatus(data)
          setLastUpdate(new Date().toLocaleTimeString())
          // Update Coinbase API status from bot status
          if (data.coinbaseApiStatus) {
            setCoinbaseApiStatus(data.coinbaseApiStatus)
          }
        } else if (type === 'portfolioSummary') {
          // Server-calculated portfolio summary - use directly
          setPortfolio(data)
          setLastUpdate(new Date().toLocaleTimeString())
        } else if (type === 'positions') {
          // Live positions update
          setPositions(data || [])
        } else if (type === 'trades') {
          // Recent trades update
          setTrades(data || [])
        } else if (type === 'coinbaseApiStatus') {
          setCoinbaseApiStatus(data.status || 'unknown')
        } else if (type === 'updateLog') {
          setUpdateLogs(prev => [...prev, data.message])
        } else if (type === 'updateFailed') {
          updateInProgressRef.current = false
          setUpdateLogs(prev => [...prev, `[UPDATE] ❌ Update failed: ${data.message}`])
        } else if (type === 'updateComplete' || type === 'updateReady') {
          updateInProgressRef.current = true
          const versionText = data?.newVersion ? ` (v${data.newVersion})` : ''
          setUpdateLogs(prev => [...prev, `[UPDATE] Update ready${versionText}. Waiting for user confirmation...`])
          setUpdatePrompt({ visible: true, newVersion: data?.newVersion || null, mode: 'ready' })
          setUpdateLogs(prev => [...prev, '[UPDATE] Prompting user to confirm restart...'])
        } else if (type === 'updateAvailable') {
          const versionText = data?.newVersion ? ` (v${data.newVersion})` : ''
          setUpdateLogs(prev => [...prev, `[UPDATE] New version available${versionText}!`])
          setUpdatePrompt({ visible: true, newVersion: data?.newVersion || null, mode: 'available' })
        }
      } catch (e) {
        console.error('[WS] Parse error:', e)
      }
    }

    ws.onclose = () => {
      console.log('[WS] Disconnected, reconnecting in 3s...')
      setWsConnected(false)
      const delay = updateInProgressRef.current ? 1000 : 3000
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay)
    }

    ws.onerror = (error) => {
      console.error('[WS] Error:', error)
    }

    wsRef.current = ws
  }, [])

  // Initialize function
  const initialize = useCallback(async () => {
    if (initializedRef.current) return
    initializedRef.current = true

    try {
      const res = await apiClient.get('/version')
      setAppVersion(res.data.version)
    } catch (e) {
      setAppVersion('?')
    }

    await refreshData()
    await loadSettings()
    connectWebSocket()

    // Poll for live position prices every 5 seconds (WebSocket handles portfolio updates every 2s)
    refreshIntervalRef.current = setInterval(refreshLivePositions, 5000)
  }, [refreshData, loadSettings, connectWebSocket, refreshLivePositions])

  // Cleanup function
  const cleanup = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
      refreshIntervalRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    initializedRef.current = false
  }, [])

  // Force sell a position
  const forceSellPosition = useCallback(async (positionId: string) => {
    try {
      const res = await apiClient.post('/positions/sell', { positionId })
      if (res.data.success) {
        await refreshData()
      }
      return res.data
    } catch (error) {
      console.error('Error force selling position:', error)
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' }
    }
  }, [refreshData])

  const clearUpdateLogs = useCallback(() => {
    setUpdateLogs([])
  }, [])

  const openCoinbase = useCallback((symbol: string) => {
    const pair = symbol.includes('-USD') ? symbol : `${symbol}-USD`
    const url = `https://www.coinbase.com/advanced-trade/spot/${pair}`
    window.open(url, '_blank')
  }, [])

  // Initialize on mount
  useEffect(() => {
    initialize()
    return cleanup
  }, [initialize, cleanup])

  return (
    <TradingContext.Provider value={{
      loading,
      botLoading,
      wsConnected,
      lastUpdate,
      appVersion,
      updateLogs,
      updatePrompt,
      portfolio,
      positions,
      livePositions,
      trades,
      coinPerformance,
      activities,
      botStatus,
      settings,
      settingsHistory,
      settingsComment,
      totalUnrealizedPL,
      coinbaseApiStatus,
      setSettingsComment,
      startBot,
      stopBot,
      resetPortfolio,
      loadSettings,
      loadSettingsHistory,
      saveSettings,
      resetSettings,
      confirmUpdate,
      applyUpdate,
      refreshBotStatus,
      refreshData,
      refreshLivePositions,
      initialize,
      cleanup,
      clearUpdateLogs,
      forceSellPosition,
      openCoinbase,
    }}>
      {children}
    </TradingContext.Provider>
  )
}

export function useTrading() {
  const context = useContext(TradingContext)
  if (!context) {
    throw new Error('useTrading must be used within TradingProvider')
  }
  return context
}
