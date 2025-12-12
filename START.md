# 🚀 Quick Start Guide

## Start Everything at Once

### Windows PowerShell:
```powershell
.\start-all.ps1
```

### Windows Command Prompt:
```cmd
start-all.bat
```

### Manual Start (3 Terminals):

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

## Access Points

- **Dashboard**: http://localhost:3000
- **API Server**: http://localhost:3001

## What You'll See

### 📊 Portfolio Summary
- Total portfolio value with ROI
- Available cash and positions value
- Total profit/loss across all trades
- Win rate percentage

### 📈 Live Trading Activity
- Open positions updating in real-time
- Entry prices and profit targets
- How long you've held each position
- Current P&L for each trade

### 📜 Complete Trade History
- Every buy and sell with timestamps
- Profit/loss in dollars and percentage
- Exit reason for each trade
- Hold time duration

### 🏆 Performance Analytics
- Best and worst performing coins
- Win rate per cryptocurrency
- Total profit per coin
- Number of trades per coin

### 🔔 Activity Feed
- Real-time timeline of trades
- Recent sells with results
- Quick profit/loss overview

## 🎯 Features

✅ **Auto-refresh every 5 seconds** - Live updates  
✅ **Dark mode** - Easy on the eyes  
✅ **Responsive design** - Works on any screen size  
✅ **Modern UI** - Next.js + React + Tailwind (dark mode)  
✅ **Color-coded** - Green profits, red losses  
✅ **Sortable tables** - Click headers to sort  
✅ **No real money** - 100% paper trading  

## 💡 Tips

1. **Let the bot run** - Give it time to find opportunities and make trades
2. **Watch the dashboard** - See trades happen in real-time
3. **Check performance** - See which coins work best
4. **Adjust strategy** - Edit `config.js` based on results
5. **Monitor win rate** - Aim for >50% to be profitable

## 🛑 Stopping

Close all terminal windows or press Ctrl+C in each terminal.

The bot will save all data to `paper-trading-data.json` automatically.

## 📱 Mobile Friendly

Open http://localhost:3000 on your phone (if on same network) to monitor trades from anywhere!

---

**Ready to trade?** Run the start script and watch your bot work! 🤖💰
