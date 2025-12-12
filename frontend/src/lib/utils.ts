import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatHoldTime(ms: number | undefined): string {
  if (!ms) return '-'
  const minutes = Math.floor(ms / 60000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

export function formatTimestamp(ts: number | string | undefined): string {
  if (!ts) return '-'
  return new Date(ts).toLocaleString()
}

export function getCoinbaseUrl(symbol: string): string {
  const pair = symbol.includes('-USD') ? symbol : `${symbol}-USD`
  return `https://www.coinbase.com/advanced-trade/spot/${pair}`
}

export function formatCurrency(value: number | undefined, decimals = 2): string {
  if (value === undefined || value === null) return '$0.00'
  return `$${value.toFixed(decimals)}`
}

export function formatPercent(value: number | undefined, decimals = 2): string {
  if (value === undefined || value === null) return '0.00%'
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

export function getColorClass(value: number | undefined, positiveClass = 'text-success-500', negativeClass = 'text-error-500'): string {
  if (value === undefined || value === null) return ''
  return value >= 0 ? positiveClass : negativeClass
}

export function getLogClass(message: string): string {
  if (message.includes('BUY')) return 'text-success-500'
  if (message.includes('SELL')) return 'text-info-500'
  if (message.includes('Error') || message.includes('❌')) return 'text-error-500'
  if (message.includes('🛑')) return 'text-warning-500'
  return ''
}

export function getLogIcon(message: string): string {
  const msg = message.toLowerCase()
  if (msg.includes('buy')) return 'arrow-down-bold'
  if (msg.includes('sell')) return 'arrow-up-bold'
  if (msg.includes('error') || msg.includes('❌')) return 'alert-circle'
  if (msg.includes('scan') || msg.includes('checking')) return 'radar'
  if (msg.includes('start')) return 'play'
  if (msg.includes('stop')) return 'stop'
  return 'circle'
}

export function getReasonColor(reason: string | undefined): string {
  if (!reason) return 'bg-gray-700'
  if (reason.toLowerCase().includes('profit')) return 'bg-success-900'
  if (reason.toLowerCase().includes('stop')) return 'bg-error-900'
  if (reason.toLowerCase().includes('trail')) return 'bg-info-900'
  return 'bg-gray-700'
}

// Trade audit data types
interface TradeAuditEntry {
  grade?: string
  score?: number
  momentum?: number
  rsi?: number | null
  volumeSurge?: {
    ratio?: number
  } | null
  reasons?: string[]
}

interface TradeAuditConfig {
  PROFIT_TARGET?: number
  STOP_LOSS?: number
  ENABLE_TRAILING_PROFIT?: boolean
  TRAILING_STOP_PERCENT?: number
}

interface TradeAudit {
  entry?: TradeAuditEntry | null
  configAtEntry?: TradeAuditConfig
  exit?: unknown
  configAtExit?: TradeAuditConfig
}

export interface TradeAuditData {
  hasAudit: boolean
  entry?: TradeAuditEntry | null
  cfgBuy?: TradeAuditConfig
  cfgSell?: TradeAuditConfig
}

export interface TradeAuditTexts {
  gradeText: string | null
  momentumText: string | null
  rsiText: string | null
  volText: string | null
  cfgBuyText: string | null
  cfgSellText: string | null
}

/**
 * Extract audit data from a trade object
 */
export function extractTradeAuditData(audit?: TradeAudit): TradeAuditData {
  const entry = audit?.entry
  const cfgBuy = audit?.configAtEntry
  const cfgSell = audit?.configAtExit
  const hasAudit = !!(audit && (audit.entry || audit.configAtEntry || audit.exit || audit.configAtExit))
  
  return {
    hasAudit,
    entry,
    cfgBuy,
    cfgSell
  }
}

/**
 * Format config data into display text string
 */
function formatConfigText(config?: TradeAuditConfig): string | null {
  if (!config) return null
  
  const { PROFIT_TARGET, STOP_LOSS, ENABLE_TRAILING_PROFIT, TRAILING_STOP_PERCENT } = config
  
  // Ensure required fields are present
  if (typeof PROFIT_TARGET !== 'number' || typeof STOP_LOSS !== 'number') {
    return null
  }
  
  let text = `PT ${PROFIT_TARGET}% SL ${STOP_LOSS}%`
  
  if (ENABLE_TRAILING_PROFIT && typeof TRAILING_STOP_PERCENT === 'number') {
    text += ` Trail ${TRAILING_STOP_PERCENT}%`
  }
  
  return text
}

/**
 * Format audit data into display text strings
 */
export function formatTradeAuditTexts(auditData: TradeAuditData): TradeAuditTexts {
  const { entry, cfgBuy, cfgSell } = auditData
  
  const gradeText = entry?.grade 
    ? `Grade ${entry.grade}${typeof entry.score === 'number' ? ` (${entry.score})` : ''}` 
    : null
    
  const momentumText = typeof entry?.momentum === 'number' 
    ? `Mom ${entry.momentum >= 0 ? '+' : ''}${entry.momentum.toFixed(2)}%` 
    : null
    
  const rsiText = typeof entry?.rsi === 'number' 
    ? `RSI ${entry.rsi.toFixed(0)}` 
    : null
    
  const volText = entry?.volumeSurge && typeof entry.volumeSurge.ratio === 'number'
    ? `Vol ${(entry.volumeSurge.ratio).toFixed(2)}x`
    : null
    
  const cfgBuyText = formatConfigText(cfgBuy)
  const cfgSellText = formatConfigText(cfgSell)
  
  return {
    gradeText,
    momentumText,
    rsiText,
    volText,
    cfgBuyText,
    cfgSellText
  }
}
