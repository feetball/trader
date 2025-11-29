# Crypto Momentum Trading Bot 🤖

An automated paper trading bot that monitors sub-$1 cryptocurrencies on Coinbase and executes momentum-based trades with 5% profit targets. **Includes a beautiful Vue 3 + Vuetify dashboard!**

## ✨ New: Web Dashboard!

![Dashboard](https://img.shields.io/badge/Dashboard-Vue%203%20%2B%20Vuetify-4FC08D?style=for-the-badge&logo=vue.js)

**Professional real-time web interface with:**
- 📊 Live portfolio statistics and ROI tracking
- 📈 Open positions monitoring with P&L
- 📜 Complete trade history with analytics
- 🏆 Performance breakdown by cryptocurrency
- 🔔 Real-time activity feed
- 🎨 Beautiful Material Design UI (dark mode)
- 🔄 Auto-refresh every 5 seconds

**Quick Start Dashboard:**
```bash
# Install everything
npm install
cd frontend && npm install && cd ..

# Start all services at once
.\start-all.ps1

# Or manually:
npm start       # Terminal 1: Trading bot
npm run server  # Terminal 2: API server
npm run dashboard  # Terminal 3: Dashboard

# Visit: http://localhost:3000
```

See [DASHBOARD.md](DASHBOARD.md) for full dashboard documentation.

## Features

- 🔍 **Real-time Market Scanning**: Continuously monitors all sub-$1 crypto trading pairs on Coinbase
- 📈 **Momentum Detection**: Calculates price momentum using 15-minute price changes to identify trending coins
- 💰 **Paper Trading**: Simulated trades with a virtual $10,000 portfolio (no real money at risk)
- 🎯 **Automated Strategy**: 
  - Buys coins showing 3%+ momentum in the last 15 minutes
  - Automatically sells when 5% profit target is reached
  - Includes 10% stop-loss protection
  - Time-based exit after 4 hours if in profit
- 📊 **Position Management**: Tracks up to 10 concurrent positions
- 💾 **Persistent Portfolio**: Saves all trades and positions to disk

## Quick Start

1. **Install dependencies**:
```bash
npm install
```

2. **Test the connection**:
```bash
npm test
```

3. **Start the bot**:
```bash
npm start
```

The bot will:
- Start with $10,000 virtual cash
- Scan markets every 30 seconds
- Show real-time trading activity
- Save all trades to `paper-trading-data.json`

Press `Ctrl+C` to stop the bot and see final portfolio summary.

## Configuration

Edit [config.js](config.js) to customize:

| Setting | Default | Description |
|---------|---------|-------------|
| `PAPER_TRADING` | `true` | Must be true (real trading not implemented) |
| `MAX_PRICE` | `$1.00` | Maximum coin price to consider |
| `PROFIT_TARGET` | `5%` | Sell when this profit is reached |
| `MOMENTUM_THRESHOLD` | `3%` | Minimum price change to trigger buy |
| `SCAN_INTERVAL` | `30s` | How often to scan markets |
| `POSITION_SIZE` | `$100` | Amount to invest per trade |
| `MAX_POSITIONS` | `10` | Maximum concurrent positions |
| `MIN_VOLUME` | `$50,000` | Minimum 24h volume required |
| `STOP_LOSS` | `-10%` | Stop loss percentage |

## How It Works

1. **Market Scanner** ([market-scanner.js](market-scanner.js))
   - Fetches all USD trading pairs from Coinbase
   - Filters for sub-$1 coins with sufficient volume
   - Calculates 15-minute momentum using candlestick data
   - Ranks opportunities by momentum score

2. **Trading Strategy** ([trading-strategy.js](trading-strategy.js))
   - Evaluates top opportunities each cycle
   - Opens positions on strong momentum signals
   - Monitors existing positions for exit conditions
   - Executes profit-taking and stop-losses

3. **Paper Trading Engine** ([paper-trading.js](paper-trading.js))
   - Maintains virtual portfolio with cash and positions
   - Simulates buy/sell execution
   - Tracks P&L for each trade
   - Persists state to JSON file

4. **Main Bot Loop** ([bot.js](bot.js))
   - Orchestrates scanning, trading, and position management
   - Runs continuously until stopped
   - Displays progress and statistics

## Example Output

```
============================================================
🔄 CYCLE #15 | 10:45:23 AM
============================================================
🔍 Scanning markets for opportunities...
Found 347 USD trading pairs
✅ Found 3 opportunities
Top opportunities:
  SPELL: $0.0003 | Momentum: 4.25% | Vol: $125k
  AXL: $0.1270 | Momentum: 3.85% | Vol: $89k
  ONDO: $0.5109 | Momentum: 3.12% | Vol: $156k

🚀 BUY SIGNAL: SPELL
   Price: $0.0003
   Momentum: 4.25%
   24h Volume: $125k
✅ PAPER BUY: SPELL | Qty: 333333.3333 @ $0.0003 | Invested: $100.00
   Target: $0.0003 (+5%) | Stop: $0.0003 (-10%)

📈 Checking 1 open position(s)...
   SPELL: $0.0003 | P&L: 2.15% ($2.15)

⏳ Waiting 30s until next scan...
```

## File Structure

- `bot.js` - Main entry point and trading loop
- `config.js` - Configuration settings
- `coinbase-client.js` - Coinbase API wrapper  
- `market-scanner.js` - Market analysis and opportunity detection
- `trading-strategy.js` - Buy/sell decision logic
- `paper-trading.js` - Virtual portfolio management
- `test-connection.js` - API connection test
- `paper-trading-data.json` - Portfolio state (auto-generated)

## Safety Features

⚠️ **This bot is PAPER TRADING ONLY**
- No real money is used
- No real trades are executed
- All trading is simulated
- Safe for learning and testing

The Coinbase API credentials in your `.env` are not actually used for trading. The bot only uses public market data endpoints that don't require authentication.

## Next Steps

To improve the bot, consider:
- Adjusting momentum thresholds based on market conditions
- Adding technical indicators (RSI, MACD, etc.)
- Implementing trailing stop-losses
- Backtesting on historical data
- Adding alerts/notifications
- Creating a web dashboard

## Disclaimer

This is an educational project for paper trading only. Cryptocurrency trading involves substantial risk. Never trade with money you cannot afford to lose.
