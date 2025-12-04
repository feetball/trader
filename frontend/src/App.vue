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
            <v-alert v-if="botStatus.running" type="warning" class="mt-4">
              <v-icon icon="mdi-alert" class="mr-2"></v-icon>
              The bot will be automatically stopped before updating and restarted after.
            </v-alert>
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
          <div v-if="updateInProgress" class="text-center py-4">
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
            <div class="mt-4 text-h6">Updating...</div>
            <div class="text-caption">Please wait. The page will reload when complete.</div>
          </div>

          <div v-if="updateInProgress || updateLogs.length" class="mt-4">
            <div class="text-subtitle-2 mb-1">Update log</div>
            <v-sheet color="grey-darken-4" class="pa-2 rounded" style="max-height: 220px; overflow-y: auto; font-family: monospace; font-size: 12px;">
              <div v-if="!updateLogs.length" class="text-medium-emphasis text-caption">Waiting for update output...</div>
              <div v-for="(line, idx) in updateLogs" :key="idx">{{ line }}</div>
            </v-sheet>
          </div>
        </v-card-text>
        <v-card-actions v-if="!updateInProgress">
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="showUpdateDialog = false">Close</v-btn>
          <v-btn 
            v-if="updateInfo.updateAvailable" 
            color="primary" 
            variant="flat" 
            @click="applyUpdate"
            :loading="updateInProgress"
          >
            Update Now
          </v-btn>
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
              <v-tooltip location="top" max-width="400">
                <template v-slot:activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    v-model.number="settings.MAX_PRICE"
                    label="Max Coin Price ($)"
                    type="number"
                    step="0.1"
                    hint="Only trade coins below this price"
                    persistent-hint
                  ></v-text-field>
                </template>
                <span><b>Max Coin Price</b><br><br>Only considers coins trading below this price.<br><br><b>Why it matters:</b> Lower-priced coins (penny cryptos) tend to have higher percentage volatility. A $0.10 coin moving to $0.12 is a 20% gain, while a $50,000 coin rarely moves 20% in a day.<br><br><b>Examples:</b><br>• $0.50 = Very volatile micro-caps only<br>• $1.00 = Sub-dollar penny cryptos (default)<br>• $5.00 = Includes more established small caps<br>• $50.00 = Most altcoins except top 10<br><br><b>Recommendation:</b> Start with $1.00 for maximum momentum potential, increase if you want more coin options.</span>
              </v-tooltip>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-tooltip location="top" max-width="400">
                <template v-slot:activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    v-model.number="settings.POSITION_SIZE"
                    label="Position Size ($)"
                    type="number"
                    step="50"
                    hint="Amount to invest per trade"
                    persistent-hint
                  ></v-text-field>
                </template>
                <span><b>Position Size</b><br><br>Dollar amount invested in each individual trade.<br><br><b>How it works:</b> When the bot finds a buy signal, it purchases exactly this amount worth of the coin.<br><br><b>Capital calculation:</b><br>Position Size × Max Positions = Max Capital at Risk<br><br><b>Examples:</b><br>• $50 × 5 positions = $250 max exposure<br>• $100 × 5 positions = $500 max exposure<br>• $200 × 10 positions = $2,000 max exposure<br><br><b>Profit/Loss example:</b><br>$100 position with 5% profit = $5 gain<br>$100 position with -3% stop loss = $3 loss<br><br><b>Recommendation:</b> Start small ($50-100) while testing. Scale up once you're confident in your settings.</span>
              </v-tooltip>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-tooltip location="top" max-width="400">
                <template v-slot:activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    v-model.number="settings.MAX_POSITIONS"
                    label="Max Positions"
                    type="number"
                    hint="Maximum concurrent open positions"
                    persistent-hint
                  ></v-text-field>
                </template>
                <span><b>Max Positions</b><br><br>Maximum number of different coins the bot can hold at once.<br><br><b>Trade-offs:</b><br>• More positions = More diversification, less risk per coin<br>• Fewer positions = Concentrated bets, higher risk/reward<br><br><b>Examples:</b><br>• 3 positions: Focused strategy, easier to monitor<br>• 5 positions: Balanced approach (recommended)<br>• 10 positions: Maximum diversification<br>• 15+ positions: Very spread out, may dilute gains<br><br><b>Capital needed:</b><br>If Position Size = $100:<br>• 3 max = Need $300 capital<br>• 5 max = Need $500 capital<br>• 10 max = Need $1,000 capital<br><br><b>Recommendation:</b> 5-7 positions balances diversification with meaningful position sizes.</span>
              </v-tooltip>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-tooltip location="top" max-width="400">
                <template v-slot:activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    v-model.number="settings.MIN_VOLUME"
                    label="Min 24h Volume ($)"
                    type="number"
                    step="1000"
                    hint="Minimum trading volume required"
                    persistent-hint
                  ></v-text-field>
                </template>
                <span><b>Minimum 24h Volume</b><br><br>Only trades coins with at least this much trading volume in the last 24 hours.<br><br><b>Why it matters:</b><br>• Low volume = Wide bid/ask spreads, hard to buy/sell<br>• High volume = Tight spreads, instant fills<br><br><b>What happens with low volume:</b><br>You might see +5% profit but only get +2% when selling due to slippage and spread.<br><br><b>Examples:</b><br>• $5,000: Very risky, may have 2-5% spreads<br>• $10,000: Minimum viable (default)<br>• $50,000: Good liquidity for most orders<br>• $100,000+: Excellent liquidity, minimal slippage<br><br><b>Recommendation:</b> $10,000 minimum. Increase to $50,000+ if you're trading larger position sizes ($500+).</span>
              </v-tooltip>
            </v-col>
            
            <v-col cols="12">
              <v-divider class="my-2"></v-divider>
              <div class="text-subtitle-1 font-weight-bold mb-2">Entry & Exit Rules</div>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-tooltip location="top" max-width="400">
                <template v-slot:activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    v-model.number="settings.MOMENTUM_THRESHOLD"
                    label="Momentum Threshold (%)"
                    type="number"
                    step="0.1"
                    hint="Min price increase to trigger buy"
                    persistent-hint
                  ></v-text-field>
                </template>
                <span><b>Momentum Threshold</b><br><br>The coin's price must have increased by at least this percentage within the Momentum Window to trigger a buy.<br><br><b>How it works:</b><br>If set to 3% with a 5-minute window, the bot only buys coins that went up 3%+ in the last 5 minutes.<br><br><b>Trade-offs:</b><br>• Higher threshold = Fewer trades, stronger signals, might miss early moves<br>• Lower threshold = More trades, catches early moves, more false signals<br><br><b>Examples:</b><br>• 1%: Very sensitive, many signals (risky)<br>• 2%: Catches most pumps early<br>• 3%: Balanced approach (recommended)<br>• 5%: Only strong moves, fewer trades<br>• 10%: Only major pumps, very selective<br><br><b>Real example:</b> DOGE goes from $0.10 → $0.103 in 5 min = 3% momentum ✓ BUY<br><br><b>Recommendation:</b> Start at 3%, adjust based on how many trades you're getting.</span>
              </v-tooltip>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-tooltip location="top" max-width="400">
                <template v-slot:activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    v-model.number="settings.PROFIT_TARGET"
                    label="Profit Target (%)"
                    type="number"
                    step="0.1"
                    hint="Target profit before considering exit"
                    persistent-hint
                  ></v-text-field>
                </template>
                <span><b>Profit Target</b><br><br>The profit percentage at which to sell (or activate trailing mode).<br><br><b>Without trailing:</b> Sells immediately when profit hits this target.<br><b>With trailing:</b> Activates trailing mode at this level, letting profits run higher.<br><br><b>Examples:</b><br>• 3%: Quick profits, exits early<br>• 5%: Balanced target (recommended)<br>• 8%: Lets winners run more<br>• 10%+: Requires strong moves to hit<br><br><b>Real example with $100 position:</b><br>• 3% target = Sell at $103 (+$3)<br>• 5% target = Sell at $105 (+$5)<br>• 10% target = Sell at $110 (+$10)<br><br><b>Important:</b> Higher targets mean fewer winning trades but larger wins. Lower targets mean more winners but smaller gains.<br><br><b>Recommendation:</b> 5% is a good starting point. If you enable trailing, you can set this lower (3%) as a minimum before letting it ride.</span>
              </v-tooltip>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-tooltip location="top" max-width="400">
                <template v-slot:activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    v-model.number="settings.MOMENTUM_WINDOW"
                    label="Momentum Window (minutes)"
                    type="number"
                    hint="Time period to measure price increase"
                    persistent-hint
                  ></v-text-field>
                </template>
                <span><b>Momentum Window</b><br><br>The time period (in minutes) used to calculate price momentum.<br><br><b>How it works:</b><br>Compares current price to price X minutes ago.<br>If Momentum Window = 5, it checks: "Is the price 3%+ higher than 5 minutes ago?"<br><br><b>Trade-offs:</b><br>• Shorter window = Catches fast pumps, more false signals<br>• Longer window = Smoother signals, might enter late<br><br><b>Examples:</b><br>• 3 min: Very fast, catches instant pumps, noisy<br>• 5 min: Quick response (recommended)<br>• 10 min: More reliable signals<br>• 15 min: Smoother, may miss the start<br>• 30 min: Very slow, likely entering too late<br><br><b>Real example:</b><br>SHIB at 12:00 = $0.00001000<br>SHIB at 12:05 = $0.00001030<br>5-min window sees 3% gain → BUY signal!<br><br><b>Recommendation:</b> 5 minutes balances speed with reliability.</span>
              </v-tooltip>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-tooltip location="top" max-width="400">
                <template v-slot:activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    v-model.number="settings.STOP_LOSS"
                    label="Stop Loss (%)"
                    type="number"
                    step="0.5"
                    hint="Max loss before selling (use negative)"
                    persistent-hint
                  ></v-text-field>
                </template>
                <span><b>Stop Loss</b><br><br>Automatically sells when your loss reaches this percentage. <b>MUST be negative!</b><br><br><b>How it works:</b><br>If you buy at $100 with -5% stop loss, it sells if position drops to $95.<br><br><b>Examples:</b><br>• -3%: Tight stop, quick exits, may get stopped out often<br>• -5%: Balanced protection (recommended)<br>• -8%: Gives more room to recover<br>• -10%: Wide stop, larger potential losses<br><br><b>Real example with $100 position:</b><br>• -3% stop = Sells at $97 (lose $3)<br>• -5% stop = Sells at $95 (lose $5)<br>• -10% stop = Sells at $90 (lose $10)<br><br><b>Risk calculation:</b><br>With $100 position and -5% stop:<br>Max loss per trade = $5<br>With 5 positions = Max $25 at risk<br><br><b>⚠️ Common mistake:</b> Don't use positive numbers! -5 is correct, not 5.<br><br><b>Recommendation:</b> -5% for volatile penny cryptos. Tighter stops (-3%) get stopped out more often.</span>
              </v-tooltip>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-tooltip location="top" max-width="400">
                <template v-slot:activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    v-model.number="settings.SCAN_INTERVAL"
                    label="Scan Interval (seconds)"
                    type="number"
                    hint="Time between market scans"
                    persistent-hint
                  ></v-text-field>
                </template>
                <span><b>Scan Interval</b><br><br>How often (in seconds) the bot scans all markets looking for buy opportunities.<br><br><b>What happens each scan:</b><br>1. Fetches all coin prices from Coinbase<br>2. Calculates momentum for each coin<br>3. Checks your open positions<br>4. Decides whether to buy or sell<br><br><b>Trade-offs:</b><br>• Faster scans = Catch pumps sooner, more API calls<br>• Slower scans = Fewer API calls, might miss fast moves<br><br><b>Examples:</b><br>• 15 sec: Very aggressive, may hit rate limits<br>• 30 sec: Fast and responsive (recommended)<br>• 60 sec: Balanced, good for most cases<br>• 120 sec: Conservative, saves API calls<br><br><b>API rate impact:</b><br>Each scan uses ~2-5 API calls<br>• 30 sec interval = ~120-300 calls/hour<br>• 60 sec interval = ~60-150 calls/hour<br><br><b>Recommendation:</b> 30-60 seconds. Only go faster if you're missing pumps, slower if hitting rate limits.</span>
              </v-tooltip>
            </v-col>
            
            <v-col cols="12">
              <v-divider class="my-2"></v-divider>
              <div class="text-subtitle-1 font-weight-bold mb-2">Trailing Profit</div>
            </v-col>
            
            <v-col cols="12" md="4">
              <v-tooltip location="top" max-width="400">
                <template v-slot:activator="{ props }">
                  <v-switch
                    v-bind="props"
                    v-model="settings.ENABLE_TRAILING_PROFIT"
                    label="Enable Trailing"
                    color="primary"
                    hint="Let winners ride after target"
                    persistent-hint
                  ></v-switch>
                </template>
                <span><b>Enable Trailing Profit</b><br><br>Instead of selling at the profit target, lets winners keep running and trails the price up.<br><br><b>How it works:</b><br>1. Position hits profit target (e.g., 5%)<br>2. Instead of selling, trailing mode activates<br>3. Bot tracks the highest price (peak)<br>4. Sells only when price drops X% from peak<br><br><b>Example WITHOUT trailing:</b><br>Buy at $1.00, target 5%<br>Price hits $1.05 → SELL at 5% profit<br>Price continues to $1.20 → You missed 15% more!<br><br><b>Example WITH trailing (2% trail):</b><br>Buy at $1.00, target 5%<br>Price hits $1.05 → Trailing activates<br>Price rises to $1.15 → New peak tracked<br>Price drops to $1.127 (2% from peak) → SELL at 12.7%!<br><br><b>When to use:</b><br>✓ Enable if you want to catch big pumps<br>✗ Disable if you prefer guaranteed smaller profits<br><br><b>Recommendation:</b> Enable it! Penny cryptos often pump 10-20%+ and trailing captures those moves.</span>
              </v-tooltip>
            </v-col>
            
            <v-col cols="12" md="4">
              <v-tooltip location="top" max-width="400">
                <template v-slot:activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    v-model.number="settings.TRAILING_STOP_PERCENT"
                    label="Trailing Stop (%)"
                    type="number"
                    step="0.1"
                    hint="Sell when drops this much from peak"
                    persistent-hint
                    :disabled="!settings.ENABLE_TRAILING_PROFIT"
                  ></v-text-field>
                </template>
                <span><b>Trailing Stop Percentage</b><br><br>Once trailing mode is active, sell when price drops this much from its peak.<br><br><b>How it works:</b><br>Bot constantly tracks the highest price since trailing started. When current price drops X% from that peak, it sells.<br><br><b>Trade-offs:</b><br>• Tighter stop (1-2%) = Locks in more profit, exits sooner<br>• Wider stop (3-5%) = Rides longer, risks giving back gains<br><br><b>Detailed example with 2% trailing stop:</b><br>• Buy at $1.00<br>• Price hits $1.05 (5%) → Trailing starts<br>• Price rises to $1.10 → Peak = $1.10<br>• Price rises to $1.15 → Peak = $1.15<br>• Price drops to $1.13 (1.7% from peak) → Still holding<br>• Price drops to $1.127 (2% from peak) → SELL!<br>• Final profit: 12.7% instead of 5%<br><br><b>Examples:</b><br>• 1%: Very tight, quick exits<br>• 2%: Good balance (recommended)<br>• 3%: More room, risks giving back gains<br>• 5%: Very wide, for major pump riding<br><br><b>Recommendation:</b> 2% works well for most penny crypto volatility.</span>
              </v-tooltip>
            </v-col>
            
            <v-col cols="12" md="4">
              <v-tooltip location="top" max-width="400">
                <template v-slot:activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    v-model.number="settings.MIN_MOMENTUM_TO_RIDE"
                    label="Min Momentum to Ride (%)"
                    type="number"
                    step="0.1"
                    hint="Min momentum to keep riding"
                    persistent-hint
                    :disabled="!settings.ENABLE_TRAILING_PROFIT"
                  ></v-text-field>
                </template>
                <span><b>Minimum Momentum to Ride</b><br><br>Exit trailing mode early if the coin's momentum drops below this level, even if trailing stop hasn't triggered.<br><br><b>Why this matters:</b><br>Sometimes a pump loses steam gradually rather than dropping sharply. This setting catches "dying momentum" and sells before a reversal.<br><br><b>How it works:</b><br>While in trailing mode, bot checks recent momentum.<br>If momentum falls below this %, it sells immediately.<br><br><b>Example:</b><br>• You're riding a coin at +8% profit<br>• Trailing stop is 2% (would sell at +6%)<br>• But momentum drops to 0.3% (below 1% threshold)<br>• Bot sells NOW at +8% instead of waiting for -2% drop<br><br><b>Trade-offs:</b><br>• Higher value = Exits sooner when pump slows<br>• Lower value = Rides longer, trusts trailing stop more<br><br><b>Examples:</b><br>• 0.5%: Very patient, relies mostly on trailing stop<br>• 1%: Balanced (recommended)<br>• 2%: Quick exit when momentum fades<br><br><b>Recommendation:</b> 1% catches momentum exhaustion while letting strong moves continue.</span>
              </v-tooltip>
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
  settings,
  startBot,
  stopBot,
  resetPortfolio,
  loadSettings,
  saveSettings,
  refreshData,
  initialize,
  cleanup,
  clearUpdateLogs
} = useTrading()

