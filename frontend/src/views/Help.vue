<template>
  <v-container fluid>
    <!-- Header -->
    <v-row>
      <v-col cols="12">
        <v-card color="primary" variant="flat">
          <v-card-text class="text-center py-8">
            <v-icon icon="mdi-chart-line" size="64" class="mb-4"></v-icon>
            <div class="text-h3 font-weight-bold mb-2">Crypto Momentum Trader</div>
            <div class="text-h6">v{{ appVersion }}</div>
            <div class="text-subtitle-1 mt-2 opacity-80">
              Automated momentum trading bot for sub-$1 cryptocurrencies on Coinbase
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Description -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon icon="mdi-information" class="mr-2"></v-icon>
            About This App
          </v-card-title>
          <v-card-text>
            <p class="text-body-1 mb-4">
              This trading bot automatically scans the Coinbase market for low-priced cryptocurrencies 
              showing momentum (rapid price increases). It uses technical indicators like RSI (Relative 
              Strength Index) and volume surge detection to identify high-quality trade setups.
            </p>
            <p class="text-body-1 mb-4">
              The bot supports <strong>paper trading mode</strong> for safe testing without real money. 
              When enabled, all trades are simulated using a virtual $10,000 portfolio.
            </p>
            <v-alert type="info" variant="tonal" class="mt-4">
              <strong>Key Features:</strong>
              <ul class="mt-2">
                <li>Real-time market scanning via Coinbase WebSocket</li>
                <li>RSI filter to avoid overbought coins</li>
                <li>Volume surge detection for momentum confirmation</li>
                <li>Trade grading system (A-F grades)</li>
                <li>Trailing profit to let winners ride</li>
                <li>Configurable stop loss protection</li>
              </ul>
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Architecture -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon icon="mdi-sitemap" class="mr-2"></v-icon>
            Architecture
          </v-card-title>
          <v-card-text>
            <div class="architecture-diagram pa-4 bg-grey-darken-4 rounded text-center mb-4">
              <v-row align="center" justify="center" class="ga-4">
                <v-col cols="12" md="3">
                  <v-card variant="outlined" color="info" class="pa-3">
                    <v-icon icon="mdi-vuejs" size="32" class="mb-2"></v-icon>
                    <div class="text-subtitle-1 font-weight-bold">Frontend</div>
                    <div class="text-caption">Vue 3 + Vite</div>
                  </v-card>
                </v-col>
                
                <v-col cols="12" md="1" class="d-flex justify-center">
                  <v-icon icon="mdi-arrow-left-right" size="32" color="grey"></v-icon>
                </v-col>
                
                <v-col cols="12" md="3">
                  <v-card variant="outlined" color="success" class="pa-3">
                    <v-icon icon="mdi-nodejs" size="32" class="mb-2"></v-icon>
                    <div class="text-subtitle-1 font-weight-bold">Backend</div>
                    <div class="text-caption">Express + WebSocket</div>
                  </v-card>
                </v-col>
                
                <v-col cols="12" md="1" class="d-flex justify-center">
                  <v-icon icon="mdi-arrow-left-right" size="32" color="grey"></v-icon>
                </v-col>
                
                <v-col cols="12" md="3">
                  <v-card variant="outlined" color="warning" class="pa-3">
                    <v-icon icon="mdi-bitcoin" size="32" class="mb-2"></v-icon>
                    <div class="text-subtitle-1 font-weight-bold">Exchange</div>
                    <div class="text-caption">Coinbase API</div>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Languages & Frameworks -->
    <v-row>
      <v-col cols="12" md="6">
        <v-card height="100%">
          <v-card-title>
            <v-icon icon="mdi-code-tags" class="mr-2"></v-icon>
            Languages & Frameworks
          </v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-subheader>Backend</v-list-subheader>
              <v-list-item prepend-icon="mdi-nodejs" title="Node.js" subtitle="JavaScript runtime"></v-list-item>
              <v-list-item prepend-icon="mdi-server" title="Express" subtitle="Web framework"></v-list-item>
              <v-list-item prepend-icon="mdi-lan-connect" title="WebSocket (ws)" subtitle="Real-time communication"></v-list-item>
              
              <v-list-subheader>Frontend</v-list-subheader>
              <v-list-item prepend-icon="mdi-vuejs" title="Vue 3" subtitle="UI framework"></v-list-item>
              <v-list-item prepend-icon="mdi-material-design" title="Vuetify 3" subtitle="Material Design components"></v-list-item>
              <v-list-item prepend-icon="mdi-routes" title="Vue Router 4" subtitle="SPA navigation"></v-list-item>
              <v-list-item prepend-icon="mdi-lightning-bolt" title="Vite" subtitle="Build tool"></v-list-item>
              
              <v-list-subheader>Deployment</v-list-subheader>
              <v-list-item prepend-icon="mdi-docker" title="Docker" subtitle="Containerization"></v-list-item>
              <v-list-item prepend-icon="mdi-layers-triple" title="Docker Compose" subtitle="Multi-container orchestration"></v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="6">
        <v-card height="100%">
          <v-card-title>
            <v-icon icon="mdi-chart-box" class="mr-2"></v-icon>
            Trading Components
          </v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-subheader>Market Data</v-list-subheader>
              <v-list-item prepend-icon="mdi-api" title="Coinbase Advanced Trade API" subtitle="REST endpoints for orders/products"></v-list-item>
              <v-list-item prepend-icon="mdi-access-point" title="Coinbase WebSocket" subtitle="Real-time price feeds"></v-list-item>
              
              <v-list-subheader>Technical Indicators</v-list-subheader>
              <v-list-item prepend-icon="mdi-chart-timeline-variant" title="RSI" subtitle="Relative Strength Index (overbought filter)"></v-list-item>
              <v-list-item prepend-icon="mdi-chart-bar" title="Volume Surge" subtitle="Unusual volume detection"></v-list-item>
              <v-list-item prepend-icon="mdi-chart-line" title="VWAP" subtitle="Volume Weighted Average Price"></v-list-item>
              <v-list-item prepend-icon="mdi-chart-areaspline" title="ATR" subtitle="Average True Range (volatility)"></v-list-item>
              
              <v-list-subheader>Strategy</v-list-subheader>
              <v-list-item prepend-icon="mdi-scale-balance" title="Trade Grading" subtitle="A-F quality scores"></v-list-item>
              <v-list-item prepend-icon="mdi-trending-up" title="Trailing Profit" subtitle="Let winners ride"></v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- How to Use -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon icon="mdi-rocket-launch" class="mr-2"></v-icon>
            How to Use
          </v-card-title>
          <v-card-text>
            <v-timeline density="compact" side="end">
              <v-timeline-item dot-color="primary" size="small">
                <template v-slot:opposite>
                  <div class="text-h6">Step 1</div>
                </template>
                <v-card variant="tonal">
                  <v-card-text>
                    <div class="font-weight-bold">Open the Dashboard</div>
                    <div class="text-body-2 text-medium-emphasis">
                      Navigate to http://localhost:3001 in your browser
                    </div>
                  </v-card-text>
                </v-card>
              </v-timeline-item>
              
              <v-timeline-item dot-color="success" size="small">
                <template v-slot:opposite>
                  <div class="text-h6">Step 2</div>
                </template>
                <v-card variant="tonal">
                  <v-card-text>
                    <div class="font-weight-bold">Start the Bot</div>
                    <div class="text-body-2 text-medium-emphasis">
                      Click the <v-chip size="x-small" color="success">START</v-chip> button to begin scanning markets
                    </div>
                  </v-card-text>
                </v-card>
              </v-timeline-item>
              
              <v-timeline-item dot-color="info" size="small">
                <template v-slot:opposite>
                  <div class="text-h6">Step 3</div>
                </template>
                <v-card variant="tonal">
                  <v-card-text>
                    <div class="font-weight-bold">Bot Scans for Opportunities</div>
                    <div class="text-body-2 text-medium-emphasis">
                      The bot will auto-buy coins showing momentum (RSI + volume surge confirmation)
                    </div>
                  </v-card-text>
                </v-card>
              </v-timeline-item>
              
              <v-timeline-item dot-color="warning" size="small">
                <template v-slot:opposite>
                  <div class="text-h6">Step 4</div>
                </template>
                <v-card variant="tonal">
                  <v-card-text>
                    <div class="font-weight-bold">Automatic Exit</div>
                    <div class="text-body-2 text-medium-emphasis">
                      Positions auto-sell at profit target or stop loss. Trailing profit lets winners ride higher.
                    </div>
                  </v-card-text>
                </v-card>
              </v-timeline-item>
              
              <v-timeline-item dot-color="secondary" size="small">
                <template v-slot:opposite>
                  <div class="text-h6">Step 5</div>
                </template>
                <v-card variant="tonal">
                  <v-card-text>
                    <div class="font-weight-bold">Adjust Settings</div>
                    <div class="text-body-2 text-medium-emphasis">
                      Use the Settings (⚙️) menu to tune profit targets, stop loss, and other parameters
                    </div>
                  </v-card-text>
                </v-card>
              </v-timeline-item>
            </v-timeline>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dashboard Pages -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon icon="mdi-view-dashboard" class="mr-2"></v-icon>
            Dashboard Pages
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4" v-for="page in pages" :key="page.path">
                <v-card variant="outlined" :to="page.path" class="h-100">
                  <v-card-text class="text-center">
                    <v-icon :icon="page.icon" size="48" :color="page.color" class="mb-2"></v-icon>
                    <div class="text-h6">{{ page.title }}</div>
                    <div class="text-body-2 text-medium-emphasis">{{ page.description }}</div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Current Settings -->
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
                <v-card variant="tonal" color="primary">
                  <v-card-text class="text-center">
                    <div class="text-overline">Paper Trading</div>
                    <div class="text-h5">{{ settings.PAPER_TRADING ? 'ON' : 'OFF' }}</div>
                    <div class="text-caption">{{ settings.PAPER_TRADING ? 'Simulated' : 'REAL $' }}</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="6" md="3">
                <v-card variant="tonal" color="info">
                  <v-card-text class="text-center">
                    <div class="text-overline">Max Price</div>
                    <div class="text-h5">${{ settings.MAX_PRICE }}</div>
                    <div class="text-caption">per coin</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="6" md="3">
                <v-card variant="tonal" color="success">
                  <v-card-text class="text-center">
                    <div class="text-overline">Profit Target</div>
                    <div class="text-h5">{{ settings.PROFIT_TARGET }}%</div>
                    <div class="text-caption">exit target</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="6" md="3">
                <v-card variant="tonal" color="error">
                  <v-card-text class="text-center">
                    <div class="text-overline">Stop Loss</div>
                    <div class="text-h5">{{ settings.STOP_LOSS }}%</div>
                    <div class="text-caption">max loss</div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { useTrading } from '../composables/useTrading'

const { appVersion, settings } = useTrading()

const pages = [
  { 
    path: '/', 
    icon: 'mdi-view-dashboard', 
    title: 'Overview', 
    description: 'Portfolio summary, positions, recent trades',
    color: 'primary'
  },
  { 
    path: '/bot-status', 
    icon: 'mdi-robot', 
    title: 'Bot Status', 
    description: 'Control panel, live status, current activity',
    color: 'success'
  },
  { 
    path: '/performance', 
    icon: 'mdi-trophy', 
    title: 'Performance', 
    description: 'Detailed profit/loss analytics by coin',
    color: 'warning'
  },
  { 
    path: '/trades', 
    icon: 'mdi-history', 
    title: 'Trade History', 
    description: 'Complete trade history with filters',
    color: 'info'
  },
  { 
    path: '/activity', 
    icon: 'mdi-bell', 
    title: 'Activity', 
    description: 'Timeline of all trading events',
    color: 'secondary'
  },
  { 
    path: '/logs', 
    icon: 'mdi-console', 
    title: 'Logs', 
    description: 'Full bot output and debugging info',
    color: 'grey'
  },
]
</script>

<style scoped>
.architecture-diagram {
  overflow-x: auto;
}
</style>
