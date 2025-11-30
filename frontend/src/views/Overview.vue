<template>
  <v-container fluid>
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

    <!-- Open Positions -->
    <v-row>
      <v-col cols="12">
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
    </v-row>

    <!-- Quick Stats Row -->
    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            <v-icon icon="mdi-trophy" class="mr-2"></v-icon>
            Top Performers
          </v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item
                v-for="coin in coinPerformance.slice(0, 5)"
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

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            <v-icon icon="mdi-history" class="mr-2"></v-icon>
            Recent Trades
          </v-card-title>
          <v-card-text>
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
      </v-col>
    </v-row>

    <!-- Recent Activity and Bot Logs -->
    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-bell" class="mr-2"></v-icon>
            Recent Activity
            <v-spacer></v-spacer>
            <v-btn size="x-small" variant="text" to="/activity">View All</v-btn>
          </v-card-title>
          <v-card-text>
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
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-console" class="mr-2"></v-icon>
            Bot Logs
            <v-spacer></v-spacer>
            <v-btn size="x-small" variant="text" to="/logs">View All</v-btn>
          </v-card-title>
          <v-card-text>
            <v-list density="compact" class="log-list">
              <v-list-item
                v-for="(log, index) in botStatus.logs?.slice(0, 10)"
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
</template>

<script setup>
import { useTrading } from '../composables/useTrading'

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
  { title: 'P&L', key: 'currentPL', sortable: true },
  { title: 'Invested', key: 'investedAmount', sortable: true },
  { title: 'Purchased', key: 'entryTime', sortable: true },
  { title: 'Hold Time', key: 'holdTime', sortable: true },
]
</script>

<style scoped>
.log-list {
  max-height: 300px;
  overflow-y: auto;
}
</style>
