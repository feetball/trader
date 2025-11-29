# Trading Bot - Quick Summary

## ✅ What Was Built

A **fully functional crypto momentum trading bot** for Coinbase that:

1. **Scans Markets** - Monitors 300+ cryptocurrency pairs in real-time
2. **Identifies Opportunities** - Finds sub-$1 coins showing upward momentum
3. **Executes Trades** - Automatically buys on momentum signals
4. **Takes Profits** - Sells at 5% profit target
5. **Manages Risk** - Includes stop-loss and position limits
6. **Tracks Performance** - Logs all trades and portfolio value

## 🎯 Trading Strategy

**BUY when:**
- Price is under $1.00
- 24h volume > $50,000
- Price is up 3%+ in last 15 minutes
- Less than 10 positions open
- Sufficient cash available

**SELL when:**
- 5% profit reached (primary target)
- -10% loss (stop loss)
- 4 hours elapsed and in profit

## 💰 Paper Trading Mode

- Starts with **$10,000 virtual cash**
- All trades are **100% simulated**
- **No real money** involved
- Safe for learning and testing

## 🚀 How to Use

```bash
# Test connection
npm test

# Start trading bot
npm start

# Stop bot
Press Ctrl+C
```

## 📁 Key Files

- `bot.js` - Main trading loop
- `config.js` - Adjust settings here
- `market-scanner.js` - Finds opportunities
- `trading-strategy.js` - Makes buy/sell decisions
- `paper-trading.js` - Manages virtual portfolio
- `paper-trading-data.json` - Your trades (auto-created)

## 🔧 Customize Strategy

Edit `config.js` to change:
- Max price threshold ($1 default)
- Profit target (5% default)
- Momentum threshold (3% default)  
- Scan frequency (30 sec default)
- Position size ($100 default)
- Max positions (10 default)

## 📊 What You'll See

```
🔍 Scanning markets for opportunities...
Found 347 USD trading pairs
✅ Found 2 opportunities
Top opportunities:
  SPELL: $0.0003 | Momentum: 4.25% | Vol: $125k
  AXL: $0.1270 | Momentum: 3.85% | Vol: $89k

🚀 BUY SIGNAL: SPELL
✅ PAPER BUY: SPELL | Qty: 333333 @ $0.0003 | Invested: $100
   Target: $0.0003 (+5%)

📈 Checking 1 open position(s)...
   SPELL: $0.0003 | P&L: +2.5% ($2.50)

💰 PAPER SELL: SPELL | Profit: $5.12 (5.12%)
   Reason: Profit target reached
```

## ⚠️ Important Notes

1. **Paper trading only** - No real money is used
2. **For educational purposes** - Learn how algorithmic trading works
3. **Not financial advice** - This is a learning tool
4. **Market data is real** - Pulls live prices from Coinbase
5. **Your API keys** are not actually used (only public data is accessed)

## 🎓 What You Learned

- How momentum trading strategies work
- Real-time market data analysis
- Position and risk management
- Automated trading systems architecture
- Portfolio tracking and P&L calculation

---

**Ready to start?** Run `npm start` and watch your bot trade! 🤖📈
