# Crypto Momentum Trading Bot 🤖

An automated paper trading bot that monitors sub-$1 cryptocurrencies on Coinbase and executes momentum-based trades using technical indicators. **Includes a beautiful Next.js + React + Tailwind CSS multi-page dashboard!**

**Version:** 0.8.14 (Next.js Migration)

## ✨ Features

### Trading Engine
- 🔍 **Real-time Market Scanning**: WebSocket-powered live price feeds from Coinbase
- 📈 **Technical Indicators**: RSI, Volume Surge Detection, VWAP, ATR
- 🎯 **Trade Grading**: A-F quality scores to filter high-probability setups
- 📊 **Smart Entry**: RSI filter to avoid overbought coins (>75)
- 💰 **Paper Trading**: Simulated trades with virtual $10,000 portfolio
- 🛡️ **Risk Management**: Configurable stop-loss and trailing profit

### Web Dashboard
- �� Live portfolio statistics and ROI tracking
- 📈 Open positions with real-time P&L
- 📜 Complete trade history with filters
- 🏆 Performance breakdown by coin
- 🔔 Real-time activity feed
- 📝 Chronological bot logs
- ❓ Help & documentation page
- �� Material Design UI (dark mode)
- 🔌 WebSocket for instant updates

## Architecture

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Vue 3 + Vite   │◄──►│  Express API    │◄──►│  Coinbase API   │
│  (Frontend)     │    │  + WebSocket    │    │  (REST + WS)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
\`\`\`

### Languages & Frameworks
- **Backend**: Node.js, Express, WebSocket (ws)
- **Frontend**: Next.js 14, React 18, Tailwind CSS 3, Lucide Icons
- **Trading**: Coinbase Advanced Trade API, Custom indicators.js
- **Deploy**: Docker, Docker Compose

## Quick Start (Docker - Recommended)

\`\`\`bash
# Clone and start
git clone <repo-url>
cd trader

# Create paper trading data file (required for first run)
cp paper-trading-data.example.json paper-trading-data.json

# Start with Docker
./deploy.sh start

# View logs
./deploy.sh logs

# Open dashboard
open http://localhost:3001
\`\`\`

### Docker Commands
\`\`\`bash
./deploy.sh start   # Start the container
./deploy.sh stop    # Stop the container
./deploy.sh update  # Rebuild and restart
./deploy.sh logs    # View container logs
./deploy.sh shell   # Shell into container
\`\`\`

## Quick Start (Local Development)

\`\`\`bash
# Install dependencies
npm install
cd frontend && npm install && cd ..

# Start API server (includes bot controls)
npm run server

# In another terminal, start frontend dev server
npm run dashboard

# Open http://localhost:3000 (dev) or http://localhost:3001 (production)
\`\`\`

## Dashboard Pages

| Page | Description |
|------|-------------|
| **Overview** | Portfolio summary, positions, recent trades |
| **Bot Status** | Control panel, live status, scan activity |
| **Performance** | Profit/loss analytics by coin |
| **Trade History** | Complete trade log with filters |
| **Activity** | Timeline of trading events |
| **Logs** | Full bot output (chronological) |
| **Help & Info** | Documentation, architecture, usage guide |

## Configuration

Edit [config.js](config.js) to customize trading parameters:

| Setting | Default | Description |
|---------|---------|-------------|
| \`PAPER_TRADING\` | \`true\` | Simulated trading mode |
| \`MAX_PRICE\` | \`$1.00\` | Maximum coin price to trade |
| \`PROFIT_TARGET\` | \`2%\` | Target profit before exit |
| \`STOP_LOSS\` | \`-3%\` | Maximum loss before exit |
| \`MOMENTUM_THRESHOLD\` | \`1.5%\` | Min price change to trigger buy |
| \`MOMENTUM_WINDOW\` | \`10 min\` | Time window for momentum calc |
| \`SCAN_INTERVAL\` | \`10s\` | Market scan frequency |
| \`POSITION_SIZE\` | \`$500\` | Investment per trade |
| \`MAX_POSITIONS\` | \`30\` | Max concurrent positions |
| \`MIN_VOLUME\` | \`$25,000\` | Minimum 24h volume |
| \`ENABLE_TRAILING_PROFIT\` | \`true\` | Let winners ride |
| \`TRAILING_STOP_PERCENT\` | \`1.5%\` | Trailing stop distance |

Settings can also be changed via the dashboard Settings (⚙️) menu.

## How It Works

### 1. Market Scanner ([market-scanner.js](market-scanner.js))
- Fetches all USD trading pairs from Coinbase
- Filters for sub-$1 coins with sufficient volume
- Calculates momentum using real-time WebSocket prices
- **RSI Filter**: Skips overbought coins (RSI > 75)
- **Volume Surge**: Confirms momentum with unusual volume
- Ranks opportunities by composite score

### 2. Technical Indicators ([indicators.js](indicators.js))
- \`calculateRSI()\` - Relative Strength Index
- \`detectVolumeSurge()\` - Volume anomaly detection
- \`calculateVWAP()\` - Volume Weighted Average Price
- \`calculateATR()\` - Average True Range (volatility)
- \`scoreTrade()\` - A-F trade quality grading

### 3. Trading Strategy ([trading-strategy.js](trading-strategy.js))
- Evaluates opportunities each scan cycle
- **Trade Grading**: Rejects Grade D/F setups
- Opens positions on confirmed signals
- Monitors for profit target or stop loss
- Trailing profit lets winners ride higher

### 4. Paper Trading ([paper-trading.js](paper-trading.js))
- Virtual $10,000 starting portfolio
- Simulates buy/sell execution
- Tracks P&L for each trade
- Persists state to \`paper-trading-data.json\`

### 5. API Server ([server.js](server.js))
- Express REST API for dashboard
- WebSocket for real-time updates
- Bot start/stop controls
- Settings management

## File Structure

\`\`\`
trader/
├── bot-daemon.js        # Background bot process
├── bot.js               # Interactive bot runner
├── config.js            # Trading configuration
├── coinbase-client.js   # Coinbase API wrapper
├── market-scanner.js    # Market analysis & scanning
├── trading-strategy.js  # Buy/sell decision logic
├── paper-trading.js     # Virtual portfolio management
├── indicators.js        # Technical analysis functions
├── server.js            # Express API + WebSocket server
├── docker-compose.yml   # Docker configuration
├── Dockerfile           # Container build
├── deploy.sh            # Deployment script
├── frontend/
│   ├── src/
│   │   ├── App.vue              # Main layout + nav
│   │   ├── router/index.js      # Vue Router config
│   │   ├── composables/         # Shared state
│   │   ├── views/               # Page components
│   │   │   ├── Overview.vue
│   │   │   ├── BotStatus.vue
│   │   │   ├── Performance.vue
│   │   │   ├── TradeHistory.vue
│   │   │   ├── Activity.vue
│   │   │   ├── Logs.vue
│   │   │   └── Help.vue
│   │   └── plugins/vuetify.js
│   └── package.json
└── paper-trading-data.json  # Portfolio state (auto-generated)
\`\`\`

## Example Console Output

\`\`\`
╔══════════════════════════════════════════════════════════════════════════════╗
║   💹  CRYPTO MOMENTUM TRADER v1.3.0                                          ║
╠══════════════════════════════════════════════════════════════════════════════╣
║   CURRENT SETTINGS:                                                          ║
║   • Paper Trading: ON (simulated)                                            ║
║   • Max Price:     $1.00 | Position Size: $500                               ║
║   • Profit Target: 2% | Stop Loss: -3%                                       ║
║   • Momentum:      1.5% in 10 min | Max Positions: 30                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

📊 Dashboard:  http://localhost:3001
📈 API:        http://localhost:3001/api
🔌 WebSocket:  ws://localhost:3001
\`\`\`

## Safety Features

⚠️ **This bot is PAPER TRADING ONLY by default**
- No real money is used
- No real trades are executed
- All trading is simulated
- Safe for learning and testing

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| \`/api/portfolio\` | GET | Portfolio summary |
| \`/api/positions\` | GET | Open positions |
| \`/api/positions/live\` | GET | Positions with live prices |
| \`/api/trades\` | GET | Trade history |
| \`/api/performance-by-coin\` | GET | P&L by coin |
| \`/api/activity\` | GET | Recent activity |
| \`/api/bot/status\` | GET | Bot running state |
| \`/api/bot/start\` | POST | Start the bot |
| \`/api/bot/stop\` | POST | Stop the bot |
| \`/api/settings\` | GET/POST | Get/update config |
| \`/api/portfolio/reset\` | POST | Reset to $10,000 |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with Docker: \`./deploy.sh update\`
5. Submit a pull request

## Disclaimer

This is an educational project for paper trading only. Cryptocurrency trading involves substantial risk. Never trade with money you cannot afford to lose.

## License

MIT
