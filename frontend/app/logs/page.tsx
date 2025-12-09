'use client'

import { useTrading } from '@/hooks/useTrading'
import { Card, CardTitle, CardContent } from '@/components/Card'
import Chip from '@/components/Chip'
import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'

export default function LogsPage() {
  const { botStatus, loading, refreshData } = useTrading()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const containerRef = useRef<HTMLDivElement>(null)

  const logs = botStatus.logs || []

  const filteredLogs = logs.filter(log => {
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterType === 'all') return true
    const msg = log.message.toLowerCase()
    switch (filterType) {
      case 'buy': return msg.includes('buy')
      case 'sell': return msg.includes('sell')
      case 'error': return msg.includes('error') || msg.includes('❌')
      case 'scan': return msg.includes('scan') || msg.includes('checking')
      default: return true
    }
  })

  const buyCount = logs.filter(l => l.message.toLowerCase().includes('buy')).length
  const sellCount = logs.filter(l => l.message.toLowerCase().includes('sell')).length
  const errorCount = logs.filter(l => l.message.toLowerCase().includes('error')).length

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="tonal" color="success">
          <CardContent>
            <p className="text-sm text-gray-400">Buy Orders</p>
            <p className="text-3xl font-bold text-success-500 mt-2">{buyCount}</p>
          </CardContent>
        </Card>
        <Card variant="tonal" color="info">
          <CardContent>
            <p className="text-sm text-gray-400">Sell Orders</p>
            <p className="text-3xl font-bold text-info-500 mt-2">{sellCount}</p>
          </CardContent>
        </Card>
        <Card variant="tonal" color="error">
          <CardContent>
            <p className="text-sm text-gray-400">Errors</p>
            <p className="text-3xl font-bold text-error-500 mt-2">{errorCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardTitle>Bot Logs</CardTitle>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 flex items-center bg-surface px-3 rounded-lg">
              <Search size={18} className="text-gray-500" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent py-2 px-2 outline-none text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {['all', 'buy', 'sell', 'error', 'scan'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  filterType === type ? 'bg-primary-700 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          <div ref={containerRef} className="bg-surface p-3 rounded-lg max-h-96 overflow-y-auto font-mono text-sm space-y-1">
            {filteredLogs.map((log, i) => (
              <div key={i} className="text-gray-400">
                <span className="text-gray-600">{log.timestamp}</span> {log.message}
              </div>
            ))}
            {filteredLogs.length === 0 && (
              <p className="text-center text-gray-500 py-4">No logs match criteria</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
