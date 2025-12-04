<template>
  <v-container fluid class="pa-2 pa-sm-4">
    <div class="d-none d-md-flex justify-end mb-2">
      <v-btn 
        color="primary" 
        size="small" 
        prepend-icon="mdi-content-save" 
        @click="saveLayout"
        :loading="savingLayout"
      >
        Save Layout
      </v-btn>
      <v-btn 
        color="secondary" 
        size="small" 
        variant="text"
        class="ml-2"
        @click="resetLayout"
      >
        Reset Default
      </v-btn>
    </div>

    <!-- Mobile Layout (stacked cards) -->
    <div v-if="isMobile" class="mobile-layout">
      <!-- Stats Row -->
      <v-row dense class="mb-2">
        <v-col cols="6">
          <v-card class="h-100">
            <v-card-text class="pa-2">
              <div class="text-overline text-truncate">Total Value</div>
              <div class="text-h6">${{ portfolio.totalValue?.toFixed(2) || '0.00' }}</div>
              <div class="text-caption" :class="portfolio.roi >= 0 ? 'text-success' : 'text-error'">
                {{ portfolio.roi?.toFixed(2) || '0.00' }}% ROI
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6">
          <v-card class="h-100">
            <v-card-text class="pa-2">
              <div class="text-overline text-truncate">Available Cash</div>
              <div class="text-h6">${{ portfolio.cash?.toFixed(2) || '0.00' }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6">
          <v-card class="h-100">
            <v-card-text class="pa-2">
              <div class="text-overline text-truncate">Total Profit</div>
              <div class="text-h6" :class="portfolio.totalProfit >= 0 ? 'text-success' : 'text-error'">
                ${{ portfolio.totalProfit?.toFixed(2) || '0.00' }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6">
          <v-card class="h-100">
            <v-card-text class="pa-2">
              <div class="text-overline text-truncate">Win Rate</div>
              <div class="text-h6">{{ portfolio.winRate?.toFixed(1) || '0.0' }}%</div>
              <div class="text-caption">{{ portfolio.winningTrades || 0 }}W / {{ portfolio.losingTrades || 0 }}L</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Open Positions -->
      <v-card class="mb-2">
        <v-card-title class="d-flex align-center py-2">
          <v-icon icon="mdi-chart-line" class="mr-2" size="small"></v-icon>
          Open Positions ({{ livePositions.length }})
          <v-spacer></v-spacer>
          <v-chip 
            v-if="totalUnrealizedPL !== 0" 
            :color="totalUnrealizedPL >= 0 ? 'success' : 'error'"
            size="x-small"
          >
            {{ totalUnrealizedPL >= 0 ? '+' : '' }}${{ totalUnrealizedPL.toFixed(2) }}
          </v-chip>
        </v-card-title>
        <v-card-text class="pa-2">
          <v-list density="compact" class="pa-0">
            <v-list-item
              v-for="pos in livePositions.slice(0, 10)"
              :key="pos.symbol"
              class="px-0"
            >
              <template v-slot:prepend>
                <v-chip 
                  size="x-small" 
                  color="primary"
                  @click="openCoinbase(pos.symbol)"
                >
                  {{ pos.symbol }}
                </v-chip>
              </template>
              <v-list-item-title class="d-flex justify-space-between">
                <span>${{ pos.entryPrice?.toFixed(6) }}</span>
                <v-chip 
                  size="x-small"
                  :color="(pos.currentPLPercent || 0) >= 0 ? 'success' : 'error'"
                >
                  {{ (pos.currentPLPercent || 0) >= 0 ? '+' : '' }}{{ pos.currentPLPercent?.toFixed(2) || '0.00' }}%
                </v-chip>
              </v-list-item-title>
            </v-list-item>
            <v-list-item v-if="livePositions.length === 0" class="px-0">
              <v-list-item-title class="text-medium-emphasis text-center">
                No open positions
              </v-list-item-title>
            </v-list-item>
            <v-list-item v-if="livePositions.length > 10" class="px-0">
              <v-list-item-title class="text-caption text-center text-medium-emphasis">
                +{{ livePositions.length - 10 }} more positions
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>

      <!-- Recent Trades -->
      <v-card class="mb-2">
        <v-card-title class="py-2">
          <v-icon icon="mdi-history" class="mr-2" size="small"></v-icon>
          Recent Trades
        </v-card-title>
        <v-card-text class="pa-2">
          <v-list density="compact" class="pa-0">
            <v-list-item
              v-for="trade in trades.slice(0, 5)"
              :key="trade.exitTime"
              class="px-0"
            >
              <template v-slot:prepend>
                <v-chip 
                  size="x-small" 
                  color="primary"
                  @click="openCoinbase(trade.symbol)"
                >
                  {{ trade.symbol }}
                </v-chip>
              </template>
              <v-list-item-title>
                <span :class="trade.profit >= 0 ? 'text-success' : 'text-error'">
                  {{ trade.profit >= 0 ? '+' : '' }}${{ trade.profit.toFixed(2) }}
                </span>
                <v-chip size="x-small" :color="trade.profit >= 0 ? 'success' : 'error'" class="ml-1">
                  {{ trade.profitPercent >= 0 ? '+' : '' }}{{ trade.profitPercent.toFixed(2) }}%
                </v-chip>
              </v-list-item-title>
            </v-list-item>
            <v-list-item v-if="trades.length === 0" class="px-0">
              <v-list-item-title class="text-medium-emphasis">
                No trades yet
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </div>

    <!-- Desktop Layout (grid) -->
    <GridLayout
      v-else
      v-model:layout="layout"
      :col-num="colNum"
      :row-height="30"
      :is-draggable="true"
      :is-resizable="true"
      :vertical-compact="true"
      :use-css-transforms="true"
    >
      <GridItem
        v-for="item in layout"
        :key="item.i"
        :x="item.x"
        :y="item.y"
        :w="item.w"
        :h="item.h"
        :i="item.i"
        class="grid-item-card"
      >
        <!-- Item 0: Total Value -->
        <v-card v-if="item.i === '0'" class="h-100">
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

        <!-- Item 1: Available Cash -->
        <v-card v-if="item.i === '1'" class="h-100">
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

        <!-- Item 2: Total Profit -->
        <v-card v-if="item.i === '2'" class="h-100">
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

        <!-- Item 3: Win Rate -->
        <v-card v-if="item.i === '3'" class="h-100">
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

        <!-- Item 4: Open Positions -->
        <v-card v-if="item.i === '4'" class="h-100 d-flex flex-column">
          <v-card-title class="d-flex align-center flex-shrink-0">
            <v-icon icon="mdi-chart-line" class="mr-2"></v-icon>
            Open Positions ({{ livePositions.length }})
            <v-spacer></v-spacer>
            <v-chip 
              v-if="totalUnrealizedPL !== 0" 
              :color="totalUnrealizedPL >= 0 ? 'success' : 'error'"
              size="small"
            >
              {{ totalUnrealizedPL >= 0 ? '+' : '' }}${{ totalUnrealizedPL.toFixed(2) }}
            </v-chip>
          </v-card-title>
          <v-card-text class="flex-grow-1 overflow-auto">
            <v-data-table
              :headers="positionHeaders"
              :items="livePositions"
              :items-per-page="15"
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
                ${{ item.entryPrice.toFixed(6) }}
              </template>
              <template v-slot:item.currentPrice="{ item }">
                <span v-if="item.currentPrice">
                  ${{ item.currentPrice.toFixed(6) }}
                </span>
                <v-progress-circular v-else size="16" width="2" indeterminate></v-progress-circular>
              </template>
              <template v-slot:item.currentPLPercent="{ item }">
                <v-chip 
                  v-if="item.currentPLPercent !== undefined"
                  size="small" 
                  :color="item.currentPLPercent >= 0 ? 'success' : 'error'"
                  variant="flat"
                >
                  {{ item.currentPLPercent >= 0 ? '+' : '' }}{{ item.currentPLPercent?.toFixed(2) || '0.00' }}%
                </v-chip>
              </template>
              <template v-slot:item.currentPL="{ item }">
                <span 
                  v-if="item.currentPL !== undefined"
                  :class="item.currentPL >= 0 ? 'text-success' : 'text-error'"
                >
                  {{ item.currentPL >= 0 ? '+' : '' }}${{ item.currentPL?.toFixed(2) || '0.00' }}
                </span>
              </template>
              <template v-slot:item.investedAmount="{ item }">
                ${{ item.investedAmount.toFixed(2) }}
              </template>
              <template v-slot:item.entryTime="{ item }">
                {{ formatTimestamp(item.entryTime) }}
              </template>
              <template v-slot:item.holdTime="{ item }">
                {{ formatHoldTime(item.holdTime || (Date.now() - item.entryTime)) }}
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

        <!-- Item 5: Top Performers -->
        <v-card v-if="item.i === '5'" class="h-100 d-flex flex-column">
          <v-card-title class="flex-shrink-0">
            <v-icon icon="mdi-trophy" class="mr-2" color="success"></v-icon>
            Top Performers
          </v-card-title>
          <v-card-text class="flex-grow-1 overflow-auto">
            <v-list density="compact">
              <v-list-item
                v-for="coin in topPerformers"
                :key="coin.symbol"
                class="px-0"
              >
                <template v-slot:prepend>
                  <v-chip 
                    size="small" 
                    color="accent"
                    @click="openCoinbase(coin.symbol)"
                    style="cursor: pointer;"
                  >
                    {{ coin.symbol }}
                  </v-chip>
                </template>
                <v-list-item-title>
                  <span class="text-success">
                    +${{ coin.profit.toFixed(2) }}
                  </span>
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ coin.trades }} trades · {{ coin.winRate.toFixed(0) }}% win
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item v-if="topPerformers.length === 0" class="px-0">
                <v-list-item-title class="text-medium-emphasis">
                  No profitable coins yet
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <!-- Item 6: Worst Performers -->
        <v-card v-if="item.i === '6'" class="h-100 d-flex flex-column">
          <v-card-title class="flex-shrink-0">
            <v-icon icon="mdi-trending-down" class="mr-2" color="error"></v-icon>
            Worst Performers
          </v-card-title>
          <v-card-text class="flex-grow-1 overflow-auto">
            <v-list density="compact">
              <v-list-item
                v-for="coin in worstPerformers"
                :key="coin.symbol"
                class="px-0"
              >
                <template v-slot:prepend>
                  <v-chip 
                    size="small" 
                    color="accent"
                    @click="openCoinbase(coin.symbol)"
                    style="cursor: pointer;"
                  >
                    {{ coin.symbol }}
                  </v-chip>
                </template>
                <v-list-item-title>
                  <span class="text-error">
                    ${{ coin.profit.toFixed(2) }}
                  </span>
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ coin.trades }} trades · {{ coin.winRate.toFixed(0) }}% win
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item v-if="worstPerformers.length === 0" class="px-0">
                <v-list-item-title class="text-medium-emphasis">
                  No losing coins yet
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <!-- Item 7: Recent Trades -->
        <v-card v-if="item.i === '7'" class="h-100 d-flex flex-column">
          <v-card-title class="flex-shrink-0">
            <v-icon icon="mdi-history" class="mr-2"></v-icon>
            Recent Trades
          </v-card-title>
          <v-card-text class="flex-grow-1 overflow-auto">
            <v-list density="compact">
              <v-list-item
                v-for="trade in trades.slice(0, 5)"
                :key="trade.exitTime"
                class="px-0"
              >
                <template v-slot:prepend>
                  <v-chip 
                    size="small" 
                    color="primary"
                    @click="openCoinbase(trade.symbol)"
                    style="cursor: pointer;"
                  >
                    {{ trade.symbol }}
                  </v-chip>
                </template>
                <v-list-item-title>
                  <span :class="trade.profit >= 0 ? 'text-success' : 'text-error'">
                    {{ trade.profit >= 0 ? '+' : '' }}${{ trade.profit.toFixed(2) }}
                  </span>
                  <v-chip size="x-small" :color="trade.profit >= 0 ? 'success' : 'error'" class="ml-2">
                    {{ trade.profitPercent >= 0 ? '+' : '' }}{{ trade.profitPercent.toFixed(2) }}%
                  </v-chip>
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ trade.reason }} · {{ formatHoldTime(trade.holdTimeMs) }}
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item v-if="trades.length === 0" class="px-0">
                <v-list-item-title class="text-medium-emphasis">
                  No trades yet
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <!-- Item 8: Recent Activity -->
        <v-card v-if="item.i === '8'" class="h-100 d-flex flex-column">
          <v-card-title class="d-flex align-center flex-shrink-0">
            <v-icon icon="mdi-bell" class="mr-2"></v-icon>
            Recent Activity
            <v-spacer></v-spacer>
            <v-btn size="x-small" variant="text" to="/activity">View All</v-btn>
          </v-card-title>
          <v-card-text class="flex-grow-1 overflow-auto">
            <v-timeline density="compact" side="end">
              <v-timeline-item
                v-for="(activity, index) in activities.slice(0, 5)"
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

        <!-- Item 9: Bot Logs -->
        <v-card v-if="item.i === '9'" class="h-100 d-flex flex-column">
          <v-card-title class="d-flex align-center flex-shrink-0">
            <v-icon icon="mdi-console" class="mr-2"></v-icon>
            Bot Logs
            <v-chip size="x-small" class="ml-2" color="info" variant="tonal">newest at bottom</v-chip>
            <v-spacer></v-spacer>
            <v-btn size="x-small" variant="text" to="/logs">View All</v-btn>
          </v-card-title>
          <v-card-text class="flex-grow-1 overflow-auto">
            <v-list density="compact" class="log-list">
              <v-list-item
                v-for="(log, index) in recentLogs"
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
      </GridItem>
    </GridLayout>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useTrading } from '../composables/useTrading'
