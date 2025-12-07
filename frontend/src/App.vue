<template>
  <v-app>
    <!-- Navigation Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      :rail="!isMobile && rail"
      :temporary="isMobile"
      :permanent="!isMobile"
      @click="isMobile ? null : (rail = false)"
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
            prepend-icon="mdi-cloud-download"
            title="Check for Updates"
            @click="checkForUpdates"
            rounded="xl"
          >
            <template v-slot:append v-if="updateAvailable">
              <v-badge color="error" dot></v-badge>
            </template>
          </v-list-item>
        </v-list>
      </template>
    </v-navigation-drawer>

    <!-- App Bar -->
    <v-app-bar color="primary" density="compact">
      <v-app-bar-nav-icon @click="isMobile ? (drawer = !drawer) : (rail = !rail)"></v-app-bar-nav-icon>
      
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
        <v-icon :start="!isMobile" icon="mdi-play" size="small"></v-icon>
        <span class="d-none d-sm-inline">Start</span>
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
        <v-icon :start="!isMobile" icon="mdi-stop" size="small"></v-icon>
        <span class="d-none d-sm-inline">Stop</span>
      </v-btn>
      
      <v-btn icon="mdi-refresh" size="small" @click="refreshData" :loading="loading"></v-btn>
    </v-app-bar>

    <!-- Update Dialog -->
    <v-dialog v-model="showUpdateDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">
          <v-icon icon="mdi-update" color="primary" class="mr-2"></v-icon>
          Software Update
        </v-card-title>
        <v-card-text>
          <div v-if="checkingUpdates" class="text-center py-4">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <div class="mt-2">Checking for updates...</div>
          </div>
          <div v-else-if="updateInfo.error">
            <v-alert type="error" class="mb-0">
              Failed to check for updates: {{ updateInfo.error }}
            </v-alert>
          </div>
          <div v-else-if="updateInfo.updateAvailable">
            <v-alert type="info" class="mb-4">
              <div class="font-weight-bold">New version available!</div>
              <div>Current: v{{ updateInfo.currentVersion }}</div>
              <div>Latest: v{{ updateInfo.latestVersion }}</div>
            </v-alert>
            <p>Click "Update Now" to download and install the latest version. The server will restart automatically.</p>
          </div>
          <div v-else>
            <v-alert type="success" class="mb-0">
              <div class="font-weight-bold">You're up to date!</div>
              <div>Current version: v{{ updateInfo.currentVersion }}</div>
              <div v-if="updateInfo.lastCheck" class="text-caption mt-1">
                Last checked: {{ formatLastCheck(updateInfo.lastCheck) }}
              </div>
            </v-alert>
          </div>
          <div v-if="updateInProgress && !updateFailed" class="text-center py-4">
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
            <div class="mt-4 text-h6">Updating...</div>
            <div class="text-caption">Please wait. The page will reload when complete.</div>
          </div>

          <div v-if="updateFailed" class="mt-4">
            <v-alert type="error" class="mb-4">
              <div class="font-weight-bold">Update Failed</div>
              <div>{{ updateInfo.error || 'An error occurred during the update.' }}</div>
            </v-alert>
          </div>

          <div v-if="updateInProgress || updateFailed || updateLogs.length" class="mt-4">
            <div class="text-subtitle-2 mb-1">Update log</div>
            <v-sheet color="grey-darken-4" class="pa-2 rounded" style="max-height: 220px; overflow-y: auto; font-family: monospace; font-size: 12px;">
              <div v-if="!updateLogs.length" class="text-medium-emphasis text-caption">Waiting for update output...</div>
              <div v-for="(line, idx) in updateLogs" :key="idx">{{ line }}</div>
            </v-sheet>
          </div>
        </v-card-text>
        <v-card-actions v-if="!updateInProgress || updateFailed">
          <v-spacer></v-spacer>
          <v-btn v-if="!updateFailed" color="grey" variant="text" @click="showUpdateDialog = false">Close</v-btn>
          <v-btn 
            v-if="updateInfo.updateAvailable && !updateFailed" 
            color="primary" 
            variant="flat" 
            @click="applyUpdate"
            :loading="updateInProgress"
          >
            Update Now
          </v-btn>
          <v-btn 
            v-if="updateFailed" 
            color="warning" 
            variant="flat" 
            @click="retryUpdate"
          >
            <v-icon start icon="mdi-refresh"></v-icon>
            Retry Update
          </v-btn>
          <v-btn 
            v-if="updateFailed" 
            color="primary" 
            variant="flat" 
            @click="forceReload"
          >
            <v-icon start icon="mdi-reload"></v-icon>
            Reload App
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
        · API: {{ botStatus.apiCalls || 0 }} total | {{ botStatus.apiRate || 0 }}/min now | {{ botStatus.apiRateHourly || 0 }}/min hourly avg
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
  { path: '/settings', name: 'Settings', meta: { icon: 'mdi-cog', title: 'Settings' } },
  { path: '/help', name: 'Help', meta: { icon: 'mdi-help-circle', title: 'Help & Info' } },
]

