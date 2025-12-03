<template>
  <v-app>
    <!-- Navigation Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail"
      permanent
      @click="rail = false"
    >
      <v-list-item
        prepend-icon="mdi-robot"
        title="Crypto Trader"
        nav
      >
        <template v-slot:append>
          <v-btn
            icon="mdi-chevron-left"
            variant="text"
            @click.stop="rail = !rail"
          ></v-btn>
        </template>
      </v-list-item>

      <v-divider></v-divider>

      <v-list density="compact" nav>
        <v-list-item
          v-for="route in routes"
          :key="route.path"
          :to="route.path"
          :prepend-icon="route.meta.icon"
          :title="route.meta.title"
          :value="route.name"
          rounded="xl"
        ></v-list-item>
      </v-list>

      <template v-slot:append>
        <v-divider></v-divider>
        <v-list density="compact" nav>
          <v-list-item
            prepend-icon="mdi-cog"
            title="Settings"
            @click="showSettingsDialog = true"
            rounded="xl"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-delete-sweep"
            title="Reset Portfolio"
            @click="showResetDialog = true"
            rounded="xl"
          ></v-list-item>
        </v-list>
      </template>
    </v-navigation-drawer>

    <!-- App Bar -->
    <v-app-bar color="primary" density="compact">
      <v-app-bar-nav-icon @click="rail = !rail"></v-app-bar-nav-icon>
      
      <v-app-bar-title>
        {{ currentRoute?.meta?.title || 'Dashboard' }}
      </v-app-bar-title>
      
      <v-spacer></v-spacer>
      
      <v-chip 
        :color="botStatus.running ? 'success' : 'grey'" 
        variant="flat" 
        class="mr-2"
        size="small"
      >
        <v-icon start :icon="botStatus.running ? 'mdi-circle' : 'mdi-circle-outline'" size="x-small"></v-icon>
        {{ botStatus.running ? 'Running' : 'Stopped' }}
      </v-chip>
      
      <v-btn 
        v-if="!botStatus.running"
        color="success" 
        variant="flat"
        size="small"
        class="mr-2"
        @click="startBot"
        :loading="botLoading"
      >
        <v-icon start icon="mdi-play" size="small"></v-icon>
        Start
      </v-btn>
      
      <v-btn 
        v-else
        color="error" 
        variant="flat"
        size="small"
        class="mr-2"
        @click="stopBot"
        :loading="botLoading"
      >
        <v-icon start icon="mdi-stop" size="small"></v-icon>
        Stop
      </v-btn>
      
      <v-btn icon="mdi-refresh" size="small" @click="refreshData" :loading="loading"></v-btn>
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
          <v-btn color="warning" variant="flat" @click="doResetPortfolio" :loading="resetLoading">Reset</v-btn>
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
          <v-btn color="primary" variant="flat" @click="doSaveSettings" :loading="settingsLoading">
            <v-icon start icon="mdi-check"></v-icon>
            {{ botStatus.running ? 'Apply & Restart' : 'Save Settings' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Main Content -->
    <v-main>
      <router-view></router-view>
    </v-main>

    <!-- Footer -->
    <v-footer app class="d-flex justify-space-between px-4">
      <div class="text-caption text-medium-emphasis">
        Last updated: {{ lastUpdate }} · 
        <span :class="wsConnected ? 'text-success' : 'text-warning'">
          {{ wsConnected ? '🟢 Live' : '🟡 Reconnecting...' }}
        </span>
        · API: {{ botStatus.apiCalls || 0 }} total ({{ botStatus.apiRate || 0 }}/min)
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
import { useRoute } from 'vue-router'
import { useTrading } from './composables/useTrading'

const route = useRoute()

const routes = [
  { path: '/', name: 'Overview', meta: { icon: 'mdi-view-dashboard', title: 'Overview' } },
  { path: '/bot-status', name: 'BotStatus', meta: { icon: 'mdi-robot', title: 'Bot Status' } },
  { path: '/performance', name: 'Performance', meta: { icon: 'mdi-trophy', title: 'Performance' } },
  { path: '/trades', name: 'TradeHistory', meta: { icon: 'mdi-history', title: 'Trade History' } },
  { path: '/activity', name: 'Activity', meta: { icon: 'mdi-bell', title: 'Recent Activity' } },
  { path: '/logs', name: 'Logs', meta: { icon: 'mdi-console', title: 'Bot Logs' } },
  { path: '/help', name: 'Help', meta: { icon: 'mdi-help-circle', title: 'Help & Info' } },
]

const currentRoute = computed(() => routes.find(r => r.path === route.path))

const { 
  loading,
  botLoading,
  wsConnected,
  lastUpdate,
  appVersion,
  botStatus,
  settings,
  startBot,
  stopBot,
  resetPortfolio,
  loadSettings,
  saveSettings,
  refreshData,
  initialize,
  cleanup
} = useTrading()

const drawer = ref(true)
const rail = ref(true)
const resetLoading = ref(false)
const settingsLoading = ref(false)
const showResetDialog = ref(false)
const showSettingsDialog = ref(false)
const showSnackbar = ref(false)
const snackbarText = ref('')

const doResetPortfolio = async () => {
  resetLoading.value = true
  const success = await resetPortfolio()
  showResetDialog.value = false
  resetLoading.value = false
  if (success) {
    snackbarText.value = '✅ Portfolio reset successfully'
    showSnackbar.value = true
  }
}

const doSaveSettings = async () => {
  settingsLoading.value = true
  try {
    const res = await saveSettings()
    showSettingsDialog.value = false
    if (res.restarted) {
      snackbarText.value = '✅ Settings saved - Bot restarting...'
    } else {
      snackbarText.value = '✅ Settings saved successfully'
    }
    showSnackbar.value = true
  } catch (error) {
    snackbarText.value = '❌ Failed to save settings'
    showSnackbar.value = true
  } finally {
    settingsLoading.value = false
  }
}

onMounted(() => {
  initialize()
})

onUnmounted(() => {
  cleanup()
})
</script>

<style>
.v-navigation-drawer--rail .v-list-item-title {
  opacity: 0;
}
</style>
