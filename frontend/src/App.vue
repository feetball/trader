<template>
  <v-app>
    <v-app-bar color="primary" prominent>
      <v-app-bar-title>
        <v-icon icon="mdi-robot" class="mr-2"></v-icon>
        Crypto Trading Bot Dashboard
      </v-app-bar-title>
      
      <v-spacer></v-spacer>
      
      <v-chip 
        :color="botStatus.running ? 'success' : 'grey'" 
        variant="flat" 
        class="mr-4"
      >
        <v-icon start :icon="botStatus.running ? 'mdi-circle' : 'mdi-circle-outline'" size="small"></v-icon>
        {{ botStatus.running ? 'Running' : 'Stopped' }}
      </v-chip>
      
      <v-btn 
        v-if="!botStatus.running"
        color="success" 
        variant="flat"
        class="mr-2"
        @click="startBot"
        :loading="botLoading"
      >
        <v-icon start icon="mdi-play"></v-icon>
        Start Bot
      </v-btn>
      
      <v-btn 
        v-else
        color="error" 
        variant="flat"
        class="mr-2"
        @click="stopBot"
        :loading="botLoading"
      >
        <v-icon start icon="mdi-stop"></v-icon>
        Stop Bot
      </v-btn>
      
      <v-btn icon="mdi-refresh" @click="refreshData" :loading="loading"></v-btn>
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <!-- Bot Status Banner -->
        <v-row>
          <v-col cols="12">
            <v-card :color="botStatus.running ? 'green-darken-4' : 'grey-darken-3'">
              <v-card-text class="py-3">
                <div class="d-flex align-center">
                  <v-icon 
                    :icon="botStatus.running ? 'mdi-robot' : 'mdi-robot-off'" 
                    size="large" 
                    class="mr-3"
                    :class="botStatus.running ? 'pulse-animation' : ''"
                  ></v-icon>
                  <div class="flex-grow-1">
                    <div class="text-h6 mb-1">
                      {{ botStatus.message }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      <span v-if="botStatus.running">
                        Cycle: {{ botStatus.cycleCount }} · 
                      </span>
                      Last update: {{ formatTimestamp(botStatus.lastUpdate) }}
                    </div>
                  </div>
                  <v-chip 
                    size="small" 
                    :color="botStatus.running ? 'success' : 'default'"
                    variant="tonal"
                  >
                    Paper Trading
                  </v-chip>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Portfolio Summary Cards -->
        <v-row>
          <v-col cols="12" md="3">
            <v-card>
              <v-card-text>
                <div class="text-overline mb-1">Total Value</div>
                <div class="text-h4 mb-1">
                  ${{ portfolio.totalValue?.toFixed(2) || '0.00' }}
                </div>
                <div :class="portfolio.roi >= 0 ? 'text-success' : 'text-error'">
                  <v-icon 
                    :icon="portfolio.roi >= 0 ? 'mdi-trending-up' : 'mdi-trending-down'" 
                    size="small"
                  ></v-icon>
                  {{ portfolio.roi?.toFixed(2) || '0.00' }}% ROI
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="3">
            <v-card>
              <v-card-text>
                <div class="text-overline mb-1">Available Cash</div>
                <div class="text-h4 mb-1">
                  ${{ portfolio.cash?.toFixed(2) || '0.00' }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  Positions: ${{ portfolio.positionsValue?.toFixed(2) || '0.00' }}
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="3">
            <v-card>
              <v-card-text>
                <div class="text-overline mb-1">Total Profit</div>
                <div class="text-h4 mb-1" :class="portfolio.totalProfit >= 0 ? 'text-success' : 'text-error'">
                  ${{ portfolio.totalProfit?.toFixed(2) || '0.00' }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ portfolio.totalTrades || 0 }} trades
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="3">
            <v-card>
              <v-card-text>
                <div class="text-overline mb-1">Win Rate</div>
                <div class="text-h4 mb-1">
                  {{ portfolio.winRate?.toFixed(1) || '0.0' }}%
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ portfolio.winningTrades || 0 }}W / {{ portfolio.losingTrades || 0 }}L
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Open Positions and Performance -->
        <v-row>
          <v-col cols="12" md="7">
            <v-card>
              <v-card-title>
                <v-icon icon="mdi-chart-line" class="mr-2"></v-icon>
                Open Positions ({{ positions.length }})
              </v-card-title>
              <v-card-text>
                <v-data-table
                  :headers="positionHeaders"
                  :items="positions"
                  :items-per-page="5"
                  density="compact"
                  class="elevation-0"
                >
                  <template v-slot:item.symbol="{ item }">
                    <v-chip 
                      size="small" 
                      color="primary" 
                      @click="openCoinbase(item.symbol)"
                      style="cursor: pointer;"
                      title="Open on Coinbase"
                    >
                      {{ item.symbol }}
                      <v-icon end icon="mdi-open-in-new" size="x-small"></v-icon>
                    </v-chip>
                  </template>
                  <template v-slot:item.entryPrice="{ item }">
                    ${{ item.entryPrice.toFixed(4) }}
                  </template>
                  <template v-slot:item.targetPrice="{ item }">
                    ${{ item.targetPrice.toFixed(4) }}
                  </template>
                  <template v-slot:item.investedAmount="{ item }">
                    ${{ item.investedAmount.toFixed(2) }}
                  </template>
                  <template v-slot:item.holdTime="{ item }">
                    {{ formatHoldTime(item.holdTime) }}
                  </template>
                  <template v-slot:no-data>
                    <div class="text-center py-4 text-medium-emphasis">
                      <v-icon icon="mdi-information" size="large" class="mb-2"></v-icon>
                      <div>No open positions</div>
                    </div>
                  </template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="5">
            <v-card>
              <v-card-title>
                <v-icon icon="mdi-trophy" class="mr-2"></v-icon>
                Performance by Coin
              </v-card-title>
              <v-card-text>
                <v-list density="compact">
                  <v-list-item
                    v-for="coin in coinPerformance.slice(0, 8)"
                    :key="coin.symbol"
                    class="px-0"
                  >
                    <template v-slot:prepend>
                      <v-chip 
                        size="small" 
                        color="accent"
                        @click="openCoinbase(coin.symbol)"
                        style="cursor: pointer;"
                        title="Open on Coinbase"
                      >
                        {{ coin.symbol }}
                        <v-icon end icon="mdi-open-in-new" size="x-small"></v-icon>
                      </v-chip>
                    </template>
                    <v-list-item-title>
                      <span :class="coin.profit >= 0 ? 'text-success' : 'text-error'">
                        ${{ coin.profit.toFixed(2) }}
                      </span>
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      {{ coin.trades }} trades · {{ coin.winRate.toFixed(0) }}% win
                    </v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item v-if="coinPerformance.length === 0" class="px-0">
                    <v-list-item-title class="text-medium-emphasis">
                      No trades yet
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Trade History -->
        <v-row>
          <v-col cols="12">
            <v-card>
              <v-card-title>
                <v-icon icon="mdi-history" class="mr-2"></v-icon>
                Trade History
              </v-card-title>
              <v-card-text>
                <v-data-table
                  :headers="tradeHeaders"
                  :items="trades"
                  :items-per-page="10"
                  density="compact"
                  class="elevation-0"
                >
                  <template v-slot:item.symbol="{ item }">
                    <v-chip 
                      size="small" 
                      color="primary"
                      @click="openCoinbase(item.symbol)"
                      style="cursor: pointer;"
                      title="Open on Coinbase"
                    >
                      {{ item.symbol }}
                      <v-icon end icon="mdi-open-in-new" size="x-small"></v-icon>
                    </v-chip>
                  </template>
                  <template v-slot:item.entryPrice="{ item }">
                    ${{ item.entryPrice.toFixed(4) }}
                  </template>
                  <template v-slot:item.exitPrice="{ item }">
                    ${{ item.exitPrice.toFixed(4) }}
                  </template>
                  <template v-slot:item.profit="{ item }">
                    <span :class="item.profit >= 0 ? 'text-success' : 'text-error'">
                      ${{ item.profit.toFixed(2) }}
                    </span>
                  </template>
                  <template v-slot:item.profitPercent="{ item }">
                    <v-chip 
                      size="small" 
                      :color="item.profit >= 0 ? 'success' : 'error'"
                      variant="flat"
                    >
                      {{ item.profitPercent >= 0 ? '+' : '' }}{{ item.profitPercent.toFixed(2) }}%
                    </v-chip>
                  </template>
                  <template v-slot:item.holdTimeMs="{ item }">
                    {{ formatHoldTime(item.holdTimeMs) }}
                  </template>
                  <template v-slot:item.exitTime="{ item }">
                    {{ formatTimestamp(item.exitTime) }}
                  </template>
                  <template v-slot:no-data>
                    <div class="text-center py-4 text-medium-emphasis">
                      <v-icon icon="mdi-information" size="large" class="mb-2"></v-icon>
                      <div>No trades executed yet. Start the bot to begin trading!</div>
                    </div>
                  </template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Recent Activity Feed -->
        <v-row>
          <v-col cols="12" md="6">
            <v-card>
              <v-card-title>
                <v-icon icon="mdi-bell" class="mr-2"></v-icon>
                Recent Activity
              </v-card-title>
              <v-card-text>
                <v-timeline density="compact" side="end">
                  <v-timeline-item
                    v-for="(activity, index) in activities"
                    :key="index"
                    :dot-color="activity.profit >= 0 ? 'success' : 'error'"
                    size="small"
                  >
                    <template v-slot:opposite>
                      <div class="text-caption">{{ formatTimestamp(activity.timestamp) }}</div>
                    </template>
                    <div>
                      <div class="font-weight-medium">
                        SELL 
                        <a 
                          :href="getCoinbaseUrl(activity.symbol)" 
                          target="_blank" 
                          class="text-primary text-decoration-none"
                        >
                          {{ activity.symbol }}
                          <v-icon icon="mdi-open-in-new" size="x-small"></v-icon>
                        </a>
                        <v-chip 
                          size="x-small" 
                          :color="activity.profit >= 0 ? 'success' : 'error'"
                          class="ml-2"
                        >
                          {{ activity.profitPercent >= 0 ? '+' : '' }}{{ activity.profitPercent.toFixed(2) }}%
                        </v-chip>
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        {{ activity.reason }} · ${{ activity.profit.toFixed(2) }} profit
                      </div>
                    </div>
                  </v-timeline-item>
                  <v-timeline-item v-if="activities.length === 0" size="small">
                    <div class="text-medium-emphasis">No recent activity</div>
                  </v-timeline-item>
                </v-timeline>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card>
              <v-card-title>
                <v-icon icon="mdi-console" class="mr-2"></v-icon>
                Bot Logs
              </v-card-title>
              <v-card-text>
                <v-list density="compact" class="log-list">
                  <v-list-item
                    v-for="(log, index) in botStatus.logs"
                    :key="index"
                    class="px-0 py-1"
                  >
                    <div class="d-flex align-start">
                      <span class="text-caption text-medium-emphasis mr-2" style="min-width: 70px;">
                        {{ log.timestamp }}
                      </span>
                      <span class="text-body-2" :class="getLogClass(log.message)">
                        {{ log.message }}
                      </span>
                    </div>
                  </v-list-item>
                  <v-list-item v-if="!botStatus.logs || botStatus.logs.length === 0" class="px-0">
                    <div class="text-medium-emphasis">
                      No logs yet. Start the bot to see activity.
                    </div>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <v-footer app>
      <div class="text-caption text-medium-emphasis">
        Last updated: {{ lastUpdate }} · Auto-refresh every 5s
      </div>
    </v-footer>
  </v-app>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'

