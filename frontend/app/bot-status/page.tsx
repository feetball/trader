'use client'

import { useTrading } from '@/hooks/useTrading'
import { Card, CardTitle, CardContent } from '@/components/Card'
import Chip from '@/components/Chip'
import Button from '@/components/Button'
import { RefreshCw, Power, Square } from 'lucide-react'

export default function BotStatusPage() {
  const { botStatus, botLoading, loading, portfolio, settings, startBot, stopBot, refreshData } = useTrading()

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardTitle className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${botStatus.running ? 'bg-success-500 animate-pulse-slow' : 'bg-gray-500'}`} />
            Bot Status
          </CardTitle>
          <CardContent>
            <p className="text-2xl font-bold mb-4">{botStatus.message}</p>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-400">State:</span> <span className={botStatus.running ? 'text-success-500' : 'text-gray-400'}>{botStatus.running ? 'Running' : 'Stopped'}</span></p>
              <p><span className="text-gray-400">Cycles:</span> {botStatus.cycleCount}</p>
              <p><span className="text-gray-400">API Calls:</span> {botStatus.apiCalls}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Controls</CardTitle>
          <CardContent className="space-y-3">
            {!botStatus.running ? (
              <Button variant="success" onClick={startBot} loading={botLoading} className="w-full">
                <Power size={18} />
                Start Bot
              </Button>
            ) : (
              <Button variant="error" onClick={stopBot} loading={botLoading} className="w-full">
                <Square size={18} />
                Stop Bot
              </Button>
            )}
            <Button variant="secondary" onClick={refreshData} loading={loading} className="w-full">
              <RefreshCw size={18} />
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Open Positions', value: portfolio.openPositions || 0, suffix: `/${settings.MAX_POSITIONS}` },
          { label: 'Available Cash', value: '$' + (portfolio.cash?.toFixed(0) || '0') },
          { label: 'Total Trades', value: portfolio.totalTrades || 0 },
          { label: 'Scan Interval', value: settings.SCAN_INTERVAL + 's' },
        ].map((stat, i) => (
          <Card key={i} className="flex flex-col justify-center">
            <CardContent>
              <p className="text-xs text-gray-400">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}{stat.suffix || ''}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Logs */}
      <Card>
        <CardTitle>Recent Logs</CardTitle>
        <CardContent>
          <div className="space-y-1 max-h-64 overflow-y-auto font-mono text-sm">
            {botStatus.logs?.slice(-10).map((log, i) => (
              <p key={i} className="text-gray-400">
                <span className="text-gray-600">{log.timestamp}</span> {log.message}
              </p>
            ))}
            {!botStatus.logs?.length && <p className="text-gray-500">No logs yet</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
