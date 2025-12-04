import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import http from 'http';
import { config } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server for both Express and WebSocket
const server = http.createServer(app);

// WebSocket server for real-time updates
const wss = new WebSocketServer({ server });
const wsClients = new Set();

wss.on('connection', (ws) => {
  wsClients.add(ws);
  console.log(`[WS] Client connected (${wsClients.size} total)`);
  
  // Send current state immediately
  ws.send(JSON.stringify({ type: 'botStatus', data: botStatus }));
  
  ws.on('close', () => {
    wsClients.delete(ws);
    console.log(`[WS] Client disconnected (${wsClients.size} total)`);
  });
});

// Broadcast to all connected WebSocket clients
function broadcast(type, data) {
  const message = JSON.stringify({ type, data });
  for (const client of wsClients) {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  }
}

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
  apiCalls: 0,
  apiRate: 0, // Calls per minute (current)
  apiRateHourly: 0, // Average calls per minute over last hour
  logs: [],
};

// Track API call timestamps for rate calculation
let apiCallTimestamps = []; // Last minute
let apiCallTimestampsHourly = []; // Last hour
let lastApiCallCount = 0;
let botStartTime = null;

function updateApiRate() {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  const oneHourAgo = now - 3600000;
  
  // If we have a new API call count, record it
  if (botStatus.apiCalls > lastApiCallCount) {
    const newCalls = botStatus.apiCalls - lastApiCallCount;
    for (let i = 0; i < newCalls; i++) {
      apiCallTimestamps.push(now);
      apiCallTimestampsHourly.push(now);
    }
    lastApiCallCount = botStatus.apiCalls;
  }
  
  // Remove timestamps older than 1 minute / 1 hour
  apiCallTimestamps = apiCallTimestamps.filter(ts => ts > oneMinuteAgo);
  apiCallTimestampsHourly = apiCallTimestampsHourly.filter(ts => ts > oneHourAgo);
  
  // Current rate is calls in the last minute
  botStatus.apiRate = apiCallTimestamps.length;
  
  // Hourly average: total calls in last hour / minutes elapsed (max 60)
  const minutesRunning = botStartTime ? Math.min(60, (now - botStartTime) / 60000) : 1;
  botStatus.apiRateHourly = minutesRunning > 0 ? Math.round(apiCallTimestampsHourly.length / minutesRunning) : 0;
  
  // Broadcast updated status
  broadcast('botStatus', botStatus);
}

const MAX_LOGS = 50;

function addLog(message) {
  const timestamp = new Date().toLocaleTimeString();
  botStatus.logs.push({ timestamp, message });  // Chronological order (oldest first)
  if (botStatus.logs.length > MAX_LOGS) {
    botStatus.logs.shift();  // Remove oldest log
  }
  botStatus.lastUpdate = Date.now();
  botStatus.message = message;
  
  // Broadcast status update to all connected clients
  broadcast('botStatus', botStatus);
}

// Broadcast portfolio updates periodically when bot is running
let portfolioBroadcastInterval = null;

// Update API rate every 2 seconds so it decays properly
setInterval(() => {
  if (botStatus.running) {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const oneHourAgo = now - 3600000;
    
    // Remove timestamps older than 1 minute / 1 hour
    apiCallTimestamps = apiCallTimestamps.filter(ts => ts > oneMinuteAgo);
    apiCallTimestampsHourly = apiCallTimestampsHourly.filter(ts => ts > oneHourAgo);
    
    // Current rate
    const newRate = apiCallTimestamps.length;
    
    // Hourly average
    const minutesRunning = botStartTime ? Math.min(60, (now - botStartTime) / 60000) : 1;
    const newHourlyRate = minutesRunning > 0 ? Math.round(apiCallTimestampsHourly.length / minutesRunning) : 0;
    
    if (newRate !== botStatus.apiRate || newHourlyRate !== botStatus.apiRateHourly) {
      botStatus.apiRate = newRate;
      botStatus.apiRateHourly = newHourlyRate;
      broadcast('botStatus', botStatus);
    }
  }
}, 2000);

