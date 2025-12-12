interface AuditEntry {
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

type AuditEntryDisplayProps = {
  // Legacy/simple usage: <AuditEntryDisplay audit={pos.audit} />
  audit?: {
    entry?: AuditEntry | null
    configAtEntry?: TradeAuditConfig
    configAtExit?: TradeAuditConfig
  }

  // Rich usage: <AuditEntryDisplay entry=... showVolume showReasons ... />
  entry?: AuditEntry | null
  showVolume?: boolean
  showReasons?: boolean
  maxReasons?: number
  configAtEntry?: TradeAuditConfig
  configAtExit?: TradeAuditConfig

  className?: string
}

function formatConfigText(config?: TradeAuditConfig): string | null {
  if (!config) return null
  const { PROFIT_TARGET, STOP_LOSS, ENABLE_TRAILING_PROFIT, TRAILING_STOP_PERCENT } = config
  if (typeof PROFIT_TARGET !== 'number' || typeof STOP_LOSS !== 'number') return null

  let text = `PT ${PROFIT_TARGET}% SL ${STOP_LOSS}%`
  if (ENABLE_TRAILING_PROFIT && typeof TRAILING_STOP_PERCENT === 'number') {
    text += ` Trail ${TRAILING_STOP_PERCENT}%`
  }
  return text
}

export function AuditEntryDisplay({
  audit,
  entry: entryProp,
  showVolume = false,
  showReasons = false,
  maxReasons = 3,
  configAtEntry,
  configAtExit,
  className = 'text-xs text-gray-500 font-mono flex flex-wrap gap-x-3 gap-y-1',
}: AuditEntryDisplayProps) {
  const entry = entryProp ?? audit?.entry
  const cfgBuy = configAtEntry ?? audit?.configAtEntry
  const cfgSell = configAtExit ?? audit?.configAtExit

  if (!entry && !cfgBuy && !cfgSell) return null
  
  const hasAnyEntryData = Boolean(entry?.grade) ||
    typeof entry?.score === 'number' ||
    typeof entry?.momentum === 'number' ||
    typeof entry?.rsi === 'number' ||
    (showVolume && typeof entry?.volumeSurge?.ratio === 'number') ||
    (showReasons && Array.isArray(entry?.reasons) && entry.reasons.length > 0)

  const cfgBuyText = formatConfigText(cfgBuy)
  const cfgSellText = formatConfigText(cfgSell)
  const hasAnyCfg = Boolean(cfgBuyText || cfgSellText)
  
  if (!hasAnyEntryData && !hasAnyCfg) return null

  // When className is 'contents', render children directly without wrapper
  // This allows the children to be direct flex items of the parent container
  const children = (
    <>
      {entry?.grade && (
        <span>Grade {entry.grade}{typeof entry.score === 'number' ? ` (${entry.score})` : ''}</span>
      )}
      {typeof entry?.momentum === 'number' && (
        <span>Mom {entry.momentum >= 0 ? '+' : ''}{entry.momentum.toFixed(2)}%</span>
      )}
      {typeof entry?.rsi === 'number' && (
        <span>RSI {entry.rsi.toFixed(0)}</span>
      )}
      {showVolume && typeof entry?.volumeSurge?.ratio === 'number' && (
        <span>Vol {entry.volumeSurge.ratio.toFixed(2)}x</span>
      )}
      {cfgBuyText && (
        <span>Cfg Buy {cfgBuyText}</span>
      )}
      {cfgSellText && (
        <span>Cfg Sell {cfgSellText}</span>
      )}
      {showReasons && Array.isArray(entry?.reasons) && entry.reasons.length > 0 && (
        <span>
          Why {entry.reasons.slice(0, maxReasons).join(' • ')}
          {entry.reasons.length > maxReasons ? ' …' : ''}
        </span>
      )}
    </>
  )

  if (className === 'contents') {
    return children
  }

  return (
    <div className={className}>
      {children}
    </div>
  )
}

export default AuditEntryDisplay
