import { ref, computed, onMounted, onUnmounted } from 'vue'
import axios from 'axios'

// Use relative path in production, localhost in development
const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api'

// Shared state
const loading = ref(false)
const botLoading = ref(false)
const wsConnected = ref(false)
const lastUpdate = ref('')
const appVersion = ref('...')
const updateLogs = ref([])

const portfolio = ref({})
const positions = ref([])
const livePositions = ref([])
const trades = ref([])
const coinPerformance = ref([])
const activities = ref([])

const botStatus = ref({
  running: false,
  message: 'Bot is stopped',
  lastUpdate: Date.now(),
  cycleCount: 0,
  apiCalls: 0,
  apiRate: 0,
  apiRateHourly: 0,
  logs: [],
})

const settings = ref({
  PAPER_TRADING: true,
  MAX_PRICE: 1.0,
  PROFIT_TARGET: 2.5,
  MOMENTUM_THRESHOLD: 1.5,
  MOMENTUM_WINDOW: 10,
  SCAN_INTERVAL: 10,
  POSITION_SIZE: 500,
  MAX_POSITIONS: 30,
  MIN_VOLUME: 25000,
  STOP_LOSS: -3.0,
  ENABLE_TRAILING_PROFIT: true,
  TRAILING_STOP_PERCENT: 1.0,
  MIN_MOMENTUM_TO_RIDE: 0.5,
})

let ws = null
let reconnectTimeout = null
let refreshInterval = null
let initialized = false

// Computed total unrealized P&L
const totalUnrealizedPL = computed(() => {
  return livePositions.value.reduce((sum, pos) => sum + (pos.currentPL || 0), 0)
})

