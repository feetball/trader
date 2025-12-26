import { Box, Typography, Tooltip } from '@mui/material'

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
  audit?: {
    entry?: AuditEntry | null
    configAtEntry?: TradeAuditConfig
    configAtExit?: TradeAuditConfig
  }
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
  className = '',
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

  const content = (
    <>
      {entry?.grade && (
        <Typography component="span" variant="caption" sx={{ color: 'text.secondary', mr: 1.5 }}>
          Grade <strong>{entry.grade}</strong>{typeof entry.score === 'number' ? ` (${entry.score})` : ''}
        </Typography>
      )}
      {typeof entry?.momentum === 'number' && (
        <Typography component="span" variant="caption" sx={{ color: 'text.secondary', mr: 1.5 }}>
          Mom <strong>{entry.momentum >= 0 ? '+' : ''}{entry.momentum.toFixed(2)}%</strong>
        </Typography>
      )}
      {typeof entry?.rsi === 'number' && (
        <Typography component="span" variant="caption" sx={{ color: 'text.secondary', mr: 1.5 }}>
          RSI <strong>{entry.rsi.toFixed(0)}</strong>
        </Typography>
      )}
      {showVolume && typeof entry?.volumeSurge?.ratio === 'number' && (
        <Typography component="span" variant="caption" sx={{ color: 'text.secondary', mr: 1.5 }}>
          Vol <strong>{entry.volumeSurge.ratio.toFixed(2)}x</strong>
        </Typography>
      )}
      {cfgBuyText && (
        <Typography component="span" variant="caption" sx={{ color: 'primary.light', mr: 1.5 }}>
          Cfg Buy <strong>{cfgBuyText}</strong>
        </Typography>
      )}
      {cfgSellText && (
        <Typography component="span" variant="caption" sx={{ color: 'secondary.light', mr: 1.5 }}>
          Cfg Sell <strong>{cfgSellText}</strong>
        </Typography>
      )}
      {showReasons && Array.isArray(entry?.reasons) && entry.reasons.length > 0 && (
        <Tooltip title={entry.reasons.join(' • ')}>
          <Typography component="span" variant="caption" sx={{ color: 'text.disabled', cursor: 'help' }}>
            Why {entry.reasons.slice(0, maxReasons).join(' • ')}
            {entry.reasons.length > maxReasons ? ' …' : ''}
          </Typography>
        </Tooltip>
      )}
    </>
  )

  if (className === 'contents') {
    return content
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }} className={className}>
      {content}
    </Box>
  )
}

export default AuditEntryDisplay
