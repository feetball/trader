<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-history" class="mr-2"></v-icon>
            Trade History
            <v-spacer></v-spacer>
            <v-chip size="small" color="primary" class="mr-2">
              {{ trades.length }} trades
            </v-chip>
            <v-chip 
              size="small" 
              :color="totalProfit >= 0 ? 'success' : 'error'"
            >
              {{ totalProfit >= 0 ? '+' : '' }}${{ totalProfit.toFixed(2) }}
            </v-chip>
          </v-card-title>
          <v-card-text>
            <v-data-table
              :headers="tradeHeaders"
              :items="trades"
              :items-per-page="25"
              density="comfortable"
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
              <template v-slot:item.exitPrice="{ item }">
                ${{ item.exitPrice.toFixed(6) }}
              </template>
              <template v-slot:item.quantity="{ item }">
                {{ item.quantity?.toFixed(2) || '-' }}
              </template>
              <template v-slot:item.investedAmount="{ item }">
                ${{ item.investedAmount?.toFixed(2) || '-' }}
              </template>
              <template v-slot:item.profit="{ item }">
                <span :class="item.profit >= 0 ? 'text-success' : 'text-error'" class="font-weight-bold">
                  {{ item.profit >= 0 ? '+' : '' }}${{ item.profit.toFixed(2) }}
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
              <template v-slot:item.entryTime="{ item }">
                {{ formatTimestamp(item.entryTime) }}
              </template>
              <template v-slot:item.exitTime="{ item }">
                {{ formatTimestamp(item.exitTime) }}
              </template>
              <template v-slot:item.reason="{ item }">
                <v-chip 
                  size="x-small"
                  :color="getReasonColor(item.reason)"
                  variant="tonal"
                >
                  {{ item.reason }}
                </v-chip>
              </template>
              <template v-slot:no-data>
                <div class="text-center py-8 text-medium-emphasis">
                  <v-icon icon="mdi-history" size="64" class="mb-4"></v-icon>
                  <div class="text-h6">No Trade History</div>
                  <div class="text-body-2">Start the bot to begin trading!</div>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Stats Summary -->
    <v-row v-if="trades.length > 0">
      <v-col cols="12" md="3">
        <v-card>
          <v-card-text class="text-center">
            <div class="text-overline">Win Rate</div>
            <div class="text-h3" :class="winRate >= 50 ? 'text-success' : 'text-error'">
              {{ winRate.toFixed(1) }}%
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card>
          <v-card-text class="text-center">
            <div class="text-overline">Avg Profit</div>
            <div class="text-h3" :class="avgProfit >= 0 ? 'text-success' : 'text-error'">
              ${{ avgProfit.toFixed(2) }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card>
          <v-card-text class="text-center">
            <div class="text-overline">Avg Hold Time</div>
            <div class="text-h3">{{ formatHoldTime(avgHoldTime) }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card>
          <v-card-text class="text-center">
            <div class="text-overline">Biggest Win</div>
            <div class="text-h3 text-success">
              +${{ biggestWin.toFixed(2) }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed } from 'vue'
import { useTrading } from '../composables/useTrading'

const { trades, formatHoldTime, formatTimestamp, openCoinbase } = useTrading()

const tradeHeaders = [
  { title: 'Symbol', key: 'symbol', sortable: true },
  { title: 'Entry', key: 'entryPrice', sortable: false },
  { title: 'Exit', key: 'exitPrice', sortable: false },
  { title: 'Profit', key: 'profit', sortable: true },
  { title: 'Return', key: 'profitPercent', sortable: true },
  { title: 'Hold Time', key: 'holdTimeMs', sortable: true },
  { title: 'Bought', key: 'entryTime', sortable: true },
  { title: 'Sold', key: 'exitTime', sortable: true },
  { title: 'Reason', key: 'reason', sortable: false },
]

const totalProfit = computed(() => {
  return trades.value.reduce((sum, t) => sum + t.profit, 0)
})

const winRate = computed(() => {
  if (!trades.value.length) return 0
  const wins = trades.value.filter(t => t.profit > 0).length
  return (wins / trades.value.length) * 100
})

const avgProfit = computed(() => {
  if (!trades.value.length) return 0
  return totalProfit.value / trades.value.length
})

const avgHoldTime = computed(() => {
  if (!trades.value.length) return 0
  const total = trades.value.reduce((sum, t) => sum + (t.holdTimeMs || 0), 0)
  return total / trades.value.length
})

const biggestWin = computed(() => {
  if (!trades.value.length) return 0
  return Math.max(...trades.value.map(t => t.profit), 0)
})

const getReasonColor = (reason) => {
  if (reason?.includes('profit') || reason?.includes('Profit')) return 'success'
  if (reason?.includes('stop') || reason?.includes('Stop')) return 'error'
  if (reason?.includes('trail') || reason?.includes('Trail')) return 'info'
  return 'grey'
}
</script>
