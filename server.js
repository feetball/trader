import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static frontend files in production
const frontendPath = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(frontendPath));

// Bot process and status management
let botProcess = null;
let botStatus = {
  running: false,
  message: 'Bot is stopped',
  lastUpdate: Date.now(),
  cycleCount: 0,
  logs: [],
};

const MAX_LOGS = 50;

function addLog(message) {
  const timestamp = new Date().toLocaleTimeString();
  botStatus.logs.unshift({ timestamp, message });
  if (botStatus.logs.length > MAX_LOGS) {
    botStatus.logs.pop();
  }
  botStatus.lastUpdate = Date.now();
}

/**
 * API to serve trading data to the frontend
 */

// Get portfolio summary
app.get('/api/portfolio', async (req, res) => {
  try {
    const data = await fs.readFile('paper-trading-data.json', 'utf-8');
    const portfolio = JSON.parse(data);
    
    // Calculate stats
    let totalValue = portfolio.cash;
    portfolio.positions.forEach(pos => {
      totalValue += pos.investedAmount; // Use invested amount as current value estimate
    });

    const totalProfit = portfolio.closedTrades.reduce((sum, t) => sum + t.profit, 0);
    const winningTrades = portfolio.closedTrades.filter(t => t.profit > 0).length;
    const totalTrades = portfolio.closedTrades.length;

    res.json({
      cash: portfolio.cash,
      positionsValue: totalValue - portfolio.cash,
      totalValue,
      openPositions: portfolio.positions.length,
      totalTrades,
      winningTrades,
      losingTrades: totalTrades - winningTrades,
      winRate: totalTrades > 0 ? (winningTrades / totalTrades * 100) : 0,
      totalProfit,
      roi: ((totalValue - 10000) / 10000 * 100),
      startingCapital: 10000,
    });
  } catch (error) {
    res.json({
      cash: 10000,
      positionsValue: 0,
      totalValue: 10000,
      openPositions: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalProfit: 0,
      roi: 0,
      startingCapital: 10000,
    });
  }
});

// Get open positions
app.get('/api/positions', async (req, res) => {
  try {
    const data = await fs.readFile('paper-trading-data.json', 'utf-8');
    const portfolio = JSON.parse(data);
    
    const positions = portfolio.positions.map(pos => ({
      ...pos,
      holdTime: Date.now() - pos.entryTime,
      currentPL: 0, // Would need live prices to calculate
      currentPLPercent: 0,
    }));
    
    res.json(positions);
  } catch (error) {
    res.json([]);
  }
});

// Get trade history
app.get('/api/trades', async (req, res) => {
  try {
    const data = await fs.readFile('paper-trading-data.json', 'utf-8');
    const portfolio = JSON.parse(data);
    
    // Return most recent trades first
    const trades = [...portfolio.closedTrades].reverse();
    
    res.json(trades);
  } catch (error) {
    res.json([]);
  }
});

// Get performance by coin
app.get('/api/performance-by-coin', async (req, res) => {
  try {
    const data = await fs.readFile('paper-trading-data.json', 'utf-8');
    const portfolio = JSON.parse(data);
    
    const coinStats = {};
    portfolio.closedTrades.forEach(trade => {
      if (!coinStats[trade.symbol]) {
        coinStats[trade.symbol] = { 
          symbol: trade.symbol,
          trades: 0, 
          profit: 0, 
          wins: 0,
          losses: 0,
          totalInvested: 0,
        };
      }
      coinStats[trade.symbol].trades++;
      coinStats[trade.symbol].profit += trade.profit;
      coinStats[trade.symbol].totalInvested += trade.investedAmount;
      if (trade.profit > 0) {
        coinStats[trade.symbol].wins++;
      } else {
        coinStats[trade.symbol].losses++;
      }
    });

    const stats = Object.values(coinStats)
      .map(stat => ({
        ...stat,
        winRate: stat.trades > 0 ? (stat.wins / stat.trades * 100) : 0,
        avgProfit: stat.trades > 0 ? (stat.profit / stat.trades) : 0,
      }))
      .sort((a, b) => b.profit - a.profit);

    res.json(stats);
  } catch (error) {
    res.json([]);
  }
});

