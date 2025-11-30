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
      
      <v-btn 
        icon="mdi-cog" 
        @click="showSettingsDialog = true"
        
        title="Settings"
        class="mr-1"
      ></v-btn>
      
      <v-btn 
        icon="mdi-delete-sweep" 
        color="warning"
        @click="showResetDialog = true"
        
        title="Reset Portfolio"
      ></v-btn>
    </v-app-bar>

    <!-- Reset Confirmation Dialog -->
    <v-dialog v-model="showResetDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5">
          <v-icon icon="mdi-alert" color="warning" class="mr-2"></v-icon>
          Reset Portfolio?
        </v-card-title>
        <v-card-text>
          This will clear all positions and trade history, and reset your cash to $10,000. This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="showResetDialog = false">Cancel</v-btn>
          <v-btn color="warning" variant="flat" @click="resetPortfolio" :loading="resetLoading">Reset</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Settings Dialog -->
    <v-dialog v-model="showSettingsDialog" max-width="700" scrollable>
      <v-card>
        <v-card-title class="text-h5 d-flex align-center">
          <v-icon icon="mdi-cog" class="mr-2"></v-icon>
          Bot Settings
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="showSettingsDialog = false"></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text style="max-height: 70vh;">
          <v-alert v-if="botStatus.running" type="info" class="mb-4">
            <v-icon icon="mdi-information" class="mr-2"></v-icon>
            The bot will automatically restart when you apply changes.
          </v-alert>
          
          <v-row>
            <v-col cols="12">
              <div class="text-subtitle-1 font-weight-bold mb-2">Trading Parameters</div>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="settings.MAX_PRICE"
                label="Max Coin Price ($)"
                type="number"
                step="0.1"
                hint="Only trade coins below this price"
                persistent-hint
                
              ></v-text-field>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="settings.POSITION_SIZE"
                label="Position Size ($)"
                type="number"
                step="50"
                hint="Amount to invest per trade"
                persistent-hint
                
              ></v-text-field>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="settings.MAX_POSITIONS"
                label="Max Positions"
                type="number"
                hint="Maximum concurrent open positions"
                persistent-hint
                
              ></v-text-field>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="settings.MIN_VOLUME"
                label="Min 24h Volume ($)"
                type="number"
                step="1000"
                hint="Minimum trading volume required"
                persistent-hint
                
              ></v-text-field>
            </v-col>
            
            <v-col cols="12">
              <v-divider class="my-2"></v-divider>
              <div class="text-subtitle-1 font-weight-bold mb-2">Entry & Exit Rules</div>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="settings.MOMENTUM_THRESHOLD"
                label="Momentum Threshold (%)"
                type="number"
                step="0.1"
                hint="Min price increase to trigger buy"
                persistent-hint
                
              ></v-text-field>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="settings.PROFIT_TARGET"
                label="Profit Target (%)"
                type="number"
                step="0.1"
                hint="Target profit before considering exit"
                persistent-hint
                
              ></v-text-field>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="settings.MOMENTUM_WINDOW"
                label="Momentum Window (minutes)"
                type="number"
                hint="Time period to measure price increase"
                persistent-hint
                
              ></v-text-field>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="settings.STOP_LOSS"
                label="Stop Loss (%)"
                type="number"
                step="0.5"
                hint="Max loss before selling (use negative)"
                persistent-hint
                
              ></v-text-field>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="settings.SCAN_INTERVAL"
                label="Scan Interval (seconds)"
                type="number"
                hint="Time between market scans"
                persistent-hint
                
              ></v-text-field>
            </v-col>
            
            <v-col cols="12">
              <v-divider class="my-2"></v-divider>
              <div class="text-subtitle-1 font-weight-bold mb-2">Trailing Profit</div>
            </v-col>
            
            <v-col cols="12" md="4">
              <v-switch
                v-model="settings.ENABLE_TRAILING_PROFIT"
                label="Enable Trailing"
                color="primary"
                hint="Let winners ride after target"
                persistent-hint
                
              ></v-switch>
            </v-col>
            
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="settings.TRAILING_STOP_PERCENT"
                label="Trailing Stop (%)"
                type="number"
                step="0.1"
                hint="Sell when drops this much from peak"
                persistent-hint
                :disabled="!settings.ENABLE_TRAILING_PROFIT"
              ></v-text-field>
            </v-col>
            
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="settings.MIN_MOMENTUM_TO_RIDE"
                label="Min Momentum to Ride (%)"
                type="number"
                step="0.1"
                hint="Min momentum to keep riding"
                persistent-hint
                :disabled="!settings.ENABLE_TRAILING_PROFIT"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-btn color="grey" variant="text" @click="loadSettings">Reset to Current</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="showSettingsDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="saveSettings" :loading="settingsLoading">
            <v-icon start icon="mdi-check"></v-icon>
            {{ botStatus.running ? 'Apply & Restart' : 'Save Settings' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
              <v-card-title class="d-flex align-center">
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
              <v-card-text>
                <v-data-table
                  :headers="positionHeaders"
                  :items="livePositions"
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
                    ${{ item.entryPrice.toFixed(6) }}
                  </template>
                  <template v-slot:item.currentPrice="{ item }">
                    <span v-if="item.currentPrice">
                      ${{ item.currentPrice.toFixed(6) }}
                    </span>
                    <v-progress-circular v-else size="16" width="2" indeterminate></v-progress-circular>
                  </template>
                  <template v-slot:item.currentPL="{ item }">
                    <v-chip 
                      v-if="item.currentPL !== undefined"
                      size="small" 
                      :color="item.currentPL >= 0 ? 'success' : 'error'"
                      variant="flat"
                    >
                      {{ item.currentPL >= 0 ? '+' : '' }}${{ item.currentPL?.toFixed(2) || '0.00' }}
                      ({{ item.currentPLPercent >= 0 ? '+' : '' }}{{ item.currentPLPercent?.toFixed(2) || '0.00' }}%)
                    </v-chip>
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

    <v-footer app class="d-flex justify-space-between">
      <div class="text-caption text-medium-emphasis">
        Last updated: {{ lastUpdate }} · 
        <span :class="wsConnected ? 'text-success' : 'text-warning'">
          {{ wsConnected ? '🟢 Live' : '🟡 Reconnecting...' }}
        </span>
        · API Calls: {{ botStatus.apiCalls || 0 }}
      </div>
      <div class="text-caption text-medium-emphasis">
        v{{ appVersion }}
      </div>
    </v-footer>

    <!-- Snackbar for notifications -->
    <v-snackbar v-model="showSnackbar" :timeout="3000" location="bottom right">
      {{ snackbarText }}
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import axios from 'axios'

// Use relative path in production, localhost in development
const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api'

const loading = ref(false)
const botLoading = ref(false)
const resetLoading = ref(false)
const settingsLoading = ref(false)
const showResetDialog = ref(false)
const showSettingsDialog = ref(false)
const showSnackbar = ref(false)
const snackbarText = ref('')
const portfolio = ref({})
const positions = ref([])
const livePositions = ref([])
const trades = ref([])
const coinPerformance = ref([])
const activities = ref([])
const lastUpdate = ref('')
const appVersion = ref('...')
const wsConnected = ref(false)
let ws = null
let reconnectTimeout = null
const botStatus = ref({
  running: false,
  message: 'Bot is stopped',
  lastUpdate: Date.now(),
  cycleCount: 0,
  apiCalls: 0,
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

let refreshInterval = null

// Computed total unrealized P&L
const totalUnrealizedPL = computed(() => {
  return livePositions.value.reduce((sum, pos) => sum + (pos.currentPL || 0), 0)
})

const positionHeaders = [
  { title: 'Symbol', key: 'symbol', sortable: true },
  { title: 'Entry', key: 'entryPrice', sortable: true },
  { title: 'Current', key: 'currentPrice', sortable: true },
  { title: 'P&L', key: 'currentPL', sortable: true },
  { title: 'Invested', key: 'investedAmount', sortable: true },
  { title: 'Purchased', key: 'entryTime', sortable: true },
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
  // Append -USD if not already present
  const pair = symbol.includes('-USD') ? symbol : `${symbol}-USD`
  return `https://www.coinbase.com/advanced-trade/spot/${pair}`
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

const resetPortfolio = async () => {
  resetLoading.value = true
  try {
    await axios.post(`${API_URL}/portfolio/reset`)
    showResetDialog.value = false
    await refreshData()
  } catch (error) {
    console.error('Error resetting portfolio:', error)
  } finally {
    resetLoading.value = false
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
  settingsLoading.value = true
  try {
    const res = await axios.post(`${API_URL}/settings`, settings.value)
    showSettingsDialog.value = false
    if (res.data.restarted) {
      snackbarText.value = '✅ Settings saved - Bot restarting...'
    } else {
      snackbarText.value = '✅ Settings saved successfully'
    }
    showSnackbar.value = true
  } catch (error) {
    console.error('Error saving settings:', error)
    snackbarText.value = '❌ Failed to save settings'
    showSnackbar.value = true
  } finally {
    settingsLoading.value = false
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

// WebSocket connection for real-time updates
function connectWebSocket() {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = import.meta.env.PROD 
    ? `${wsProtocol}//${window.location.host}`
    : 'ws://localhost:3001'
  
  ws = new WebSocket(wsUrl)
  
  ws.onopen = () => {
    console.log('[WS] Connected to server')
    wsConnected.value = true
  }
  
  ws.onmessage = (event) => {
    try {
      const { type, data } = JSON.parse(event.data)
      
      if (type === 'botStatus') {
        botStatus.value = data
        lastUpdate.value = new Date().toLocaleTimeString()
      } else if (type === 'portfolio') {
        // Update portfolio data reactively
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
    reconnectTimeout = setTimeout(connectWebSocket, 3000)
  }
  
  ws.onerror = (error) => {
    console.error('[WS] Error:', error)
  }
}

onMounted(async () => {
  // Fetch version once
  try {
    const res = await axios.get(`${API_URL}/version`)
    appVersion.value = res.data.version
  } catch (e) {
    appVersion.value = '?'
  }
  
  // Initial data load
  refreshData()
  loadSettings()
  
  // Connect WebSocket for real-time updates
  connectWebSocket()
  
  // Fallback polling every 10 seconds (only for data WS doesn't push)
  refreshInterval = setInterval(() => {
    // Only refresh live positions and performance data
    refreshLivePositions()
  }, 10000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout)
  }
  if (ws) {
    ws.close()
  }
})

async function refreshLivePositions() {
  try {
    const [liveRes, perfRes] = await Promise.all([
      axios.get(`${API_URL}/positions/live`),
      axios.get(`${API_URL}/performance`)
    ])
    livePositions.value = liveRes.data
    coinPerformance.value = perfRes.data
  } catch (e) {
    // Ignore errors
  }
}
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
