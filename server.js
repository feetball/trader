import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import http from 'http';
import { defaultConfig } from './config.default.js';

// Load config: merge defaults with user settings
let config = { ...defaultConfig };
try {
  // Try to load user settings from user-settings.json first (most reliable)
  if (fsSync.existsSync('user-settings.json')) {
    const userSettings = JSON.parse(fsSync.readFileSync('user-settings.json', 'utf-8'));
    config = { ...defaultConfig, ...userSettings };
    console.log('[CONFIG] Loaded user settings from user-settings.json');
  }
  // Check if any new settings were added in defaults
  const newSettings = Object.keys(defaultConfig).filter(k => !(k in config));
  if (newSettings.length > 0) {
    console.log(`[CONFIG] Added new settings from defaults: ${newSettings.join(', ')}`);
  }
} catch (e) {
  console.log('[CONFIG] Using default configuration');
}
export { config };

// File paths for persisted settings and history
const SETTINGS_FILE = 'user-settings.json';
const SETTINGS_HISTORY_FILE = 'settings-history.json';

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

// Helper to broadcast update progress to the UI
function updateLog(message) {
  console.log(`[UPDATE] ${message}`);
  broadcast('updateLog', { message });
}

// Read settings history from disk (returns array)
async function readSettingsHistory() {
  try {
    if (fsSync.existsSync(SETTINGS_HISTORY_FILE)) {
      const raw = await fs.readFile(SETTINGS_HISTORY_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {
    console.log('[SETTINGS] Could not read settings history, starting fresh');
  }
  return [];
}

// Persist settings history (keeps most recent 50 entries)
async function writeSettingsHistory(historyEntries) {
  const trimmed = historyEntries.slice(-50);
  await fs.writeFile(SETTINGS_HISTORY_FILE, JSON.stringify(trimmed, null, 2));
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
    
    // Calculate stats (same logic as /api/portfolio)
    let totalValue = portfolio.cash;
    portfolio.positions.forEach(pos => {
      totalValue += pos.investedAmount;
    });

    const totalProfit = portfolio.closedTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
    const totalNetProfit = portfolio.closedTrades.reduce((sum, t) => sum + (t.netProfit !== undefined ? t.netProfit : t.profit || 0), 0);
    const totalFees = portfolio.closedTrades.reduce((sum, t) => sum + (t.totalFees || 0), 0);
    const winningTrades = portfolio.closedTrades.filter(t => (t.netProfit !== undefined ? t.netProfit : t.profit) > 0).length;
    const totalTrades = portfolio.closedTrades.length;

    // Broadcast calculated summary (matches /api/portfolio response)
    broadcast('portfolioSummary', {
      cash: portfolio.cash,
      positionsValue: totalValue - portfolio.cash,
      totalValue,
      openPositions: portfolio.positions.length,
      totalTrades,
      winningTrades,
      losingTrades: totalTrades - winningTrades,
      winRate: totalTrades > 0 ? (winningTrades / totalTrades * 100) : 0,
      totalProfit,
      totalNetProfit,
      totalFees,
      roi: ((totalValue - 10000) / 10000 * 100),
      startingCapital: 10000,
    });
    
    // Also broadcast positions and recent trades for live updates
    broadcast('positions', portfolio.positions);
    broadcast('trades', portfolio.closedTrades.slice(-50).reverse());
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

    const totalProfit = portfolio.closedTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
    const totalNetProfit = portfolio.closedTrades.reduce((sum, t) => sum + (t.netProfit !== undefined ? t.netProfit : t.profit || 0), 0);
    const totalFees = portfolio.closedTrades.reduce((sum, t) => sum + (t.totalFees || 0), 0);
    const winningTrades = portfolio.closedTrades.filter(t => (t.netProfit !== undefined ? t.netProfit : t.profit) > 0).length;
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
      totalNetProfit,
      totalFees,
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
      totalNetProfit: 0,
      totalFees: 0,
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

    // Return most recent trades first, capped to reduce payload/render cost
    const trades = [...portfolio.closedTrades].slice(-200).reverse();

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
  const wasRunning = !!botProcess;
  
  // Stop bot if running
  if (botProcess) {
    console.log('[RESET] Stopping bot before portfolio reset...');
    botProcess.kill();
    botProcess = null;
    botStatus.running = false;
    botStatus.message = 'Stopped for portfolio reset';
    // Wait for process to fully stop
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  try {
    const initialPortfolio = {
      cash: 10000,
      positions: [],
      closedTrades: []
    };
    await fs.writeFile('paper-trading-data.json', JSON.stringify(initialPortfolio, null, 2));
    console.log('[RESET] Portfolio reset to $10,000');
    
    // Always start the bot after reset
    console.log('[RESET] Starting bot after portfolio reset...');
    
    // Start the bot after a short delay
    setTimeout(() => {
      botStatus.running = true;
      botStatus.message = 'Starting bot...';
      botStatus.cycleCount = 0;
      botStatus.apiCalls = 0;
      botStatus.logs = [];
      
      // Broadcast status update immediately
      broadcast('botStatus', botStatus);
      
      botProcess = spawn('node', ['bot-daemon.js'], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      
      botProcess.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(l => l.trim());
        lines.forEach(line => {
          if (line.includes('[APICALLS]')) {
            const count = parseInt(line.replace('[APICALLS]', '').trim());
            if (!isNaN(count)) botStatus.apiCalls = count;
          } else if (line.includes('[STATUS]')) {
            botStatus.message = line.replace('[STATUS]', '').trim();
          } else if (line.includes('CYCLE #')) {
            const match = line.match(/CYCLE #(\d+)/);
            if (match) botStatus.cycleCount = parseInt(match[1]);
          }
          if (line.includes('BUY') || line.includes('SELL') || line.includes('CYCLE') || line.includes('Error')) {
            addLog(line.replace('[STATUS]', '').trim());
          }
        });
        // Broadcast after processing output
        broadcast('botStatus', botStatus);
      });
      
      botProcess.stderr.on('data', (data) => {
        addLog(`❌ Error: ${data.toString().trim()}`);
      });
      
      botProcess.on('close', (code) => {
        botProcess = null;
        botStatus.running = false;
        botStatus.message = `Bot stopped (exit code: ${code})`;
        broadcast('botStatus', botStatus);
      });
      
      console.log('[RESET] Bot started after portfolio reset');
    }, 500);
    
    res.json({ success: true, message: 'Portfolio reset to $10,000', wasRunning, restarted: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Confirm update and restart server (called by a client after user clicks OK)
app.post('/api/updates/confirm', async (req, res) => {
  try {
    if (!pendingUpdate) {
      return res.json({ success: false, message: 'No update pending confirmation' });
    }

    // Ensure restart flag is written so bot will start after restart
    fsSync.writeFileSync(path.join(process.cwd(), '.restart-bot'), 'true');

    // Remove the .update-pending marker if present
    try {
      const pendingPath = path.join(process.cwd(), '.update-pending');
      if (fsSync.existsSync(pendingPath)) fsSync.unlinkSync(pendingPath);
    } catch (e) {
      // non-fatal
    }

    broadcast('updateLog', { message: `[UPDATE] User confirmed restart; server will shut down now.` });
    res.json({ success: true, message: 'Confirmed. Server will restart now.' });

    // clear in-memory pendingUpdate
    pendingUpdate = null;

    // short delay to let response and broadcasts flow out, then exit
    setTimeout(() => {
      process.exit(0);
    }, 800);
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

// Get current config settings
app.get('/api/settings', async (req, res) => {
  try {
    // Start with defaults, then overlay user settings
    let settings = { ...defaultConfig };
    
    // Try to load user settings
    try {
      if (fsSync.existsSync(SETTINGS_FILE)) {
        const userSettings = JSON.parse(await fs.readFile(SETTINGS_FILE, 'utf-8'));
        settings = { ...defaultConfig, ...userSettings };
      }
    } catch (e) {
      console.log('[SETTINGS] Could not load user-settings.json, using defaults');
    }

    res.json(settings);
  } catch (error) {
    res.json({ error: error.message });
  }
});

// Get settings history (most recent first)
app.get('/api/settings/history', async (req, res) => {
  try {
    const history = await readSettingsHistory();
    res.json(history.slice().reverse());
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

    // Extract optional comment and filter only known setting keys
    const settingsComment = typeof req.body?.settingsComment === 'string'
      ? req.body.settingsComment.trim()
      : '';

    const incomingSettings = Object.fromEntries(
      Object.entries(req.body || {}).filter(([key]) => key in defaultConfig)
    );

    // Merge incoming settings with defaults (ensures new settings have values)
    const newSettings = { ...defaultConfig, ...incomingSettings };
    
    // Generate config.js content dynamically from all settings
    const configLines = Object.entries(newSettings).map(([key, value]) => {
      const formattedValue = typeof value === 'boolean' ? value : 
                            typeof value === 'string' ? `'${value}'` : value;
      return `  ${key}: ${formattedValue},`;
    }).join('\n');
    
    const configContent = `// Trading bot configuration (auto-generated from user settings)
export const config = {
${configLines}
};
`;

    await fs.writeFile('config.js', configContent);
    
    // Save to user-settings.json for persistence across updates
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(newSettings, null, 2));
    
    // Update in-memory config
    Object.assign(config, newSettings);

    // Append to settings history
    const history = await readSettingsHistory();
    history.push({
      savedAt: new Date().toISOString(),
      comment: settingsComment,
      settings: newSettings,
    });
    await writeSettingsHistory(history);
    
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

// Force sell a position
app.post('/api/positions/sell', async (req, res) => {
  try {
    const { positionId } = req.body;
    if (!positionId) {
      return res.json({ success: false, message: 'Position ID required' });
    }

    const data = await fs.readFile('paper-trading-data.json', 'utf-8');
    const portfolio = JSON.parse(data);
    
    // Find the position
    const positionIndex = portfolio.positions.findIndex(p => p.id === positionId);
    if (positionIndex === -1) {
      return res.json({ success: false, message: 'Position not found' });
    }
    
    const position = portfolio.positions[positionIndex];
    
    // Get current price
    let currentPrice = position.entryPrice;
    try {
      const response = await fetch(`https://api.exchange.coinbase.com/products/${position.productId}/ticker`);
      if (response.ok) {
        const ticker = await response.json();
        currentPrice = parseFloat(ticker.price);
      }
    } catch (e) {
      console.log(`[FORCE SELL] Using entry price, couldn't fetch current price: ${e.message}`);
    }
    
    // Calculate P&L with fees
    const feePercent = config.TAKER_FEE_PERCENT || 0.50;
    const grossValue = position.quantity * currentPrice;
    const sellFee = grossValue * (feePercent / 100);
    const netValue = grossValue - sellFee;
    const totalFees = (position.buyFee || 0) + sellFee;
    
    const grossProfit = grossValue - position.investedAmount;
    const netProfit = grossProfit - totalFees;
    const profitPercent = (grossProfit / position.investedAmount) * 100;
    const netProfitPercent = (netProfit / position.investedAmount) * 100;
    const holdTime = Date.now() - position.entryTime;
    
    // Remove position and add cash (net of sell fee)
    portfolio.positions.splice(positionIndex, 1);
    portfolio.cash += netValue;
    
    // Record closed trade
    const trade = {
      ...position,
      exitPrice: currentPrice,
      exitTime: Date.now(),
      profit: grossProfit,
      profitPercent,
      netProfit,
      netProfitPercent,
      sellFee,
      totalFees,
      holdTimeMs: holdTime,
      reason: 'Manual force sell',
    };
    portfolio.closedTrades.push(trade);
    
    // Save
    await fs.writeFile('paper-trading-data.json', JSON.stringify(portfolio, null, 2));
    
    console.log(`[FORCE SELL] ${position.symbol} @ $${currentPrice.toFixed(6)} | Gross: $${grossProfit.toFixed(2)} | Net: $${netProfit.toFixed(2)} (fees: $${totalFees.toFixed(2)})`);
    
    res.json({ 
      success: true, 
      message: `Sold ${position.symbol} for $${netValue.toFixed(2)} (net of fees)`,
      trade 
    });
  } catch (error) {
    console.error('[FORCE SELL] Error:', error.message);
    res.json({ success: false, message: error.message });
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

// Update check state
let lastUpdateCheck = null;
let cachedUpdateInfo = null;
let pendingUpdate = null; // { newVersion, timestamp }

// Automatic update checking function
async function checkForUpdates() {
  try {
    const pkg = JSON.parse(await fs.readFile('package.json', 'utf-8'));
    const currentVersion = pkg.version;
    
    // Fetch latest package.json from GitHub (with cache bust)
    const cacheBust = Date.now();
    const response = await fetch(`https://raw.githubusercontent.com/feetball/trader/master/package.json?cb=${cacheBust}`);
    if (!response.ok) {
      throw new Error(`GitHub fetch failed: ${response.status}`);
    }
    
    const remotePackage = await response.json();
    const latestVersion = remotePackage.version;
    console.log(`[AUTO-UPDATE-CHECK] current=${currentVersion} latest=${latestVersion}`);
    
    // Compare versions
    const current = currentVersion.split('.').map(Number);
    const latest = latestVersion.split('.').map(Number);
    
    let updateAvailable = false;
    for (let i = 0; i < 3; i++) {
      if (latest[i] > current[i]) {
        updateAvailable = true;
        break;
      } else if (latest[i] < current[i]) {
        break;
      }
    }
    
    lastUpdateCheck = Date.now();
    const wasAvailable = cachedUpdateInfo?.updateAvailable;
    cachedUpdateInfo = {
      currentVersion,
      latestVersion,
      updateAvailable,
      lastCheck: lastUpdateCheck,
    };
    
    // If update became available, broadcast to all clients
    if (updateAvailable && !wasAvailable) {
      console.log(`[AUTO-UPDATE] New version ${latestVersion} available! Broadcasting to clients.`);
      broadcast('updateAvailable', { newVersion: latestVersion });
    }
  } catch (error) {
    console.error('Auto update check failed:', error.message);
  }
}

// Check for updates from GitHub
app.get('/api/updates/check', async (req, res) => {
  try {
    const pkg = JSON.parse(await fs.readFile('package.json', 'utf-8'));
    const currentVersion = pkg.version;
    
    // Fetch latest package.json from GitHub (with cache bust)
    const cacheBust = Date.now();
    const response = await fetch(`https://raw.githubusercontent.com/feetball/trader/master/package.json?cb=${cacheBust}`);
    if (!response.ok) {
      throw new Error(`GitHub fetch failed: ${response.status}`);
    }
    
    const remotePackage = await response.json();
    const latestVersion = remotePackage.version;
    console.log(`[UPDATE-CHECK] current=${currentVersion} latest=${latestVersion}`);
    
    // Compare versions
    const current = currentVersion.split('.').map(Number);
    const latest = latestVersion.split('.').map(Number);
    
    let updateAvailable = false;
    for (let i = 0; i < 3; i++) {
      if (latest[i] > current[i]) {
        updateAvailable = true;
        break;
      } else if (latest[i] < current[i]) {
        break;
      }
    }
    
    lastUpdateCheck = Date.now();
    cachedUpdateInfo = {
      currentVersion,
      latestVersion,
      updateAvailable,
      lastCheck: lastUpdateCheck,
    };
    
    res.json(cachedUpdateInfo);
  } catch (error) {
    console.error('Update check failed:', error.message);
    res.json({
      currentVersion: 'unknown',
      latestVersion: 'unknown',
      updateAvailable: false,
      error: error.message,
      lastCheck: lastUpdateCheck,
    });
  }
});

// Check for updates and broadcast to clients
app.post('/api/updates/check', async (req, res) => {
  try {
    const pkg = JSON.parse(await fs.readFile('package.json', 'utf-8'));
    const currentVersion = pkg.version;
    
    // Fetch latest package.json from GitHub (with cache bust)
    const cacheBust = Date.now();
    const response = await fetch(`https://raw.githubusercontent.com/feetball/trader/master/package.json?cb=${cacheBust}`);
    if (!response.ok) {
      throw new Error(`GitHub fetch failed: ${response.status}`);
    }
    
    const remotePackage = await response.json();
    const latestVersion = remotePackage.version;
    console.log(`[UPDATE-CHECK] (manual) current=${currentVersion} latest=${latestVersion}`);
    
    // Compare versions
    const current = currentVersion.split('.').map(Number);
    const latest = latestVersion.split('.').map(Number);
    
    let updateAvailable = false;
    for (let i = 0; i < 3; i++) {
      if (latest[i] > current[i]) {
        updateAvailable = true;
        break;
      } else if (latest[i] < current[i]) {
        break;
      }
    }
    
    lastUpdateCheck = Date.now();
    cachedUpdateInfo = {
      currentVersion,
      latestVersion,
      updateAvailable,
      lastCheck: lastUpdateCheck,
      newVersion: latestVersion,
    };
    
    // Broadcast update status to all clients
    if (updateAvailable) {
      broadcast('updateAvailable', { newVersion: latestVersion });
    }
    
    res.json(cachedUpdateInfo);
  } catch (error) {
    console.error('Update check failed:', error.message);
    res.json({
      currentVersion: 'unknown',
      latestVersion: 'unknown',
      updateAvailable: false,
      error: error.message,
      lastCheck: lastUpdateCheck,
    });
  }
});

// Get cached update info
app.get('/api/updates/status', (req, res) => {
  res.json(cachedUpdateInfo || { updateAvailable: false, lastCheck: null });
});

// Perform update
app.post('/api/updates/apply', async (req, res) => {
  const wasRunning = !!botProcess;
  
  // Helper to send update log to all clients
  const updateLog = (message) => {
    console.log(message);
    broadcast('updateLog', { message, timestamp: Date.now() });
  };
  
  // Stop bot if running
  if (botProcess) {
    updateLog('[UPDATE] Stopping bot before update...');
    botProcess.kill();
    botProcess = null;
  }

  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    // Send initial response
    res.json({ success: true, message: 'Update started. Server will restart shortly.', wasRunning });
    
    // Give time for response to be sent
    setTimeout(async () => {
      try {
        updateLog('[UPDATE] Starting update process...');
        
        // Backup current settings before update
        let savedSettings = null;
        const settingsPath = path.join(process.cwd(), 'user-settings.json');
        if (fsSync.existsSync(settingsPath)) {
          updateLog('[UPDATE] Backing up user settings...');
          savedSettings = fsSync.readFileSync(settingsPath, 'utf-8');
        }
        
        // Git pull - force reset to match remote (overwrite local changes)
        updateLog('[UPDATE] Pulling latest code from GitHub...');
        try {
          // Fetch latest and hard reset to match origin/master
          await execAsync('git fetch origin master', { cwd: process.cwd() });
          const { stdout: gitOut } = await execAsync('git reset --hard origin/master', { cwd: process.cwd() });
          if (gitOut) updateLog(gitOut.trim());
        } catch (e) {
          const errorOutput = e.stdout || e.stderr || e.message;
          updateLog(`[GIT] ❌ Git pull failed: ${errorOutput}`);
          updateLog('[UPDATE] ❌ Update failed! Server will not restart.');
          broadcast('updateFailed', { message: 'Git pull failed' });
          return;
        }

        // Ensure frontend path aliases work even if upstream tsconfig lacks baseUrl
        try {
          const tsconfigPath = path.join(process.cwd(), 'frontend', 'tsconfig.json');
          const tsRaw = fsSync.readFileSync(tsconfigPath, 'utf-8');
          const tsJson = JSON.parse(tsRaw);
          tsJson.compilerOptions = tsJson.compilerOptions || {};
          tsJson.compilerOptions.baseUrl = tsJson.compilerOptions.baseUrl || '.';
          tsJson.compilerOptions.paths = tsJson.compilerOptions.paths || { '@/*': ['./src/*', './app/*'] };
          if (!tsJson.compilerOptions.paths['@/*']) {
            tsJson.compilerOptions.paths['@/*'] = ['./src/*', './app/*'];
          }
          fsSync.writeFileSync(tsconfigPath, JSON.stringify(tsJson, null, 2));
          updateLog('[UPDATE] Patched frontend tsconfig: ensured baseUrl and @/* paths');
        } catch (e) {
          updateLog(`[UPDATE] Warning: could not patch tsconfig.json (${e.message})`);
        }

        // Ensure webpack aliases for @/* so Next.js build resolves modules
        try {
          const nextConfigPath = path.join(process.cwd(), 'frontend', 'next.config.js');
          const nextConfigContent = `const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Disable server-side features for static export
  distDir: 'dist',
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname, 'src'),
      '@app': path.resolve(__dirname, 'app'),
    }
    return config
  }
}

module.exports = nextConfig
`;
          fsSync.writeFileSync(nextConfigPath, nextConfigContent);
          updateLog('[UPDATE] Patched frontend next.config.js: ensured webpack aliases');
        } catch (e) {
          updateLog(`[UPDATE] Warning: could not patch next.config.js (${e.message})`);
        }
        
        // Install dependencies
        updateLog('[UPDATE] Installing backend dependencies...');
        try {
          const { stdout: npmOut } = await execAsync('npm install 2>&1', { cwd: process.cwd() });
          const lines = npmOut.split('\n').filter(l => l.trim() && !l.includes('npm WARN'));
          lines.forEach(l => updateLog(l));
        } catch (e) {
          updateLog(`[NPM] ❌ Backend install failed: ${e.message}`);
          updateLog('[UPDATE] ❌ Update failed! Server will not restart.');
          broadcast('updateFailed', { message: 'Backend install failed' });
          return;
        }
        
        // Install frontend dependencies and build
        updateLog('[UPDATE] Installing frontend dependencies...');
        try {
          const { stdout: npmFrontOut } = await execAsync('npm install --include=dev 2>&1', { cwd: path.join(process.cwd(), 'frontend'), env: { ...process.env, NODE_ENV: 'development' } });
          const lines = npmFrontOut.split('\n').filter(l => l.trim() && !l.includes('npm WARN'));
          lines.forEach(l => updateLog(l));
        } catch (e) {
          updateLog(`[NPM] ❌ Frontend install failed: ${e.message}`);
          updateLog('[UPDATE] ❌ Update failed! Server will not restart.');
          broadcast('updateFailed', { message: 'Frontend install failed' });
          return;
        }
        
        updateLog('[UPDATE] Building frontend...');
        try {
          const { stdout: buildOut, stderr: buildErr } = await execAsync('npm run build 2>&1', { cwd: path.join(process.cwd(), 'frontend') });
          const lines = buildOut.split('\n').filter(l => l.trim());
          lines.slice(-5).forEach(l => updateLog(l)); // Last 5 lines of build output
        } catch (e) {
          // Show the actual error output
          const errorOutput = e.stdout || e.stderr || e.message;
          const errorLines = errorOutput.split('\n').filter(l => l.trim());
          errorLines.slice(-10).forEach(l => updateLog(`[BUILD] ${l}`));
          updateLog('[UPDATE] ❌ Frontend build failed! Server will not restart.');
          broadcast('updateFailed', { message: 'Frontend build failed' });
          return;
        }
        
        // Restore user settings after update, merging with new defaults
        if (savedSettings) {
          updateLog('[UPDATE] Restoring user settings...');
          
          // Load saved user settings and merge with defaults from new version
          const userSettings = JSON.parse(savedSettings);
          
          // Import the new defaults (they may have new settings)
          let newDefaults = {};
          try {
            const defaultContent = fsSync.readFileSync(path.join(process.cwd(), 'config.default.js'), 'utf-8');
            // Parse the defaults from the file
            const match = defaultContent.match(/defaultConfig\s*=\s*\{([^}]+)\}/s);
            if (match) {
              // Simple parsing - this will be replaced on next server start anyway
              newDefaults = {};
            }
          } catch (e) {
            updateLog('[UPDATE] Could not load new defaults, using saved settings only');
          }
          
          // Merge: new defaults + user settings (user settings take priority)
          const mergedSettings = { ...newDefaults, ...userSettings };
          
          // Save merged settings
          fsSync.writeFileSync(settingsPath, JSON.stringify(mergedSettings, null, 2));
          
          // Generate config.js dynamically
          const configLines = Object.entries(mergedSettings).map(([key, value]) => {
            const formattedValue = typeof value === 'boolean' ? value : 
                                  typeof value === 'string' ? `'${value}'` : value;
            return `  ${key}: ${formattedValue},`;
          }).join('\n');
          
          const configContent = `// Trading bot configuration (auto-generated from user settings)
export const config = {
${configLines}
};
`;
          fsSync.writeFileSync(path.join(process.cwd(), 'config.js'), configContent);
          updateLog('[UPDATE] User settings restored successfully!');
        }
        
        // Mark update as pending and wait for user confirmation before restart
        pendingUpdate = {
          newVersion: cachedUpdateInfo?.latestVersion || null,
          timestamp: Date.now(),
        };

        // Persist a small flag so external monitors can detect an update is pending
        try {
          fsSync.writeFileSync(path.join(process.cwd(), '.update-pending'), JSON.stringify(pendingUpdate));
        } catch (e) {
          // Non-fatal
        }

        updateLog('[UPDATE] ✅ Update complete and awaiting user confirmation to restart the server.');

        // Broadcast update-ready signal to all clients; clients should prompt the user
        broadcast('updateReady', { newVersion: pendingUpdate.newVersion });
      } catch (error) {
        updateLog(`[UPDATE] ❌ Update failed: ${error.message}`);
      }
    }, 500);
    
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Reset settings to defaults
app.post('/api/settings/reset', async (req, res) => {
  const wasRunning = botProcess !== null;
  
  try {
    // Stop bot if running
    if (botProcess) {
      addLog('⚙️ Stopping bot to reset settings...');
      botProcess.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 1000));
      botProcess = null;
    }

    // Delete user-settings.json
    if (fsSync.existsSync(SETTINGS_FILE)) {
      await fs.unlink(SETTINGS_FILE);
    }
    
    // Reset in-memory config to defaults
    // Reload defaults from file to ensure we have the latest
    let newDefaults = {};
    try {
      const defaultContent = await fs.readFile('config.default.js', 'utf-8');
      // Extract the object content
      const match = defaultContent.match(/defaultConfig\s*=\s*({[\s\S]*?});/);
      if (match) {
        // This is a bit hacky but avoids importing the module dynamically which can be tricky with caching
        // We'll just rely on the imported defaultConfig at the top of the file, 
        // but since we just edited it, we might need to restart the server to pick up changes.
        // However, for now, let's just use the imported defaultConfig and assume the user will restart if they want code changes.
        // Wait, I just edited config.default.js on disk. The imported `defaultConfig` is stale.
        // I should probably read the file and parse it, or just restart the server.
        // But I can't restart the server easily from within the server.
        // Let's just delete the user settings and let the next load pick up defaults.
        // But wait, `config` variable is in memory. I need to reset it.
      }
    } catch (e) {
      console.log('[RESET] Error reading defaults:', e);
    }

    // Re-import defaults? No, ESM modules are cached.
    // I'll just manually reset the config object to what I know are the defaults, 
    // OR I can just tell the user to restart.
    // Actually, I can just read the file and parse it manually if I want to be 100% sure.
    // Let's try to read the file and eval it (safe enough here since it's our file).
    
    const defaultContent = await fs.readFile('config.default.js', 'utf-8');
    const match = defaultContent.match(/defaultConfig\s*=\s*({[\s\S]*?});/);
    let freshDefaults = {};
    if (match) {
      // Use Function constructor to parse the object literal
      freshDefaults = new Function(`return ${match[1]}`)();
    } else {
      // Fallback
      freshDefaults = { ...defaultConfig }; 
    }

    // Update config.js
    const configLines = Object.entries(freshDefaults).map(([key, value]) => {
      const formattedValue = typeof value === 'boolean' ? value : 
                            typeof value === 'string' ? `'${value}'` : value;
      return `  ${key}: ${formattedValue},`;
    }).join('\n');
    
    const configContent = `// Trading bot configuration (auto-generated from user settings)
export const config = {
${configLines}
};
`;
    await fs.writeFile('config.js', configContent);
    
    // Reset in-memory config
    Object.keys(config).forEach(key => delete config[key]);
    Object.assign(config, freshDefaults);

    addLog('✅ Settings reset to defaults');
    
    // Restart bot if it was running
    if (wasRunning) {
      addLog('🔄 Restarting bot with default settings...');
      
      botStatus.running = true;
      botStatus.message = 'Restarting with default settings...';
      botStatus.cycleCount = 0;
      botStatus.apiCalls = 0;
      botStartTime = Date.now();

      botProcess = spawn('node', ['bot-daemon.js'], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      
      // ... (attach listeners - same as in startBot or settings update)
      // To avoid code duplication, I should probably refactor startBot to take options or just call startBot()
      // But startBot() checks if botProcess is null.
      
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
        if (msg) addLog(`⚠️ ${msg}`);
      });

      botProcess.on('close', (code) => {
        botStatus.running = false;
        botStatus.message = `Bot stopped (exit code: ${code})`;
        addLog(`🛑 Bot stopped with code ${code}`);
        botProcess = null;
      });
    }
    
    res.json({ success: true, message: 'Settings reset to defaults', settings: freshDefaults });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Start bot function (reusable for API and auto-start)
function startBot() {
  if (botProcess) {
    console.log('[BOT] Bot is already running');
    return false;
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

    return true;
  } catch (error) {
    botStatus.running = false;
    botStatus.message = `Failed to start: ${error.message}`;
    return false;
  }
}

// Get bot status
app.get('/api/bot/status', (req, res) => {
  res.json(botStatus);
});

// Start the bot
app.post('/api/bot/start', (req, res) => {
  if (botProcess) {
    return res.json({ success: false, message: 'Bot is already running' });
  }

  const started = startBot();
  if (started) {
    res.json({ success: true, message: 'Bot started' });
  } else {
    res.json({ success: false, message: botStatus.message });
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
  console.log('║   💹  BIG DK\'S CRYPTO MOMENTUM TRADER v0.8.31 (Next.js Frontend)             ║');
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
  console.log('║   │ Next.js + React │◄──►│  Express API    │◄──►│  Coinbase API   │         ║');
  console.log('║   │  (Frontend)     │    │  + WebSocket    │    │  (REST + WS)    │         ║');
  console.log('║   └─────────────────┘    └─────────────────┘    └─────────────────┘         ║');
  console.log('║                                                                              ║');
  console.log('║   LANGUAGES & FRAMEWORKS:                                                    ║');
  console.log('║   • Backend:  Node.js, Express, WebSocket (ws)                              ║');
  console.log('║   • Frontend: Next.js 14, React 18, Tailwind CSS 3, Lucide Icons           ║');
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
  
  // Start automatic update checking
  checkForUpdates(); // Check on startup
  setInterval(checkForUpdates, 3600000); // Check every hour
  
  // Check if bot should be auto-started after update
  const restartFlagPath = path.join(process.cwd(), '.restart-bot');
  if (fsSync.existsSync(restartFlagPath)) {
    fsSync.unlinkSync(restartFlagPath);
    console.log('[AUTO-START] Restarting bot after update...');
    startBot();
  }
});
