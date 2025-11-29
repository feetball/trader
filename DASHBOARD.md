# Trading Bot Dashboard - Setup Guide

## 🎨 Beautiful Vue 3 + Vuetify Dashboard

Your trading bot now has a professional web dashboard!

## Quick Start

### 1. Install Backend Dependencies
```bash
npm install
```

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### 3. Start Everything

**Option A: Start All Services (Recommended)**

Open 3 terminals:

**Terminal 1 - Trading Bot:**
```bash
npm start
```

**Terminal 2 - API Server:**
```bash
npm run server
```

**Terminal 3 - Dashboard:**
```bash
npm run dashboard
```

**Option B: Just View Existing Data**

If the bot already ran and created `paper-trading-data.json`:

```bash
# Terminal 1
npm run server

# Terminal 2
npm run dashboard
```

### 4. Open Dashboard

Visit: **http://localhost:3000**

## 📊 Dashboard Features

### Real-Time Statistics
- **Total Portfolio Value** - Current worth of your virtual portfolio
- **Available Cash** - Money ready to invest
- **Total Profit/Loss** - Overall P&L across all trades
- **Win Rate** - Percentage of profitable trades

### Open Positions View
- All currently held positions
- Entry price and target price
- Investment amount
- How long you've held each position

### Performance by Coin
- See which coins perform best
- Win rate per coin
- Total profit/loss per coin
- Number of trades per coin

### Trade History
- Complete log of all executed trades
- Entry and exit prices
- Profit/loss in $ and %
- Hold time for each trade
- Exit reason (target reached, stop loss, etc.)

### Recent Activity Feed
- Timeline of recent trades
- Quick view of wins and losses
- Timestamps for all activity

## 🎯 Auto-Refresh

The dashboard automatically refreshes every 5 seconds to show live trading activity!

## 🎨 UI Features

- **Dark Mode** - Easy on the eyes
- **Responsive Design** - Works on desktop, tablet, mobile
- **Material Design** - Clean, modern Vuetify components
- **Color-Coded** - Green for profits, red for losses
- **Icons** - Material Design Icons throughout

## 📱 Screenshots

### Main Dashboard
Shows portfolio summary with 4 key metrics at the top:
- Total Value with ROI
- Available Cash
- Total Profit
- Win Rate

### Open Positions Table
Live view of all active trades waiting to hit profit targets.

### Trade History Table
Complete audit log of every trade with full details.

### Performance Analytics
See which coins are making you the most money!

## 🔧 Configuration

### API Server Port
Edit `server.js` line 6 to change port (default: 3001)

### Frontend Port
Edit `frontend/vite.config.js` to change port (default: 3000)

### Refresh Interval
Edit `frontend/src/App.vue` line 256 to change auto-refresh (default: 5000ms)

## 🚀 Development

The frontend uses:
- **Vue 3** - Modern reactive framework
- **Vuetify 3** - Material Design component library
- **Axios** - HTTP client for API calls
- **Vite** - Lightning-fast dev server

## 📦 Production Build

To create an optimized production build:

```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`

## 🐛 Troubleshooting

**Dashboard shows no data?**
- Make sure `paper-trading-data.json` exists
- Run the trading bot first: `npm start`

**API errors?**
- Check if API server is running on port 3001
- Run: `npm run server`

**Port already in use?**
- Change ports in config files mentioned above

## 🎯 Next Steps

1. Start the trading bot and let it run for a while
2. Watch the dashboard update in real-time
3. Analyze which coins perform best
4. Adjust trading strategy in `config.js` based on results
5. Monitor your win rate and ROI

Enjoy your professional trading dashboard! 📈