import { GridLayout, GridItem } from 'grid-layout-plus'

const { 
  portfolio, 
  livePositions, 
  trades,
  coinPerformance,
  activities,
  botStatus,
  totalUnrealizedPL,
  formatHoldTime,
  formatTimestamp,
  getCoinbaseUrl,
  openCoinbase 
} = useTrading()

// Responsive handling
const isMobile = ref(window.innerWidth < 768)
const colNum = ref(12)

const handleResize = () => {
  const width = window.innerWidth
  isMobile.value = width < 768
  if (width < 600) {
    colNum.value = 4
  } else if (width < 960) {
    colNum.value = 6
  } else {
    colNum.value = 12
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  handleResize()
  
  const savedLayout = localStorage.getItem('dashboardLayout')
  if (savedLayout) {
    try {
      layout.value = JSON.parse(savedLayout)
    } catch (e) {
      layout.value = JSON.parse(JSON.stringify(defaultLayout))
    }
  } else {
    layout.value = JSON.parse(JSON.stringify(defaultLayout))
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// Default layout
const defaultLayout = [
  { x: 0, y: 0, w: 3, h: 4, i: '0' }, // Total Value
  { x: 3, y: 0, w: 3, h: 4, i: '1' }, // Available Cash
  { x: 6, y: 0, w: 3, h: 4, i: '2' }, // Total Profit
  { x: 9, y: 0, w: 3, h: 4, i: '3' }, // Win Rate
  { x: 0, y: 4, w: 12, h: 10, i: '4' }, // Open Positions
  { x: 0, y: 14, w: 6, h: 8, i: '5' }, // Top Performers
  { x: 6, y: 14, w: 6, h: 8, i: '6' }, // Worst Performers
  { x: 0, y: 22, w: 6, h: 8, i: '7' }, // Recent Trades
  { x: 6, y: 22, w: 6, h: 8, i: '8' }, // Recent Activity
  { x: 0, y: 30, w: 12, h: 8, i: '9' }, // Bot Logs
]

const layout = ref([])
const savingLayout = ref(false)

// Debounce timer for auto-save
let saveTimer = null

// Auto-save layout when it changes
const autoSaveLayout = () => {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    localStorage.setItem('dashboardLayout', JSON.stringify(layout.value))
  }, 500) // Save 500ms after last change
}

// Watch for layout changes and auto-save
watch(layout, () => {
  autoSaveLayout()
}, { deep: true })

const saveLayout = () => {
  savingLayout.value = true
  localStorage.setItem('dashboardLayout', JSON.stringify(layout.value))
  setTimeout(() => {
    savingLayout.value = false
  }, 500)
}

const resetLayout = () => {
  layout.value = JSON.parse(JSON.stringify(defaultLayout))
  saveLayout()
}

// Get the last 10 logs in chronological order (oldest first, newest last)
const recentLogs = computed(() => {
  const logs = botStatus.value.logs || []
  // Take last 10 logs (already in chronological order)
  return logs.slice(-10)
})

// Top performers - only positive profits
const topPerformers = computed(() => {
  return coinPerformance.value.filter(c => c.profit > 0).slice(0, 5)
})

// Worst performers - only negative profits, sorted worst first
const worstPerformers = computed(() => {
  return coinPerformance.value.filter(c => c.profit < 0).sort((a, b) => a.profit - b.profit).slice(0, 5)
})

const getLogClass = (message) => {
  if (message.includes('BUY')) return 'text-success'
  if (message.includes('SELL')) return 'text-info'
  if (message.includes('Error') || message.includes('❌')) return 'text-error'
  if (message.includes('🛑')) return 'text-warning'
  return ''
}

const positionHeaders = [
  { title: 'Symbol', key: 'symbol', sortable: true },
  { title: 'Entry', key: 'entryPrice', sortable: true },
  { title: 'Current', key: 'currentPrice', sortable: true },
  { title: 'P&L %', key: 'currentPLPercent', sortable: true },
  { title: 'P&L $', key: 'currentPL', sortable: true },
  { title: 'Invested', key: 'investedAmount', sortable: true },
  { title: 'Purchased', key: 'entryTime', sortable: true },
  { title: 'Hold Time', key: 'holdTime', sortable: true },
]
</script>

<style scoped>
.log-list {
  max-height: 100%;
  overflow-y: auto;
}

.grid-item-card {
  touch-action: none;
}

:deep(.vgl-item__resizer) {
  z-index: 100;
}
</style>

<style>
/* Grid Layout Plus Styles */
.vgl-layout {
  --vgl-placeholder-bg: #1976d2;
  --vgl-placeholder-opacity: 20%;
  --vgl-placeholder-z-index: 2;
  --vgl-item-resizing-z-index: 3;
  --vgl-item-resizing-opacity: 60%;
  --vgl-item-dragging-z-index: 3;
  --vgl-item-dragging-opacity: 100%;
  --vgl-resizer-size: 10px;
  --vgl-resizer-border-color: #666;
  --vgl-resizer-border-width: 2px;

  position: relative;
  box-sizing: border-box;
  transition: height 200ms ease;
}

.vgl-item {
  position: absolute;
  box-sizing: border-box;
  transition: 200ms ease;
  transition-property: left, top, right;
}

.vgl-item--placeholder {
  z-index: var(--vgl-placeholder-z-index, 2);
  user-select: none;
  background-color: var(--vgl-placeholder-bg, #1976d2);
  opacity: var(--vgl-placeholder-opacity, 20%);
  transition-duration: 100ms;
}

.vgl-item--no-touch {
  touch-action: none;
}

.vgl-item--transform {
  right: auto;
  left: 0;
  transition-property: transform;
}

.vgl-item--resizing {
  z-index: var(--vgl-item-resizing-z-index, 3);
  user-select: none;
  opacity: var(--vgl-item-resizing-opacity, 60%);
}

.vgl-item--dragging {
  z-index: var(--vgl-item-dragging-z-index, 3);
  user-select: none;
  opacity: var(--vgl-item-dragging-opacity, 100%);
  transition: none;
}

.vgl-item__resizer {
  position: absolute;
  right: 0;
  bottom: 0;
  box-sizing: border-box;
  width: var(--vgl-resizer-size);
  height: var(--vgl-resizer-size);
  cursor: se-resize;
}

.vgl-item__resizer::before {
  position: absolute;
  inset: 0 3px 3px 0;
  content: '';
  border: 0 solid var(--vgl-resizer-border-color);
  border-right-width: var(--vgl-resizer-border-width);
  border-bottom-width: var(--vgl-resizer-border-width);
}
</style>
