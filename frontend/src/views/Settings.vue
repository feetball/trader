<template>
  <v-container fluid class="settings-page">
    <v-row class="mb-4" align="center">
      <v-col cols="12" class="d-flex flex-wrap align-center justify-space-between gap-2">
        <div class="d-flex align-center gap-2">
          <v-icon icon="mdi-cog" class="mr-1"></v-icon>
          <div>
            <div class="text-h5 font-weight-bold">Bot Settings</div>
            <div class="text-body-2 text-medium-emphasis">Adjust trading, risk, and automation controls</div>
          </div>
        </div>
        <div class="d-flex flex-wrap gap-2 settings-actions">
          <v-btn color="grey" variant="text" @click="refreshSettings" :loading="settingsLoading">Reset to Current</v-btn>
          <v-btn color="primary" variant="flat" @click="persistSettings" :loading="settingsLoading">
            <v-icon start icon="mdi-check"></v-icon>
            {{ botStatus.running ? 'Apply & Restart' : 'Save Settings' }}
          </v-btn>
        </div>
      </v-col>
      <v-col cols="12">
        <v-alert v-if="botStatus.running" type="info" variant="tonal" class="mb-0">
          <v-icon icon="mdi-information" class="mr-2"></v-icon>
          The bot will restart after you save changes.
        </v-alert>
      </v-col>
    </v-row>

    <v-row class="settings-grid" dense>
      <v-col cols="12" lg="6" xl="4">
        <v-card class="setting-card" variant="tonal">
          <v-card-title class="pb-1">Trading Basics</v-card-title>
          <v-card-text class="pt-1">
            <v-row dense>
              <v-col cols="12" sm="6">
                <div class="setting-field">
                  <v-switch
                    v-model="settings.PAPER_TRADING"
                    label="Paper Trading Mode"
                    color="primary"
                  ></v-switch>
                  <div class="setting-hint">
                    <v-tooltip location="top" max-width="360">
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon variant="text" size="x-small">
                          <v-icon icon="mdi-information-outline" size="small"></v-icon>
                        </v-btn>
                      </template>
                      <span><b>Paper Trading</b><br><br>Simulates buys and sells without real money. Great for testing safely.</span>
                    </v-tooltip>
                    <span>Simulate trades without real orders</span>
                  </div>
                </div>
              </v-col>

              <v-col cols="12" sm="6">
                <div class="setting-field">
                  <v-text-field
                    v-model.number="settings.MAX_PRICE"
                    label="Max Coin Price ($)"
                    type="number"
                    step="0.1"
                  ></v-text-field>
                  <div class="setting-hint">
                    <v-tooltip location="top" max-width="360">
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon variant="text" size="x-small">
                          <v-icon icon="mdi-information-outline" size="small"></v-icon>
                        </v-btn>
                      </template>
                      <span><b>Max Coin Price</b><br><br>Skip coins priced above this level. Lower values focus on cheaper coins.</span>
                    </v-tooltip>
                    <span>Skip coins priced above this</span>
                  </div>
                </div>
              </v-col>

              <v-col cols="12" sm="6">
                <div class="setting-field">
                  <v-text-field
                    v-model.number="settings.POSITION_SIZE"
                    label="Position Size ($)"
                    type="number"
                    step="50"
                  ></v-text-field>
                  <div class="setting-hint">
                    <v-tooltip location="top" max-width="360">
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon variant="text" size="x-small">
                          <v-icon icon="mdi-information-outline" size="small"></v-icon>
                        </v-btn>
                      </template>
                      <span><b>Position Size</b><br><br>Dollar amount per trade. Total exposure = Position Size x Max Positions.</span>
                    </v-tooltip>
                    <span>Amount to invest per trade</span>
                  </div>
                </div>
              </v-col>

              <v-col cols="12" sm="6">
                <div class="setting-field">
                  <v-text-field
                    v-model.number="settings.MAX_POSITIONS"
                    label="Max Positions"
                    type="number"
                  ></v-text-field>
                  <div class="setting-hint">
                    <v-tooltip location="top" max-width="360">
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon variant="text" size="x-small">
                          <v-icon icon="mdi-information-outline" size="small"></v-icon>
                        </v-btn>
                      </template>
                      <span><b>Max Positions</b><br><br>Limits how many different coins you can hold at once.</span>
                    </v-tooltip>
                    <span>Maximum open positions</span>
                  </div>
                </div>
              </v-col>

              <v-col cols="12" sm="6">
                <div class="setting-field">
                  <v-text-field
                    v-model.number="settings.MIN_VOLUME"
                    label="Min 24h Volume ($)"
                    type="number"
                    step="1000"
                  ></v-text-field>
                  <div class="setting-hint">
                    <v-tooltip location="top" max-width="360">
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon variant="text" size="x-small">
                          <v-icon icon="mdi-information-outline" size="small"></v-icon>
                        </v-btn>
                      </template>
                      <span><b>Minimum 24h Volume</b><br><br>Requires sufficient liquidity to reduce slippage.</span>
                    </v-tooltip>
                    <span>Minimum trading volume required</span>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="6" xl="4">
        <v-card class="setting-card" variant="tonal">
          <v-card-title class="pb-1">Entry & Exit Rules</v-card-title>
          <v-card-text class="pt-1">
            <v-row dense>
              <v-col cols="12" sm="6">
                <div class="setting-field">
                  <v-text-field
                    v-model.number="settings.MOMENTUM_THRESHOLD"
                    label="Momentum Threshold (%)"
                    type="number"
                    step="0.1"
                  ></v-text-field>
                  <div class="setting-hint">
                    <v-tooltip location="top" max-width="360">
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon variant="text" size="x-small">
                          <v-icon icon="mdi-information-outline" size="small"></v-icon>
                        </v-btn>
                      </template>
                      <span><b>Momentum Threshold</b><br><br>Price must rise at least this percent within the window to buy.</span>
                    </v-tooltip>
                    <span>Minimum rise to trigger buy</span>
                  </div>
                </div>
              </v-col>

              <v-col cols="12" sm="6">
                <div class="setting-field">
                  <v-text-field
                    v-model.number="settings.MOMENTUM_WINDOW"
                    label="Momentum Window (minutes)"
                    type="number"
                  ></v-text-field>
                  <div class="setting-hint">
                    <v-tooltip location="top" max-width="360">
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon variant="text" size="x-small">
                          <v-icon icon="mdi-information-outline" size="small"></v-icon>
                        </v-btn>
                      </template>
                      <span><b>Momentum Window</b><br><br>Time range used to measure the price change.</span>
                    </v-tooltip>
                    <span>Time range for momentum</span>
                  </div>
                </div>
              </v-col>

              <v-col cols="12" sm="6">
                <div class="setting-field">
                  <v-text-field
                    v-model.number="settings.PROFIT_TARGET"
                    label="Profit Target (%)"
                    type="number"
                    step="0.1"
                  ></v-text-field>
                  <div class="setting-hint">
                    <v-tooltip location="top" max-width="360">
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon variant="text" size="x-small">
                          <v-icon icon="mdi-information-outline" size="small"></v-icon>
                        </v-btn>
                      </template>
                      <span><b>Profit Target</b><br><br>Take profit level before either selling or switching to trailing mode.</span>
                    </v-tooltip>
                    <span>Target profit before exit logic</span>
                  </div>
                </div>
              </v-col>

              <v-col cols="12" sm="6">
                <div class="setting-field">
                  <v-text-field
                    v-model.number="settings.STOP_LOSS"
                    label="Stop Loss (%)"
                    type="number"
                    step="0.5"
                  ></v-text-field>
                  <div class="setting-hint">
                    <v-tooltip location="top" max-width="360">
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon variant="text" size="x-small">
                          <v-icon icon="mdi-information-outline" size="small"></v-icon>
                        </v-btn>
                      </template>
                      <span><b>Stop Loss</b><br><br>Sell when loss hits this percent. Use negative numbers (example: -5).</span>
                    </v-tooltip>
                    <span>Max loss before selling (negative)</span>
                  </div>
                </div>
              </v-col>

              <v-col cols="12" sm="6">
                <div class="setting-field">
                  <v-text-field
                    v-model.number="settings.SCAN_INTERVAL"
                    label="Scan Interval (seconds)"
                    type="number"
                  ></v-text-field>
                  <div class="setting-hint">
                    <v-tooltip location="top" max-width="360">
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon variant="text" size="x-small">
                          <v-icon icon="mdi-information-outline" size="small"></v-icon>
                        </v-btn>
                      </template>
                      <span><b>Scan Interval</b><br><br>How often the bot scans markets for signals.</span>
                    </v-tooltip>
                    <span>Time between market scans</span>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="6" xl="4">
        <v-card class="setting-card" variant="tonal">
          <v-card-title class="pb-1">Entry Filters</v-card-title>
          <v-card-text class="pt-1">
            <v-row dense>
              <v-col cols="12" sm="6">
                <div class="setting-field">
                  <v-switch
                    v-model="settings.VOLUME_SURGE_FILTER"
                    label="Volume Surge Filter"
                    color="primary"
                  ></v-switch>
                  <div class="setting-hint">
                    <v-tooltip location="top" max-width="360">
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon variant="text" size="x-small">
                          <v-icon icon="mdi-information-outline" size="small"></v-icon>
                        </v-btn>
                      </template>
                      <span><b>Volume Surge</b><br><br>Require above-average volume before entering.</span>
                    </v-tooltip>
                    <span>Require above-average volume</span>
                  </div>
                </div>
              </v-col>

              <v-col cols="12" sm="6">
                <div class="setting-field">
                  <v-text-field
                    v-model.number="settings.VOLUME_SURGE_THRESHOLD"
                    label="Volume Threshold (%)"
                    type="number"
                    step="10"
                    :disabled="!settings.VOLUME_SURGE_FILTER"
                  ></v-text-field>
                  <div class="setting-hint">
                    <v-tooltip location="top" max-width="360">
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon variant="text" size="x-small">
                          <v-icon icon="mdi-information-outline" size="small"></v-icon>
                        </v-btn>
                      </template>
                      <span><b>Volume Threshold</b><br><br>Percent of average volume required. Example: 150 means 1.5x average.</span>
                    </v-tooltip>
                    <span>Min volume vs average</span>
                  </div>
                </div>
              </v-col>

              <v-col cols="12" sm="6">
                <div class="setting-field">
                  <v-switch
                    v-model="settings.RSI_FILTER"
                    label="RSI Entry Filter"
                    color="primary"
                  ></v-switch>
                  <div class="setting-hint">
                    <v-tooltip location="top" max-width="360">
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon variant="text" size="x-small">
                          <v-icon icon="mdi-information-outline" size="small"></v-icon>
                        </v-btn>
                      </template>
                      <span><b>RSI Filter</b><br><br>Only enter when RSI is inside the allowed band.</span>
                    </v-tooltip>
                    <span>Only enter within RSI range</span>
                  </div>
                </div>
              </v-col>

              <v-col cols="12" sm="6">
                <div class="setting-field">
                  <v-text-field
                    v-model.number="settings.RSI_MIN"
                    label="RSI Min"
                    type="number"
                    :disabled="!settings.RSI_FILTER"
                  ></v-text-field>
                  <div class="setting-hint">
                    <v-tooltip location="top" max-width="360">
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon variant="text" size="x-small">
                          <v-icon icon="mdi-information-outline" size="small"></v-icon>
                        </v-btn>
                      </template>
                      <span><b>RSI Min</b><br><br>Do not enter if RSI is below this value.</span>
                    </v-tooltip>
                    <span>Minimum RSI to enter</span>
                  </div>
                </div>
              </v-col>

              <v-col cols="12" sm="6">
                <div class="setting-field">
                  <v-text-field
                    v-model.number="settings.RSI_MAX"
                    label="RSI Max"
                    type="number"
                    :disabled="!settings.RSI_FILTER"
                  ></v-text-field>
                  <div class="setting-hint">
                    <v-tooltip location="top" max-width="360">
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon variant="text" size="x-small">
                          <v-icon icon="mdi-information-outline" size="small"></v-icon>
                        </v-btn>
                      </template>
                      <span><b>RSI Max</b><br><br>Do not enter if RSI is above this value.</span>
                    </v-tooltip>
                    <span>Maximum RSI to enter</span>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="6" xl="4">
        <v-card class="setting-card" variant="tonal">
          <v-card-title class="pb-1">Trailing Profit</v-card-title>
          <v-card-text class="pt-1">
            <v-row dense>
              <v-col cols="12" sm="6">
                <div class="setting-field">
                  <v-switch
                    v-model="settings.ENABLE_TRAILING_PROFIT"
                    label="Enable Trailing"
                    color="primary"
                  ></v-switch>
                  <div class="setting-hint">
                    <v-tooltip location="top" max-width="360">
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon variant="text" size="x-small">
                          <v-icon icon="mdi-information-outline" size="small"></v-icon>
                        </v-btn>
                      </template>
                      <span><b>Enable Trailing</b><br><br>After hitting profit target, trail price instead of selling immediately.</span>
                    </v-tooltip>
                    <span>Let winners ride after target</span>
                  </div>
                </div>
              </v-col>

              <v-col cols="12" sm="6">
                <div class="setting-field">
                  <v-text-field
                    v-model.number="settings.TRAILING_STOP_PERCENT"
                    label="Trailing Stop (%)"
                    type="number"
                    step="0.1"
                    :disabled="!settings.ENABLE_TRAILING_PROFIT"
                  ></v-text-field>
                  <div class="setting-hint">
                    <v-tooltip location="top" max-width="360">
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon variant="text" size="x-small">
                          <v-icon icon="mdi-information-outline" size="small"></v-icon>
                        </v-btn>
                      </template>
                      <span><b>Trailing Stop</b><br><br>Sell after price falls this percent from the peak while trailing.</span>
                    </v-tooltip>
                    <span>Sell when price drops from peak</span>
                  </div>
                </div>
              </v-col>

              <v-col cols="12" sm="6">
                <div class="setting-field">
                  <v-text-field
                    v-model.number="settings.MIN_MOMENTUM_TO_RIDE"
                    label="Min Momentum to Ride (%)"
                    type="number"
                    step="0.1"
                    :disabled="!settings.ENABLE_TRAILING_PROFIT"
                  ></v-text-field>
                  <div class="setting-hint">
                    <v-tooltip location="top" max-width="360">
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon variant="text" size="x-small">
                          <v-icon icon="mdi-information-outline" size="small"></v-icon>
                        </v-btn>
                      </template>
                      <span><b>Min Momentum to Ride</b><br><br>Exit trailing early if momentum drops below this level.</span>
                    </v-tooltip>
                    <span>Exit if momentum fades</span>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useTrading } from '../composables/useTrading'

const { botStatus, settings, loadSettings, saveSettings } = useTrading()

const settingsLoading = ref(false)

const refreshSettings = async () => {
  settingsLoading.value = true
  try {
    await loadSettings()
  } finally {
    settingsLoading.value = false
  }
}

const persistSettings = async () => {
  settingsLoading.value = true
  try {
    await saveSettings()
  } finally {
    settingsLoading.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.settings-page {
  max-width: 1400px;
  margin: 0 auto;
  padding-bottom: 24px;
}

.settings-grid {
  row-gap: 16px;
}

.setting-card {
  height: 100%;
}

.setting-field {
  display: flex;
  flex-direction: column;
}

.setting-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: -12px;
  padding-left: 8px;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.setting-hint .v-btn {
  min-width: 20px;
  width: 20px;
  height: 20px;
}

.settings-actions {
  justify-content: flex-end;
}

@media (max-width: 960px) {
  .settings-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