// Utility functions
const formatHoldTime = (ms) => {
  if (!ms) return '-'
  const minutes = Math.floor(ms / 60000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

const formatTimestamp = (ts) => {
  if (!ts) return '-'
  return new Date(ts).toLocaleString()
}

const getCoinbaseUrl = (symbol) => {
  const pair = symbol.includes('-USD') ? symbol : `${symbol}-USD`
  return `https://www.coinbase.com/advanced-trade/spot/${pair}`
}

const openCoinbase = (symbol) => {
  window.open(getCoinbaseUrl(symbol), '_blank')
}

// API Functions
const startBot = async () => {
  botLoading.value = true
  try {
    await axios.post(`${API_URL}/bot/start`)
    await refreshBotStatus()
  } catch (error) {
    console.error('Error starting bot:', error)
  } finally {
    botLoading.value = false
  }
}

const stopBot = async () => {
  botLoading.value = true
  try {
    await axios.post(`${API_URL}/bot/stop`)
    await refreshBotStatus()
  } catch (error) {
    console.error('Error stopping bot:', error)
  } finally {
    botLoading.value = false
  }
}

const resetPortfolio = async () => {
  try {
    await axios.post(`${API_URL}/portfolio/reset`)
    await refreshData()
    return true
  } catch (error) {
    console.error('Error resetting portfolio:', error)
    return false
  }
}

const loadSettings = async () => {
  try {
    const res = await axios.get(`${API_URL}/settings`)
    settings.value = res.data
  } catch (error) {
    console.error('Error loading settings:', error)
  }
}

const saveSettings = async () => {
  try {
    const res = await axios.post(`${API_URL}/settings`, settings.value)
    return res.data
  } catch (error) {
    console.error('Error saving settings:', error)
    throw error
  }
}

const refreshBotStatus = async () => {
  try {
    const res = await axios.get(`${API_URL}/bot/status`)
    botStatus.value = res.data
  } catch (error) {
    console.error('Error fetching bot status:', error)
  }
}

const refreshData = async () => {
  loading.value = true
  try {
    const [portfolioRes, positionsRes, livePositionsRes, tradesRes, performanceRes, activityRes] = await Promise.all([
      axios.get(`${API_URL}/portfolio`),
      axios.get(`${API_URL}/positions`),
      axios.get(`${API_URL}/positions/live`),
      axios.get(`${API_URL}/trades`),
      axios.get(`${API_URL}/performance-by-coin`),
      axios.get(`${API_URL}/activity`),
    ])

    portfolio.value = portfolioRes.data
    positions.value = positionsRes.data
    livePositions.value = livePositionsRes.data
    trades.value = tradesRes.data
    coinPerformance.value = performanceRes.data
    activities.value = activityRes.data
    lastUpdate.value = new Date().toLocaleTimeString()
    
    await refreshBotStatus()
  } catch (error) {
    console.error('Error fetching data:', error)
  } finally {
    loading.value = false
  }
}

const refreshLivePositions = async () => {
  try {
    const [liveRes, perfRes, activityRes] = await Promise.all([
      axios.get(`${API_URL}/positions/live`),
      axios.get(`${API_URL}/performance-by-coin`),
      axios.get(`${API_URL}/activity`)
    ])
    livePositions.value = liveRes.data
    coinPerformance.value = perfRes.data
    activities.value = activityRes.data
  } catch (e) {
    // Ignore errors
  }
}

// Track if an update is in progress - reload when server comes back up
let updateInProgress = false

// WebSocket connection
function connectWebSocket() {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = import.meta.env.PROD 
    ? `${wsProtocol}//${window.location.host}`
    : 'ws://localhost:3001'
  
  ws = new WebSocket(wsUrl)
  
  ws.onopen = () => {
    console.log('[WS] Connected to server')
    wsConnected.value = true
    
    // If we were waiting for an update to complete, reload the page now
    if (updateInProgress) {
      console.log('[WS] Server is back after update, reloading page...')
      updateLogs.value.push('[UPDATE] Server is back online, reloading...')
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }
  }
  
  ws.onmessage = (event) => {
    try {
      const { type, data } = JSON.parse(event.data)
      
      if (type === 'botStatus') {
        botStatus.value = data
        lastUpdate.value = new Date().toLocaleTimeString()
      } else if (type === 'updateLog') {
        updateLogs.value.push(data.message)
      } else if (type === 'updateComplete') {
        // Server is about to restart after update - set flag and reload when reconnected
        updateInProgress = true
        updateLogs.value.push('[UPDATE] Server restarting, will reload when back online...')
        // Also try immediate reload after delay as fallback
        setTimeout(() => {
          window.location.reload()
        }, 3000)
      } else if (type === 'portfolio') {
        if (data.positions) {
          positions.value = data.positions
        }
        if (data.trades) {
          trades.value = data.trades.slice(0, 50)
        }
        if (data.cash !== undefined) {
          portfolio.value.cash = data.cash
          portfolio.value.totalValue = data.cash + (data.positions || []).reduce(
            (sum, p) => sum + p.investedAmount, 0
          )
        }
        lastUpdate.value = new Date().toLocaleTimeString()
      }
    } catch (e) {
      console.error('[WS] Parse error:', e)
    }
  }
  
  ws.onclose = () => {
    console.log('[WS] Disconnected, reconnecting in 3s...')
    wsConnected.value = false
    // Use shorter reconnect time if update is in progress
    const delay = updateInProgress ? 1000 : 3000
    reconnectTimeout = setTimeout(connectWebSocket, delay)
  }
  
  ws.onerror = (error) => {
    console.error('[WS] Error:', error)
  }
}

// Initialize function
async function initialize() {
  if (initialized) return
  initialized = true
  
  // Fetch version once
  try {
    const res = await axios.get(`${API_URL}/version`)
    appVersion.value = res.data.version
  } catch (e) {
    appVersion.value = '?'
  }
  
  // Initial data load
  await refreshData()
  await loadSettings()
  
  // Connect WebSocket
  connectWebSocket()
  
  // Fallback polling every 10 seconds
  refreshInterval = setInterval(refreshLivePositions, 10000)
}

// Cleanup function
function cleanup() {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout)
    reconnectTimeout = null
  }
  if (ws) {
    ws.close()
    ws = null
  }
  initialized = false
}

// Force sell a position
const forceSellPosition = async (positionId) => {
  try {
    const res = await axios.post(`${API_URL}/positions/sell`, { positionId })
    if (res.data.success) {
      await refreshData()
    }
    return res.data
  } catch (error) {
    console.error('Error force selling position:', error)
    return { success: false, message: error.message }
  }
}

export function useTrading() {
  // Function to clear update logs
  const clearUpdateLogs = () => {
    updateLogs.value = []
  }
  
  return {
    // State
    loading,
    botLoading,
    wsConnected,
    lastUpdate,
    appVersion,
    updateLogs,
    portfolio,
    positions,
    livePositions,
    trades,
    coinPerformance,
    activities,
    botStatus,
    settings,
    totalUnrealizedPL,
    
    // Functions
    formatHoldTime,
    formatTimestamp,
    getCoinbaseUrl,
    openCoinbase,
    startBot,
    stopBot,
    resetPortfolio,
    loadSettings,
    saveSettings,
    refreshBotStatus,
    refreshData,
    refreshLivePositions,
    initialize,
    cleanup,
    clearUpdateLogs,
    forceSellPosition,
  }
}
