<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-trophy" class="mr-2"></v-icon>
            Performance by Coin
            <v-spacer></v-spacer>
            <v-chip size="small" color="primary">
              {{ coinPerformance.length }} coins traded
            </v-chip>
          </v-card-title>
          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="coinPerformance"
              :items-per-page="25"
              density="comfortable"
              class="elevation-0"
              :sort-by="[{ key: 'profit', order: 'desc' }]"
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
              <template v-slot:item.profit="{ item }">
                <span :class="item.profit >= 0 ? 'text-success' : 'text-error'" class="font-weight-bold">
                  {{ item.profit >= 0 ? '+' : '' }}${{ item.profit.toFixed(2) }}
                </span>
              </template>
              <template v-slot:item.winRate="{ item }">
                <v-chip 
                  size="small"
                  :color="item.winRate >= 60 ? 'success' : item.winRate >= 40 ? 'warning' : 'error'"
                  variant="tonal"
                >
                  {{ item.winRate.toFixed(0) }}%
                </v-chip>
              </template>
              <template v-slot:item.avgProfit="{ item }">
                <span :class="item.avgProfit >= 0 ? 'text-success' : 'text-error'">
                  {{ item.avgProfit >= 0 ? '+' : '' }}${{ item.avgProfit?.toFixed(2) || '0.00' }}
                </span>
              </template>
              <template v-slot:item.avgHoldTime="{ item }">
                {{ formatHoldTime(item.avgHoldTime) }}
              </template>
              <template v-slot:no-data>
                <div class="text-center py-8 text-medium-emphasis">
                  <v-icon icon="mdi-chart-bar" size="64" class="mb-4"></v-icon>
                  <div class="text-h6">No Performance Data Yet</div>
                  <div class="text-body-2">Start the bot and complete some trades to see performance metrics.</div>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Summary Cards -->
    <v-row v-if="coinPerformance.length > 0">
      <v-col cols="12" md="4">
        <v-card color="success" variant="tonal">
          <v-card-text>
            <div class="text-overline">Best Performer</div>
            <div class="d-flex align-center">
              <v-chip size="large" color="success" class="mr-3">
                {{ bestCoin?.symbol || '-' }}
              </v-chip>
              <div>
                <div class="text-h5">+${{ bestCoin?.profit?.toFixed(2) || '0.00' }}</div>
                <div class="text-caption">{{ bestCoin?.trades || 0 }} trades</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card color="error" variant="tonal">
          <v-card-text>
            <div class="text-overline">Worst Performer</div>
            <div class="d-flex align-center">
              <v-chip size="large" color="error" class="mr-3">
                {{ worstCoin?.symbol || '-' }}
              </v-chip>
              <div>
                <div class="text-h5">${{ worstCoin?.profit?.toFixed(2) || '0.00' }}</div>
                <div class="text-caption">{{ worstCoin?.trades || 0 }} trades</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card color="info" variant="tonal">
          <v-card-text>
            <div class="text-overline">Most Traded</div>
            <div class="d-flex align-center">
              <v-chip size="large" color="info" class="mr-3">
                {{ mostTraded?.symbol || '-' }}
              </v-chip>
              <div>
                <div class="text-h5">{{ mostTraded?.trades || 0 }} trades</div>
                <div class="text-caption">
                  {{ mostTraded?.profit >= 0 ? '+' : '' }}${{ mostTraded?.profit?.toFixed(2) || '0.00' }}
                </div>
              </div>
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

const { coinPerformance, formatHoldTime, openCoinbase } = useTrading()

const headers = [
  { title: 'Coin', key: 'symbol', sortable: true },
  { title: 'Total Profit', key: 'profit', sortable: true },
  { title: 'Trades', key: 'trades', sortable: true },
  { title: 'Win Rate', key: 'winRate', sortable: true },
  { title: 'Wins', key: 'wins', sortable: true },
  { title: 'Losses', key: 'losses', sortable: true },
  { title: 'Avg Profit', key: 'avgProfit', sortable: true },
  { title: 'Avg Hold Time', key: 'avgHoldTime', sortable: true },
]

const bestCoin = computed(() => {
  if (!coinPerformance.value.length) return null
  return [...coinPerformance.value].sort((a, b) => b.profit - a.profit)[0]
})

const worstCoin = computed(() => {
  if (!coinPerformance.value.length) return null
  return [...coinPerformance.value].sort((a, b) => a.profit - b.profit)[0]
})

const mostTraded = computed(() => {
  if (!coinPerformance.value.length) return null
  return [...coinPerformance.value].sort((a, b) => b.trades - a.trades)[0]
})
</script>
