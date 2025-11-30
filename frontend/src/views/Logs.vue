<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-console" class="mr-2"></v-icon>
            Bot Logs
            <v-spacer></v-spacer>
            <v-chip 
              size="small" 
              :color="botStatus.running ? 'success' : 'grey'"
              class="mr-2"
            >
              {{ botStatus.running ? 'Running' : 'Stopped' }}
            </v-chip>
            <v-btn 
              size="small" 
              variant="tonal" 
              @click="scrollToBottom"
              class="mr-2"
            >
              <v-icon start icon="mdi-arrow-down"></v-icon>
              Latest
            </v-btn>
            <v-btn 
              size="small" 
              variant="tonal" 
              @click="refreshData"
              :loading="loading"
            >
              <v-icon start icon="mdi-refresh"></v-icon>
              Refresh
            </v-btn>
          </v-card-title>
          <v-card-text>
            <!-- Log Filters -->
            <v-row class="mb-4">
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="searchQuery"
                  label="Search logs"
                  prepend-inner-icon="mdi-magnify"
                  clearable
                  hide-details
                  density="compact"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-chip-group v-model="filterType" selected-class="text-primary">
                  <v-chip value="all" filter>All</v-chip>
                  <v-chip value="buy" filter color="success">Buys</v-chip>
                  <v-chip value="sell" filter color="info">Sells</v-chip>
                  <v-chip value="error" filter color="error">Errors</v-chip>
                  <v-chip value="scan" filter color="warning">Scans</v-chip>
                </v-chip-group>
              </v-col>
            </v-row>

            <!-- Log List (chronological - oldest at top, newest at bottom) -->
            <div ref="logContainer" class="log-container">
              <div 
                v-for="(item, index) in filteredLogs"
                :key="index"
                class="log-item d-flex align-start pa-2"
                :class="{ 'bg-surface-variant': index % 2 === 0 }"
              >
                <span class="text-caption text-medium-emphasis mr-3" style="min-width: 80px; font-family: monospace;">
                  {{ item.timestamp }}
                </span>
                <v-icon 
                  :icon="getLogIcon(item.message)" 
                  :color="getLogColor(item.message)"
                  size="small"
                  class="mr-2"
                ></v-icon>
                <span 
                  class="text-body-2 flex-grow-1" 
                  :class="getLogClass(item.message)"
                  style="font-family: monospace;"
                >
                  {{ item.message }}
                </span>
              </div>
            </div>

            <div v-if="filteredLogs.length === 0" class="text-center py-8 text-medium-emphasis">
              <v-icon icon="mdi-console" size="64" class="mb-4"></v-icon>
              <div class="text-h6">No Logs</div>
              <div class="text-body-2" v-if="searchQuery || filterType !== 'all'">
                No logs match your filter criteria.
              </div>
              <div class="text-body-2" v-else>
                Start the bot to see activity logs.
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Log Stats -->
    <v-row>
      <v-col cols="6" md="3">
        <v-card color="success" variant="tonal">
          <v-card-text class="text-center">
            <div class="text-overline">Buy Orders</div>
            <div class="text-h4">{{ buyCount }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card color="info" variant="tonal">
          <v-card-text class="text-center">
            <div class="text-overline">Sell Orders</div>
            <div class="text-h4">{{ sellCount }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card color="warning" variant="tonal">
          <v-card-text class="text-center">
            <div class="text-overline">Scans</div>
            <div class="text-h4">{{ scanCount }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card color="error" variant="tonal">
          <v-card-text class="text-center">
            <div class="text-overline">Errors</div>
            <div class="text-h4">{{ errorCount }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useTrading } from '../composables/useTrading'

const { botStatus, loading, refreshData } = useTrading()

const searchQuery = ref('')
const filterType = ref('all')
const logContainer = ref(null)

const logs = computed(() => botStatus.value.logs || [])

const filteredLogs = computed(() => {
  let result = logs.value

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(log => log.message.toLowerCase().includes(query))
  }

  // Apply type filter
  if (filterType.value !== 'all') {
    result = result.filter(log => {
      const msg = log.message.toLowerCase()
      switch (filterType.value) {
        case 'buy': return msg.includes('buy')
        case 'sell': return msg.includes('sell')
        case 'error': return msg.includes('error') || msg.includes('❌')
        case 'scan': return msg.includes('scan') || msg.includes('checking')
        default: return true
      }
    })
  }

  return result
})

// Auto-scroll to bottom when new logs arrive
watch(() => logs.value.length, async () => {
  await nextTick()
  scrollToBottom()
})

const scrollToBottom = () => {
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight
  }
}

const buyCount = computed(() => {
  return logs.value.filter(l => l.message.toLowerCase().includes('buy')).length
})

const sellCount = computed(() => {
  return logs.value.filter(l => l.message.toLowerCase().includes('sell')).length
})

const scanCount = computed(() => {
  return logs.value.filter(l => 
    l.message.toLowerCase().includes('scan') || l.message.toLowerCase().includes('checking')
  ).length
})

const errorCount = computed(() => {
  return logs.value.filter(l => 
    l.message.toLowerCase().includes('error') || l.message.includes('❌')
  ).length
})

const getLogIcon = (message) => {
  const msg = message.toLowerCase()
  if (msg.includes('buy')) return 'mdi-arrow-down-bold'
  if (msg.includes('sell')) return 'mdi-arrow-up-bold'
  if (msg.includes('error') || msg.includes('❌')) return 'mdi-alert-circle'
  if (msg.includes('scan') || msg.includes('checking')) return 'mdi-radar'
  if (msg.includes('start')) return 'mdi-play'
  if (msg.includes('stop')) return 'mdi-stop'
  return 'mdi-circle-small'
}

const getLogColor = (message) => {
  const msg = message.toLowerCase()
  if (msg.includes('buy')) return 'success'
  if (msg.includes('sell')) return 'info'
  if (msg.includes('error') || msg.includes('❌')) return 'error'
  if (msg.includes('🛑')) return 'warning'
  return 'grey'
}

const getLogClass = (message) => {
  const msg = message.toLowerCase()
  if (msg.includes('buy')) return 'text-success'
  if (msg.includes('sell')) return 'text-info'
  if (msg.includes('error') || msg.includes('❌')) return 'text-error'
  if (msg.includes('🛑')) return 'text-warning'
  return ''
}
</script>

<style scoped>
.log-item {
  border-radius: 4px;
}

.log-container {
  height: 600px;
  overflow-y: auto;
  scroll-behavior: smooth;
}
</style>
