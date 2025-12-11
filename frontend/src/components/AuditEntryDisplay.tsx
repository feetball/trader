interface AuditEntry {
  grade?: string
  score?: number
  momentum?: number
  rsi?: number
}

interface AuditEntryDisplayProps {
  audit?: {
    entry?: AuditEntry
  }
  className?: string
}

export default function AuditEntryDisplay({ audit, className = "text-xs text-gray-500 font-mono flex flex-wrap gap-x-3 gap-y-1" }: AuditEntryDisplayProps) {
  if (!audit?.entry) return null
  
  const hasAnyData = Boolean(audit.entry.grade) || 
    typeof audit.entry.score === 'number' ||
    typeof audit.entry.momentum === 'number' || 
    typeof audit.entry.rsi === 'number'
  
  if (!hasAnyData) return null

  // When className is 'contents', render children directly without wrapper
  // This allows the children to be direct flex items of the parent container
  const children = (
    <>
      {audit.entry.grade && (
        <span>Grade {audit.entry.grade}{typeof audit.entry.score === 'number' ? ` (${audit.entry.score})` : ''}</span>
      )}
      {typeof audit.entry.momentum === 'number' && (
        <span>Mom {audit.entry.momentum >= 0 ? '+' : ''}{audit.entry.momentum.toFixed(2)}%</span>
      )}
      {typeof audit.entry.rsi === 'number' && (
        <span>RSI {audit.entry.rsi.toFixed(0)}</span>
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