// Use relative path in production, localhost in development
const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api'

const loading = ref(false)
const botLoading = ref(false)
const portfolio = ref({})
const positions = ref([])
const trades = ref([])
const coinPerformance = ref([])
const activities = ref([])
const lastUpdate = ref('')
const botStatus = ref({
  running: false,
  message: 'Bot is stopped',
  lastUpdate: Date.now(),
  cycleCount: 0,
  logs: [],
})

let refreshInterval = null

const positionHeaders = [
  { title: 'Symbol', key: 'symbol', sortable: true },
  { title: 'Entry Price', key: 'entryPrice', sortable: true },
  { title: 'Target', key: 'targetPrice', sortable: false },
  { title: 'Invested', key: 'investedAmount', sortable: true },
  { title: 'Hold Time', key: 'holdTime', sortable: true },
]

const tradeHeaders = [
  { title: 'Symbol', key: 'symbol', sortable: true },
  { title: 'Entry', key: 'entryPrice', sortable: false },
  { title: 'Exit', key: 'exitPrice', sortable: false },
  { title: 'Profit', key: 'profit', sortable: true },
  { title: 'Return', key: 'profitPercent', sortable: true },
  { title: 'Hold Time', key: 'holdTimeMs', sortable: true },
  { title: 'Time', key: 'exitTime', sortable: true },
  { title: 'Reason', key: 'reason', sortable: false },
]

