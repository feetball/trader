import fs from 'fs/promises';

/**
 * Portfolio Analytics - View your trading performance
 */
async function analyzePortfolio() {
  try {
    const data = await fs.readFile('paper-trading-data.json', 'utf-8');
    const portfolio = JSON.parse(data);

    console.log('\n' + '='.repeat(70));
    console.log('📊 TRADING BOT PERFORMANCE ANALYTICS');
    console.log('='.repeat(70));

    // Current Status
    console.log('\n💰 CURRENT PORTFOLIO');
    console.log(`   Cash Available: $${portfolio.cash.toFixed(2)}`);
    console.log(`   Open Positions: ${portfolio.positions.length}`);

    // Active Positions
    if (portfolio.positions.length > 0) {
      console.log('\n📈 OPEN POSITIONS');
      portfolio.positions.forEach((pos, i) => {
        const holdTime = Math.floor((Date.now() - pos.entryTime) / 60000);
        console.log(`   ${i + 1}. ${pos.symbol.padEnd(8)} | Entry: $${pos.entryPrice.toFixed(4)} | Target: $${pos.targetPrice.toFixed(4)} | Hold: ${holdTime}m`);
      });
    }

    // Trade History
    if (portfolio.closedTrades.length > 0) {
      console.log('\n📜 TRADE HISTORY (Last 10)');
      const recentTrades = portfolio.closedTrades.slice(-10).reverse();
      
      recentTrades.forEach((trade, i) => {
        const emoji = trade.profit > 0 ? '✅' : '❌';
        const date = new Date(trade.exitTime).toLocaleString();
        console.log(`   ${emoji} ${trade.symbol.padEnd(8)} | Entry: $${trade.entryPrice.toFixed(4)} | Exit: $${trade.exitPrice.toFixed(4)} | P&L: ${trade.profitPercent.toFixed(2)}% ($${trade.profit.toFixed(2)}) | ${Math.floor(trade.holdTimeMs/60000)}m`);
      });

      // Statistics
      console.log('\n📊 TRADING STATISTICS');
      const totalTrades = portfolio.closedTrades.length;
      const winners = portfolio.closedTrades.filter(t => t.profit > 0);
      const losers = portfolio.closedTrades.filter(t => t.profit < 0);
      const winRate = (winners.length / totalTrades * 100).toFixed(1);
      
      const totalProfit = portfolio.closedTrades.reduce((sum, t) => sum + t.profit, 0);
      const avgProfit = (totalProfit / totalTrades).toFixed(2);
      const bestTrade = portfolio.closedTrades.reduce((best, t) => t.profit > best.profit ? t : best, portfolio.closedTrades[0]);
      const worstTrade = portfolio.closedTrades.reduce((worst, t) => t.profit < worst.profit ? t : worst, portfolio.closedTrades[0]);

      console.log(`   Total Trades: ${totalTrades}`);
      console.log(`   Winners: ${winners.length} (${winRate}%)`);
      console.log(`   Losers: ${losers.length}`);
      console.log(`   Total P&L: $${totalProfit.toFixed(2)}`);
      console.log(`   Average P&L: $${avgProfit}`);
      console.log(`   Best Trade: ${bestTrade.symbol} +${bestTrade.profitPercent.toFixed(2)}% ($${bestTrade.profit.toFixed(2)})`);
      console.log(`   Worst Trade: ${worstTrade.symbol} ${worstTrade.profitPercent.toFixed(2)}% ($${worstTrade.profit.toFixed(2)})`);

      // Performance by Coin
      console.log('\n🪙 PERFORMANCE BY COIN');
      const coinStats = {};
      portfolio.closedTrades.forEach(trade => {
        if (!coinStats[trade.symbol]) {
          coinStats[trade.symbol] = { trades: 0, profit: 0, wins: 0 };
        }
        coinStats[trade.symbol].trades++;
        coinStats[trade.symbol].profit += trade.profit;
        if (trade.profit > 0) coinStats[trade.symbol].wins++;
      });

      Object.entries(coinStats)
        .sort((a, b) => b[1].profit - a[1].profit)
        .slice(0, 10)
        .forEach(([coin, stats]) => {
          const winRate = (stats.wins / stats.trades * 100).toFixed(0);
          console.log(`   ${coin.padEnd(8)} | ${stats.trades} trades | Win rate: ${winRate}% | P&L: $${stats.profit.toFixed(2)}`);
        });

      // ROI
      const initialCash = 10000;
      const currentValue = portfolio.cash + portfolio.positions.reduce((sum, p) => sum + p.investedAmount, 0);
      const roi = ((currentValue - initialCash) / initialCash * 100).toFixed(2);

      console.log('\n💎 OVERALL PERFORMANCE');
      console.log(`   Starting Capital: $${initialCash.toFixed(2)}`);
      console.log(`   Current Value: $${currentValue.toFixed(2)}`);
      console.log(`   Return on Investment: ${roi}%`);
      
    } else {
      console.log('\n📜 No trades executed yet. Start the bot with: npm start');
    }

    console.log('\n' + '='.repeat(70) + '\n');

  } catch (error) {
    console.log('\n❌ No trading data found. Run the bot first with: npm start\n');
  }
}

analyzePortfolio();
