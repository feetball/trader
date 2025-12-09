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