const formatHoldTime = (ms) => {
  const minutes = Math.floor(ms / 60000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

const formatTimestamp = (ts) => {
  return new Date(ts).toLocaleString()
}

const getLogClass = (message) => {
  if (message.includes('BUY')) return 'text-success'
  if (message.includes('SELL')) return 'text-info'
  if (message.includes('Error') || message.includes('❌')) return 'text-error'
  if (message.includes('🛑')) return 'text-warning'
  return ''
}

const getCoinbaseUrl = (symbol) => {
  // Convert "BTC-USD" to "BTC-USD" for Coinbase URL
  return `https://www.coinbase.com/advanced-trade/spot/${symbol}`
}

const openCoinbase = (symbol) => {
  window.open(getCoinbaseUrl(symbol), '_blank')
}

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
    const [portfolioRes, positionsRes, tradesRes, performanceRes, activityRes] = await Promise.all([
      axios.get(`${API_URL}/portfolio`),
      axios.get(`${API_URL}/positions`),
      axios.get(`${API_URL}/trades`),
      axios.get(`${API_URL}/performance-by-coin`),
      axios.get(`${API_URL}/activity`),
    ])

    portfolio.value = portfolioRes.data
    positions.value = positionsRes.data
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

onMounted(() => {
  refreshData()
  // Auto-refresh every 5 seconds
  refreshInterval = setInterval(refreshData, 5000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style>
.pulse-animation {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.log-list {
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.log-list .v-list-item:first-child {
  background-color: rgba(var(--v-theme-primary), 0.1);
  border-radius: 4px;
}
</style>
