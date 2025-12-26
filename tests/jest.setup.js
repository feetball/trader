import fs from 'fs';

// Use a worker-specific data file to avoid race conditions when tests run in parallel
const workerId = process.env.JEST_WORKER_ID || 'local';
process.env.PAPER_TRADING_DATA = `paper-trading-data.${workerId}.json`;

// Ensure the data file exists with a sensible default
try {
  if (!fs.existsSync(process.env.PAPER_TRADING_DATA)) {
    fs.writeFileSync(process.env.PAPER_TRADING_DATA, JSON.stringify({ cash: 10000, positions: [], closedTrades: [] }, null, 2));
  }
} catch (e) {
  // ignore; tests will handle file absence
}