const drawer = ref(true)
const rail = ref(true)
const isMobile = ref(window.innerWidth < 600)
const resetLoading = ref(false)

// Handle window resize for mobile detection
const handleResize = () => {
  isMobile.value = window.innerWidth < 600
  if (isMobile.value) {
    drawer.value = false
  }
}
const settingsLoading = ref(false)
const showResetDialog = ref(false)
const showSettingsDialog = ref(false)
const showSnackbar = ref(false)
const snackbarText = ref('')

// Update check state
const showUpdateDialog = ref(false)
const checkingUpdates = ref(false)
const updateInProgress = ref(false)
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
  // Confirm if bot is running
  if (botStatus.value.running) {
    const confirmed = confirm('The bot will be stopped before updating and automatically restarted after. Continue?')
    if (!confirmed) return
  }
  
  clearUpdateLogs()
  updateInProgress.value = true
  
  try {
    await fetch(`${API_URL}/updates/apply`, { method: 'POST' })
    
    // Wait for server to restart, then reload page
    setTimeout(() => {
      const checkServer = async () => {
        try {
          const response = await fetch(`${API_URL}/version`)
          if (response.ok) {
            window.location.reload()
          } else {
            setTimeout(checkServer, 2000)
          }
        } catch {
          setTimeout(checkServer, 2000)
        }
      }
      checkServer()
    }, 5000)
  } catch (error) {
    updateInfo.value.error = error.message
    updateInProgress.value = false
  }
}

const formatLastCheck = (timestamp) => {
  if (!timestamp) return 'Never'
  const date = new Date(timestamp)
  return date.toLocaleString()
}

// Check for updates periodically (every 6 hours) and on startup
let updateCheckInterval = null

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
  
  // Check every minute (temporarily for testing)
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
  }, 60 * 1000)
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