async function broadcastPortfolio() {
  try {
    const data = await fs.readFile('paper-trading-data.json', 'utf-8');
    const portfolio = JSON.parse(data);
    broadcast('portfolio', portfolio);
  } catch (e) {
    // Ignore errors
  }
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

// Reset portfolio to starting state
app.post('/api/portfolio/reset', async (req, res) => {
  // Don't allow reset while bot is running
  if (botProcess) {
    return res.json({ success: false, message: 'Stop the bot before resetting portfolio' });
  }

  try {
    const initialPortfolio = {
      cash: 10000,
      positions: [],
      closedTrades: []
    };
    await fs.writeFile('paper-trading-data.json', JSON.stringify(initialPortfolio, null, 2));
    res.json({ success: true, message: 'Portfolio reset to $10,000' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Get current config settings
app.get('/api/settings', async (req, res) => {
  try {
    const configContent = await fs.readFile('config.js', 'utf-8');
    
    // Parse config values from the file
    const settings = {};
    const patterns = {
      PAPER_TRADING: /PAPER_TRADING:\s*(true|false)/,
      MAX_PRICE: /MAX_PRICE:\s*([\d.]+)/,
      PROFIT_TARGET: /PROFIT_TARGET:\s*([\d.]+)/,
      MOMENTUM_THRESHOLD: /MOMENTUM_THRESHOLD:\s*([\d.]+)/,
      MOMENTUM_WINDOW: /MOMENTUM_WINDOW:\s*(\d+)/,
      SCAN_INTERVAL: /SCAN_INTERVAL:\s*(\d+)/,
      POSITION_SIZE: /POSITION_SIZE:\s*(\d+)/,
      MAX_POSITIONS: /MAX_POSITIONS:\s*(\d+)/,
      MIN_VOLUME: /MIN_VOLUME:\s*(\d+)/,
      STOP_LOSS: /STOP_LOSS:\s*(-?[\d.]+)/,
      ENABLE_TRAILING_PROFIT: /ENABLE_TRAILING_PROFIT:\s*(true|false)/,
      TRAILING_STOP_PERCENT: /TRAILING_STOP_PERCENT:\s*([\d.]+)/,
      MIN_MOMENTUM_TO_RIDE: /MIN_MOMENTUM_TO_RIDE:\s*([\d.]+)/,
    };

    for (const [key, pattern] of Object.entries(patterns)) {
      const match = configContent.match(pattern);
      if (match) {
        if (match[1] === 'true') settings[key] = true;
        else if (match[1] === 'false') settings[key] = false;
        else settings[key] = parseFloat(match[1]);
      }
    }

    res.json(settings);
  } catch (error) {
    res.json({ error: error.message });
  }
});

// Update config settings
app.post('/api/settings', async (req, res) => {
  const wasRunning = botProcess !== null;
  
  try {
    // Stop bot if running
    if (botProcess) {
      addLog('⚙️ Stopping bot to apply new settings...');
      botProcess.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 1000));
      botProcess = null;
    }

    const newSettings = req.body;
    
    // Generate new config file content
    const configContent = `// Trading bot configuration
export const config = {
  // Paper trading mode (true = simulated trades, false = real trades)
  PAPER_TRADING: ${newSettings.PAPER_TRADING ?? true},
  
  // Maximum price threshold for coins to trade
  MAX_PRICE: ${newSettings.MAX_PRICE ?? 1.00},
  
  // Profit target percentage (lowered for faster trades)
  PROFIT_TARGET: ${newSettings.PROFIT_TARGET ?? 2.5},
  
  // Minimum price change % in the last period to trigger a buy signal
  MOMENTUM_THRESHOLD: ${newSettings.MOMENTUM_THRESHOLD ?? 1.5},
  
  // Time window for momentum calculation in minutes
  MOMENTUM_WINDOW: ${newSettings.MOMENTUM_WINDOW ?? 10},
  
  // How often to scan markets (seconds)
  // WebSocket provides real-time prices, so fast scans are possible
  SCAN_INTERVAL: ${newSettings.SCAN_INTERVAL ?? 10},
  
  // Position size per trade (USD)
  POSITION_SIZE: ${newSettings.POSITION_SIZE ?? 500},
  
  // Maximum number of concurrent positions
  MAX_POSITIONS: ${newSettings.MAX_POSITIONS ?? 30},
  
  // Minimum 24h volume to consider (USD)
  MIN_VOLUME: ${newSettings.MIN_VOLUME ?? 25000},
  
  // Stop loss percentage (tighter for faster cuts)
  STOP_LOSS: ${newSettings.STOP_LOSS ?? -3.0},
  
  // Trailing profit settings - let winners ride while climbing
  ENABLE_TRAILING_PROFIT: ${newSettings.ENABLE_TRAILING_PROFIT ?? true},
  TRAILING_STOP_PERCENT: ${newSettings.TRAILING_STOP_PERCENT ?? 1.0},
  MIN_MOMENTUM_TO_RIDE: ${newSettings.MIN_MOMENTUM_TO_RIDE ?? 0.5},
};
`;

    await fs.writeFile('config.js', configContent);
    addLog('✅ Settings saved successfully');
    
    // Restart bot if it was running
    if (wasRunning) {
      addLog('🔄 Restarting bot with new settings...');
      
      // Small delay to ensure config is written
      await new Promise(resolve => setTimeout(resolve, 500));
      
      botStatus.running = true;
      botStatus.message = 'Restarting with new settings...';
      botStatus.cycleCount = 0;
      botStatus.apiCalls = 0;
      botStatus.apiRate = 0;
      botStatus.apiRateHourly = 0;
      apiCallTimestamps = [];
      apiCallTimestampsHourly = [];
      lastApiCallCount = 0;
      botStartTime = Date.now();

      botProcess = spawn('node', ['bot-daemon.js'], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      botProcess.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(l => l.trim());
        lines.forEach(line => {
          if (line.includes('[APICALLS]')) {
            const match = line.match(/\[APICALLS\]\s*(\d+)/);
            if (match) {
              botStatus.apiCalls = parseInt(match[1], 10);
              updateApiRate();
            }
          } else if (line.includes('[CYCLE]')) {
            botStatus.cycleCount++;
          } else if (line.includes('[STATUS]')) {
            const msg = line.replace(/.*\[STATUS\]\s*/, '');
            botStatus.message = msg;
            addLog(msg);
          }
        });
      });

      botProcess.stderr.on('data', (data) => {
        const msg = data.toString().trim();
        if (msg) {
          addLog(`⚠️ ${msg}`);
        }
      });

      botProcess.on('close', (code) => {
        botStatus.running = false;
        botStatus.message = `Bot stopped (exit code: ${code})`;
        addLog(`🛑 Bot stopped with code ${code}`);
        botProcess = null;
      });
      
      res.json({ success: true, message: 'Settings saved and bot restarted', restarted: true });
    } else {
      botStatus.running = false;
      res.json({ success: true, message: 'Settings saved successfully', restarted: false });
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Get live prices for positions
app.get('/api/positions/live', async (req, res) => {
  try {
    const data = await fs.readFile('paper-trading-data.json', 'utf-8');
    const portfolio = JSON.parse(data);
    
    // Fetch current prices for all positions in parallel
    const positionsWithPrices = await Promise.all(
      portfolio.positions.map(async (pos) => {
        try {
          const response = await fetch(`https://api.exchange.coinbase.com/products/${pos.productId}/ticker`);
          if (!response.ok) return { ...pos, currentPrice: null, currentPL: 0, currentPLPercent: 0 };
          const ticker = await response.json();
          const currentPrice = parseFloat(ticker.price);
          const currentValue = pos.quantity * currentPrice;
          const currentPL = currentValue - pos.investedAmount;
          const currentPLPercent = (currentPL / pos.investedAmount) * 100;
          
          return {
            ...pos,
            currentPrice,
            currentValue,
            currentPL,
            currentPLPercent,
            holdTime: Date.now() - pos.entryTime,
          };
        } catch (error) {
          return { ...pos, currentPrice: null, currentPL: 0, currentPLPercent: 0 };
        }
      })
    );
    
    res.json(positionsWithPrices);
  } catch (error) {
    res.json([]);
  }
});

// Health check - enhanced for monitoring
app.get('/api/health', async (req, res) => {
  try {
    const pkg = JSON.parse(await fs.readFile('package.json', 'utf-8'));
    const uptime = process.uptime();
    
    res.json({
      status: 'ok',
      version: pkg.version,
      uptime: Math.floor(uptime),
      uptimeFormatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
      timestamp: Date.now(),
      bot: {
        running: botStatus.running,
        cycleCount: botStatus.cycleCount,
        apiCalls: botStatus.apiCalls
      },
      websocket: {
        clients: wsClients.size
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB'
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get app version
app.get('/api/version', async (req, res) => {
  try {
    const pkg = JSON.parse(await fs.readFile('package.json', 'utf-8'));
    res.json({ version: pkg.version });
  } catch (error) {
    res.json({ version: 'unknown' });
  }
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
    botStatus.apiCalls = 0;
    botStatus.apiRate = 0;
    botStatus.apiRateHourly = 0;
    apiCallTimestamps = [];
    apiCallTimestampsHourly = [];
    lastApiCallCount = 0;
    botStartTime = Date.now();
    botStatus.logs = [];  // Clear old logs
    addLog('🚀 Bot starting...');
    addLog(`Max Price: $${config.MAX_PRICE} | Profit Target: ${config.PROFIT_TARGET}%`);

    botProcess = spawn('node', ['bot-daemon.js'], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    botProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(l => l.trim());
      lines.forEach(line => {
        // Parse [APICALLS] messages for API call count
        if (line.includes('[APICALLS]')) {
          const count = parseInt(line.replace('[APICALLS]', '').trim());
          if (!isNaN(count)) {
            botStatus.apiCalls = count;
            updateApiRate();
          }
        }
        // Parse [STATUS] messages for detailed status updates
        else if (line.includes('[STATUS]')) {
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
      
      // Stop portfolio broadcasts
      if (portfolioBroadcastInterval) {
        clearInterval(portfolioBroadcastInterval);
        portfolioBroadcastInterval = null;
      }
    });

    botProcess.on('error', (err) => {
      botProcess = null;
      botStatus.running = false;
      botStatus.message = `Failed to start: ${err.message}`;
      addLog(`❌ Failed to start: ${err.message}`);
    });
    
    // Start broadcasting portfolio updates every 2 seconds
    if (!portfolioBroadcastInterval) {
      portfolioBroadcastInterval = setInterval(broadcastPortfolio, 2000);
    }

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

server.listen(PORT, '0.0.0.0', () => {
  // Startup banner with help and architecture info
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                              ║');
  console.log('║   💹  CRYPTO MOMENTUM TRADER v1.5.5                                          ║');
  console.log('║                                                                              ║');
  console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║                                                                              ║');
  console.log('║   DESCRIPTION:                                                               ║');
  console.log('║   Automated momentum trading bot for sub-$1 cryptocurrencies on Coinbase.    ║');
  console.log('║   Uses technical indicators (RSI, volume surge, VWAP) to identify trades.   ║');
  console.log('║   Supports paper trading mode for safe testing without real money.          ║');
  console.log('║                                                                              ║');
  console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║                                                                              ║');
  console.log('║   ARCHITECTURE:                                                              ║');
  console.log('║   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         ║');
  console.log('║   │  Vue 3 + Vite   │◄──►│  Express API    │◄──►│  Coinbase API   │         ║');
  console.log('║   │  (Frontend)     │    │  + WebSocket    │    │  (REST + WS)    │         ║');
  console.log('║   └─────────────────┘    └─────────────────┘    └─────────────────┘         ║');
  console.log('║                                                                              ║');
  console.log('║   LANGUAGES & FRAMEWORKS:                                                    ║');
  console.log('║   • Backend:  Node.js, Express, WebSocket (ws)                              ║');
  console.log('║   • Frontend: Vue 3, Vuetify 3, Vue Router 4, Vite                          ║');
  console.log('║   • Trading:  Coinbase Advanced Trade API, Custom indicators.js            ║');
  console.log('║   • Deploy:   Docker, Docker Compose                                        ║');
  console.log('║                                                                              ║');
  console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║                                                                              ║');
  console.log('║   HOW TO USE:                                                                ║');
  console.log('║   1. Open dashboard at http://localhost:' + PORT + '                               ║');
  console.log('║   2. Click START to begin scanning markets for opportunities               ║');
  console.log('║   3. Bot will auto-buy coins showing momentum (RSI + volume surge)         ║');
  console.log('║   4. Positions auto-sell at profit target or stop loss                     ║');
  console.log('║   5. Use Settings (⚙️) to adjust trading parameters                         ║');
  console.log('║                                                                              ║');
  console.log('║   DASHBOARD PAGES:                                                           ║');
  console.log('║   • Overview    - Portfolio summary, positions, recent trades              ║');
  console.log('║   • Bot Status  - Control panel, live status, current activity             ║');
  console.log('║   • Performance - Detailed profit/loss analytics by coin                   ║');
  console.log('║   • Trades      - Complete trade history with filters                      ║');
  console.log('║   • Activity    - Timeline of all trading events                           ║');
  console.log('║   • Logs        - Full bot output and debugging info                       ║');
  console.log('║                                                                              ║');
  console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║                                                                              ║');
  console.log('║   CURRENT SETTINGS:                                                          ║');
  console.log(`║   • Paper Trading: ${config.PAPER_TRADING ? 'ON (simulated)' : 'OFF (REAL $)'}                                             ║`);
  console.log(`║   • Max Price:     $${config.MAX_PRICE.toFixed(2)} | Position Size: $${config.POSITION_SIZE}                       ║`);
  console.log(`║   • Profit Target: ${config.PROFIT_TARGET}% | Stop Loss: ${config.STOP_LOSS}%                             ║`);
  console.log(`║   • Momentum:      ${config.MOMENTUM_THRESHOLD}% in ${config.MOMENTUM_WINDOW} min | Max Positions: ${config.MAX_POSITIONS}                ║`);
  console.log('║                                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`📊 Dashboard:  http://localhost:${PORT}`);
  console.log(`📈 API:        http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket:  ws://localhost:${PORT}`);
  console.log('');
});