const currentRoute = computed(() => routes.find(r => r.path === route.path))

const { 
  loading,
  botLoading,
  wsConnected,
  lastUpdate,
  appVersion,
  updateLogs,
  botStatus,
  startBot,
  stopBot,
  refreshData,
  initialize,
  cleanup,
  clearUpdateLogs
} = useTrading()

const drawer = ref(true)
const rail = ref(true)
const isMobile = ref(window.innerWidth < 600)

// Handle window resize for mobile detection
const handleResize = () => {
  isMobile.value = window.innerWidth < 600
  if (isMobile.value) {
    drawer.value = false
  }
}
const showSnackbar = ref(false)
const snackbarText = ref('')

// Update check state
const showUpdateDialog = ref(false)
const checkingUpdates = ref(false)
const updateInProgress = ref(false)
const updateFailed = ref(false)
const updateAvailable = ref(false)
const updateInfo = ref({
  currentVersion: '',
  latestVersion: '',
  updateAvailable: false,
  lastCheck: null,
  error: null
})

const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api'

const checkForUpdates = async () => {
  showUpdateDialog.value = true
  checkingUpdates.value = true
  updateInfo.value.error = null
  
  try {
    const response = await fetch(`${API_URL}/updates/check`)
    const data = await response.json()
    updateInfo.value = data
    updateAvailable.value = data.updateAvailable
  } catch (error) {
    updateInfo.value.error = error.message
  } finally {
    checkingUpdates.value = false
  }
}

const applyUpdate = async () => {
  clearUpdateLogs()
  updateInProgress.value = true
  updateFailed.value = false
  updateInfo.value.error = null
  
  try {
    await fetch(`${API_URL}/updates/apply`, { method: 'POST' })
    
    // Wait for server to restart, then reload page
    // Set a timeout - if server doesn't come back in 2 minutes, show error
    let attempts = 0
    const maxAttempts = 60 // 2 minutes (2s intervals)
    
    const checkServer = async () => {
      attempts++
      try {
        const response = await fetch(`${API_URL}/version`)
        if (response.ok) {
          window.location.reload()
        } else {
          if (attempts >= maxAttempts) {
            updateFailed.value = true
            updateInProgress.value = false
            updateInfo.value.error = 'Server did not respond after update. It may still be restarting.'
          } else {
            setTimeout(checkServer, 2000)
          }
        }
      } catch {
        if (attempts >= maxAttempts) {
          updateFailed.value = true
          updateInProgress.value = false
          updateInfo.value.error = 'Server did not respond after update. It may still be restarting.'
        } else {
          setTimeout(checkServer, 2000)
        }
      }
    }
    
    setTimeout(checkServer, 5000)
  } catch (error) {
    updateInfo.value.error = error.message
    updateFailed.value = true
    updateInProgress.value = false
  }
}

const retryUpdate = () => {
  updateFailed.value = false
  applyUpdate()
}

const forceReload = () => {
  window.location.reload()
}

const formatLastCheck = (timestamp) => {
  if (!timestamp) return 'Never'
  const date = new Date(timestamp)
  return date.toLocaleString()
}

// Check for updates periodically (every 6 hours) and on startup
let updateCheckInterval = null

onMounted(() => {
  initialize()
  window.addEventListener('resize', handleResize)
  handleResize() // Initial check
  
  // Check for updates on startup (with delay to not block UI)
  setTimeout(async () => {
    try {
      const response = await fetch(`${API_URL}/updates/check`)
      const data = await response.json()
      updateInfo.value = data
      updateAvailable.value = data.updateAvailable
      
      // Show snackbar if update available
      if (data.updateAvailable) {
        snackbarText.value = `🆕 Update available: v${data.latestVersion}`
        showSnackbar.value = true
      }
    } catch (e) {
      // Silently fail on startup check
    }
  }, 3000)
  
  // Check for updates every 15 minutes
  updateCheckInterval = setInterval(async () => {
    try {
      const response = await fetch(`${API_URL}/updates/check`)
      const data = await response.json()
      updateInfo.value = data
      
      // Only notify if newly available
      if (data.updateAvailable && !updateAvailable.value) {
        updateAvailable.value = true
        snackbarText.value = `🆕 Update available: v${data.latestVersion}`
        showSnackbar.value = true
      }
    } catch (e) {
      // Silently fail
    }
  }, 15 * 60 * 1000)
})

onUnmounted(() => {
  cleanup()
  window.removeEventListener('resize', handleResize)
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval)
  }
})
</script>

<style>
.v-navigation-drawer--rail .v-list-item-title {
  opacity: 0;
}
</style>
