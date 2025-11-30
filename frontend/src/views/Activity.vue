<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-bell" class="mr-2"></v-icon>
            Recent Activity
            <v-spacer></v-spacer>
            <v-chip size="small" color="primary">
              {{ activities.length }} events
            </v-chip>
          </v-card-title>
          <v-card-text>
            <v-timeline density="comfortable" side="end">
              <v-timeline-item
                v-for="(activity, index) in activities"
                :key="index"
                :dot-color="activity.profit >= 0 ? 'success' : 'error'"
                size="small"
              >
                <template v-slot:opposite>
                  <div class="text-caption text-medium-emphasis">
                    {{ formatTimestamp(activity.timestamp) }}
                  </div>
                </template>
                <v-card variant="tonal" :color="activity.profit >= 0 ? 'success' : 'error'">
                  <v-card-text class="py-2">
                    <div class="d-flex align-center flex-wrap ga-2">
                      <v-chip size="small" color="primary" @click="openCoinbase(activity.symbol)" style="cursor: pointer;">
                        {{ activity.symbol }}
                        <v-icon end icon="mdi-open-in-new" size="x-small"></v-icon>
                      </v-chip>
                      <v-chip 
                        size="small" 
                        :color="activity.profit >= 0 ? 'success' : 'error'"
                        variant="flat"
                      >
                        {{ activity.profit >= 0 ? '+' : '' }}${{ activity.profit.toFixed(2) }}
                      </v-chip>
                      <v-chip 
                        size="x-small" 
                        :color="activity.profit >= 0 ? 'success' : 'error'"
                        variant="outlined"
                      >
                        {{ activity.profitPercent >= 0 ? '+' : '' }}{{ activity.profitPercent.toFixed(2) }}%
                      </v-chip>
                    </div>
                    <div class="text-body-2 mt-2">
                      <strong>Reason:</strong> {{ activity.reason }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      Entry: ${{ activity.entryPrice?.toFixed(6) || '-' }} → 
                      Exit: ${{ activity.exitPrice?.toFixed(6) || '-' }}
                      · Held for {{ formatHoldTime(activity.holdTimeMs) }}
                    </div>
                  </v-card-text>
                </v-card>
              </v-timeline-item>
              
              <v-timeline-item v-if="activities.length === 0" size="small" dot-color="grey">
                <v-card variant="tonal">
                  <v-card-text class="text-center py-8">
                    <v-icon icon="mdi-bell-off" size="48" class="mb-2 text-medium-emphasis"></v-icon>
                    <div class="text-h6 text-medium-emphasis">No Recent Activity</div>
                    <div class="text-body-2 text-medium-emphasis">
                      Trade completions will appear here as they happen.
                    </div>
                  </v-card-text>
                </v-card>
              </v-timeline-item>
            </v-timeline>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Activity Stats -->
    <v-row v-if="activities.length > 0">
      <v-col cols="12" md="4">
        <v-card color="success" variant="tonal">
          <v-card-text class="text-center">
            <div class="text-overline">Wins Today</div>
            <div class="text-h3">{{ todayWins }}</div>
            <div class="text-caption">+${{ todayWinAmount.toFixed(2) }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card color="error" variant="tonal">
          <v-card-text class="text-center">
            <div class="text-overline">Losses Today</div>
            <div class="text-h3">{{ todayLosses }}</div>
            <div class="text-caption">${{ todayLossAmount.toFixed(2) }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card :color="todayNet >= 0 ? 'success' : 'error'" variant="tonal">
          <v-card-text class="text-center">
            <div class="text-overline">Net Today</div>
            <div class="text-h3">{{ todayNet >= 0 ? '+' : '' }}${{ todayNet.toFixed(2) }}</div>
            <div class="text-caption">{{ todayWins + todayLosses }} trades</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed } from 'vue'
import { useTrading } from '../composables/useTrading'

const { activities, formatHoldTime, formatTimestamp, openCoinbase } = useTrading()

const today = new Date().toDateString()

const todayActivities = computed(() => {
  return activities.value.filter(a => new Date(a.timestamp).toDateString() === today)
})

const todayWins = computed(() => {
  return todayActivities.value.filter(a => a.profit > 0).length
})

const todayLosses = computed(() => {
  return todayActivities.value.filter(a => a.profit < 0).length
})

const todayWinAmount = computed(() => {
  return todayActivities.value.filter(a => a.profit > 0).reduce((sum, a) => sum + a.profit, 0)
})

const todayLossAmount = computed(() => {
  return todayActivities.value.filter(a => a.profit < 0).reduce((sum, a) => sum + a.profit, 0)
})

const todayNet = computed(() => {
  return todayWinAmount.value + todayLossAmount.value
})
</script>
