interface AuditEntryData {
  grade?: string
  score?: number
  momentum?: number
  rsi?: number
  volumeSurge?: {
    ratio?: number
  }
  reasons?: string[]
}

interface ConfigData {
  PROFIT_TARGET?: number
  STOP_LOSS?: number
  ENABLE_TRAILING_PROFIT?: boolean
  TRAILING_STOP_PERCENT?: number
}

interface AuditEntryDisplayProps {
  entry?: AuditEntryData
  className?: string
  showVolume?: boolean
  showReasons?: boolean
  maxReasons?: number
  configAtEntry?: ConfigData
  configAtExit?: ConfigData
}

/**
 * Reusable component for displaying audit entry data (grade, momentum, RSI, volume, signals)
 * and optionally configuration snapshots
 */
export function AuditEntryDisplay({ 
  entry, 
  className = "text-xs text-gray-600 font-mono flex flex-wrap gap-x-3 gap-y-1",
  showVolume = false,
  showReasons = false,
  maxReasons = 4,
  configAtEntry,
  configAtExit
}: AuditEntryDisplayProps) {
  if (!entry && !configAtEntry && !configAtExit) return null

  // Check if there's any data to display
  const hasEntryData = entry && (
    entry.grade || 
    typeof entry.momentum === 'number' || 
    typeof entry.rsi === 'number' ||
    (showVolume && entry.volumeSurge && typeof entry.volumeSurge.ratio === 'number') ||
    (showReasons && Array.isArray(entry.reasons) && entry.reasons.length > 0)
  )

  const hasConfigData = configAtEntry || configAtExit

  if (!hasEntryData && !hasConfigData) return null

  const gradeText = entry?.grade 
    ? `Grade ${entry.grade}${typeof entry.score === 'number' ? ` (${entry.score})` : ''}` 
    : null
  const momentumText = entry && typeof entry.momentum === 'number' 
    ? `Mom ${entry.momentum >= 0 ? '+' : ''}${entry.momentum.toFixed(2)}%` 
    : null
  const rsiText = entry && typeof entry.rsi === 'number' 
    ? `RSI ${entry.rsi.toFixed(0)}` 
    : null
  const volText = showVolume && entry?.volumeSurge && typeof entry.volumeSurge.ratio === 'number'
    ? `Vol ${entry.volumeSurge.ratio.toFixed(2)}x`
    : null

  const formatConfig = (cfg: ConfigData) => 
    `PT ${cfg.PROFIT_TARGET}% SL ${cfg.STOP_LOSS}%${cfg.ENABLE_TRAILING_PROFIT ? ` Trail ${cfg.TRAILING_STOP_PERCENT}%` : ''}`

  const cfgBuyText = configAtEntry ? formatConfig(configAtEntry) : null
  const cfgSellText = configAtExit ? formatConfig(configAtExit) : null

  // If we have configs, use a space-y layout, otherwise use flex wrap
  if (hasConfigData) {
    return (
      <div className="mt-2 text-xs text-gray-500 font-mono space-y-1">
        {hasEntryData && (
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {gradeText && <span>{gradeText}</span>}
            {momentumText && <span>{momentumText}</span>}
            {rsiText && <span>{rsiText}</span>}
            {volText && <span>{volText}</span>}
          </div>
        )}
        {showReasons && entry && Array.isArray(entry.reasons) && entry.reasons.length > 0 && (
          <div className="text-gray-600">
            Signals: {entry.reasons.slice(0, maxReasons).join(', ')}
          </div>
        )}
        {cfgBuyText && (
          <div className="text-gray-600">Cfg@Buy: {cfgBuyText}</div>
        )}
        {cfgSellText && (
          <div className="text-gray-600">Cfg@Sell: {cfgSellText}</div>
        )}
      </div>
    )
  }

  return (
    <div className={className}>
      {gradeText && <span>{gradeText}</span>}
      {momentumText && <span>{momentumText}</span>}
      {rsiText && <span>{rsiText}</span>}
      {volText && <span>{volText}</span>}
      {showReasons && entry && Array.isArray(entry.reasons) && entry.reasons.length > 0 && (
        <span className="text-gray-600">
          Signals: {entry.reasons.slice(0, maxReasons).join(', ')}
        </span>
      )}
    </div>
  )
}