// Get recent activity (for activity feed)
app.get('/api/activity', async (req, res) => {
  try {
    const data = await fs.readFile('paper-trading-data.json', 'utf-8');
    const portfolio = JSON.parse(data);
    
    const activities = [];
    
    // Add recent trades
    portfolio.closedTrades.slice(-10).reverse().forEach(trade => {
      activities.push({
        type: 'sell',
        timestamp: trade.exitTime,
        symbol: trade.symbol,
        price: trade.exitPrice,
        profit: trade.profit,
        profitPercent: trade.profitPercent,
        reason: trade.reason,
      });
    });
    
    // Sort by timestamp
    activities.sort((a, b) => b.timestamp - a.timestamp);
    
    res.json(activities.slice(0, 20));
  } catch (error) {
    res.json([]);
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Get bot status
app.get('/api/bot/status', (req, res) => {
  res.json(botStatus);
});

// Start the bot
app.post('/api/bot/start', (req, res) => {
  if (botProcess) {
    return res.json({ success: false, message: 'Bot is already running' });
  }

  try {
    botStatus.running = true;
    botStatus.message = 'Starting bot...';
    botStatus.cycleCount = 0;
    botStatus.logs = [];
    addLog('🚀 Bot starting...');

    botProcess = spawn('node', ['bot-daemon.js'], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    botProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(l => l.trim());
      lines.forEach(line => {
        // Parse [STATUS] messages for detailed status updates
        if (line.includes('[STATUS]')) {
          const statusMsg = line.replace('[STATUS]', '').trim();
          botStatus.message = statusMsg;
        }
        // Parse bot output for status updates
        else if (line.includes('CYCLE #')) {
          const match = line.match(/CYCLE #(\d+)/);
          if (match) botStatus.cycleCount = parseInt(match[1]);
          botStatus.message = `Starting cycle #${botStatus.cycleCount}...`;
        } else if (line.includes('BUY SIGNAL')) {
          botStatus.message = `🚀 ${line.trim()}`;
        } else if (line.includes('PAPER BUY')) {
          botStatus.message = `✅ ${line.trim()}`;
        } else if (line.includes('PAPER SELL')) {
          botStatus.message = `💰 ${line.trim()}`;
        }
        
        // Add significant logs
        if (line.includes('[STATUS]') || line.includes('BUY') || line.includes('SELL') || 
            line.includes('CYCLE') || line.includes('opportunities') || line.includes('Error') || 
            line.includes('Starting') || line.includes('Target') || line.includes('🎯')) {
          addLog(line.replace('[STATUS]', '').trim());
        }
      });
    });

    botProcess.stderr.on('data', (data) => {
      const message = data.toString().trim();
      addLog(`❌ Error: ${message}`);
      botStatus.message = `Error: ${message.substring(0, 50)}...`;
    });

    botProcess.on('close', (code) => {
      botProcess = null;
      botStatus.running = false;
      botStatus.message = `Bot stopped (exit code: ${code})`;
      addLog(`🛑 Bot stopped with code ${code}`);
    });

    botProcess.on('error', (err) => {
      botProcess = null;
      botStatus.running = false;
      botStatus.message = `Failed to start: ${err.message}`;
      addLog(`❌ Failed to start: ${err.message}`);
    });

    res.json({ success: true, message: 'Bot started' });
  } catch (error) {
    botStatus.running = false;
    botStatus.message = `Failed to start: ${error.message}`;
    res.json({ success: false, message: error.message });
  }
});

// Stop the bot
app.post('/api/bot/stop', (req, res) => {
  if (!botProcess) {
    return res.json({ success: false, message: 'Bot is not running' });
  }

  try {
    botStatus.message = 'Stopping bot...';
    addLog('🛑 Stopping bot...');
    
    botProcess.kill('SIGTERM');
    
    // Force kill after 5 seconds if still running
    setTimeout(() => {
      if (botProcess) {
        botProcess.kill('SIGKILL');
      }
    }, 5000);

    res.json({ success: true, message: 'Stop signal sent' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Serve frontend for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`📊 Trading Dashboard running on http://localhost:${PORT}`);
  console.log(`📈 API and frontend served from same port`);
});
