<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-robot" class="mr-2" :class="botStatus.running ? 'pulse-animation' : ''"></v-icon>
            Bot Status
            <v-spacer></v-spacer>
            <v-chip 
              :color="botStatus.running ? 'success' : 'grey'" 
              variant="flat"
              class="mr-2"
            >
              {{ botStatus.running ? 'Running' : 'Stopped' }}
            </v-chip>
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-card variant="tonal" :color="botStatus.running ? 'success' : 'grey'">
                  <v-card-text>
                    <div class="text-h5 mb-2">{{ botStatus.message }}</div>
                    <div class="d-flex flex-wrap ga-4">
                      <div>
                        <div class="text-overline">Last Update</div>
                        <div>{{ formatTimestamp(botStatus.lastUpdate) }}</div>
                      </div>
                      <div v-if="botStatus.running">
                        <div class="text-overline">Cycle Count</div>
                        <div>{{ botStatus.cycleCount }}</div>
                      </div>
                      <div>
                        <div class="text-overline">API Calls</div>
                        <div>{{ botStatus.apiCalls || 0 }}</div>
                      </div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-card variant="outlined">
                  <v-card-title>Controls</v-card-title>
                  <v-card-text>
                    <div class="d-flex ga-3 flex-wrap">
                      <v-btn 
                        v-if="!botStatus.running"
                        color="success" 
                        size="large"
                        @click="startBot"
                        :loading="botLoading"
                      >
                        <v-icon start icon="mdi-play"></v-icon>
                        Start Bot
                      </v-btn>
                      
                      <v-btn 
                        v-else
                        color="error" 
                        size="large"
                        @click="stopBot"
                        :loading="botLoading"
                      >
                        <v-icon start icon="mdi-stop"></v-icon>
                        Stop Bot
                      </v-btn>
                      
                      <v-btn 
                        color="primary"
                        size="large"
                        @click="refreshData"
                        :loading="loading"
                      >
                        <v-icon start icon="mdi-refresh"></v-icon>
                        Refresh
                      </v-btn>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Current Statistics -->
    <v-row>
      <v-col cols="12" md="3">
        <v-card>
          <v-card-text class="text-center">
            <v-icon icon="mdi-chart-line" size="48" color="primary" class="mb-2"></v-icon>
            <div class="text-overline">Open Positions</div>
            <div class="text-h3">{{ portfolio.openPositions || 0 }}</div>
            <div class="text-caption">of {{ settings.MAX_POSITIONS }} max</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card>
          <v-card-text class="text-center">
            <v-icon icon="mdi-cash" size="48" color="success" class="mb-2"></v-icon>
            <div class="text-overline">Available Cash</div>
            <div class="text-h3">${{ portfolio.cash?.toFixed(0) || '0' }}</div>
            <div class="text-caption">for new positions</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card>
          <v-card-text class="text-center">
            <v-icon icon="mdi-swap-horizontal" size="48" color="info" class="mb-2"></v-icon>
            <div class="text-overline">Total Trades</div>
            <div class="text-h3">{{ portfolio.totalTrades || 0 }}</div>
            <div class="text-caption">completed</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card>
          <v-card-text class="text-center">
            <v-icon icon="mdi-clock-outline" size="48" color="warning" class="mb-2"></v-icon>
            <div class="text-overline">Scan Interval</div>
            <div class="text-h3">{{ settings.SCAN_INTERVAL }}s</div>
            <div class="text-caption">between scans</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Current Settings Summary -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon icon="mdi-cog" class="mr-2"></v-icon>
            Current Settings
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="6" md="3">
                <v-list-item class="px-0">
                  <v-list-item-title>Max Price</v-list-item-title>
                  <v-list-item-subtitle>${{ settings.MAX_PRICE }}</v-list-item-subtitle>
                </v-list-item>
              </v-col>
              <v-col cols="6" md="3">
                <v-list-item class="px-0">
                  <v-list-item-title>Position Size</v-list-item-title>
                  <v-list-item-subtitle>${{ settings.POSITION_SIZE }}</v-list-item-subtitle>
                </v-list-item>
              </v-col>
              <v-col cols="6" md="3">
                <v-list-item class="px-0">
                  <v-list-item-title>Profit Target</v-list-item-title>
                  <v-list-item-subtitle>{{ settings.PROFIT_TARGET }}%</v-list-item-subtitle>
                </v-list-item>
              </v-col>
              <v-col cols="6" md="3">
                <v-list-item class="px-0">
                  <v-list-item-title>Stop Loss</v-list-item-title>
                  <v-list-item-subtitle>{{ settings.STOP_LOSS }}%</v-list-item-subtitle>
                </v-list-item>
              </v-col>
              <v-col cols="6" md="3">
                <v-list-item class="px-0">
                  <v-list-item-title>Momentum Threshold</v-list-item-title>
                  <v-list-item-subtitle>{{ settings.MOMENTUM_THRESHOLD }}%</v-list-item-subtitle>
                </v-list-item>
              </v-col>
              <v-col cols="6" md="3">
                <v-list-item class="px-0">
                  <v-list-item-title>Momentum Window</v-list-item-title>
                  <v-list-item-subtitle>{{ settings.MOMENTUM_WINDOW }} min</v-list-item-subtitle>
                </v-list-item>
              </v-col>
              <v-col cols="6" md="3">
                <v-list-item class="px-0">
                  <v-list-item-title>Min Volume</v-list-item-title>
                  <v-list-item-subtitle>${{ settings.MIN_VOLUME?.toLocaleString() }}</v-list-item-subtitle>
                </v-list-item>
              </v-col>
              <v-col cols="6" md="3">
                <v-list-item class="px-0">
                  <v-list-item-title>Trailing Profit</v-list-item-title>
                  <v-list-item-subtitle>{{ settings.ENABLE_TRAILING_PROFIT ? 'Enabled' : 'Disabled' }}</v-list-item-subtitle>
                </v-list-item>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent Logs Preview -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-console" class="mr-2"></v-icon>
            Recent Logs
            <v-chip size="x-small" class="ml-2" color="info" variant="tonal">newest at bottom</v-chip>
            <v-spacer></v-spacer>
            <v-btn size="small" variant="text" to="/logs">View All</v-btn>
          </v-card-title>
          <v-card-text>
            <v-list density="compact" class="log-list" style="max-height: 200px; overflow-y: auto;">
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
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed } from 'vue'
import { useTrading } from '../composables/useTrading'

const { 
  botStatus,
  botLoading,
  loading,
  portfolio,
  settings,
  startBot,
  stopBot,
  refreshData,
  formatTimestamp 
} = useTrading()

// Get the last 10 logs in chronological order (oldest first, newest last)
const recentLogs = computed(() => {
  const logs = botStatus.value.logs || []
  return logs.slice(-10)
})

const getLogClass = (message) => {
  if (message.includes('BUY')) return 'text-success'
  if (message.includes('SELL')) return 'text-info'
  if (message.includes('Error') || message.includes('❌')) return 'text-error'
  if (message.includes('🛑')) return 'text-warning'
  return ''
}
</script>

<style scoped>
.pulse-animation {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}
</style>
