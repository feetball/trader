'use client'

import { useTrading } from '@/hooks/useTrading'
import { RefreshCw, Power, Square } from 'lucide-react'

export default function AppBar() {
  const { botStatus, botLoading, wsConnected, lastUpdate, appVersion, startBot, stopBot } = useTrading()

  return (
    <header className="bg-surface-light border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold">Crypto Momentum Trader</h2>
            <p className="text-sm text-gray-400">v{appVersion}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm">
            <div
              className={`w-2 h-2 rounded-full ${
                wsConnected ? 'bg-success-500' : 'bg-error-500'
              } animate-pulse-slow`}
            />
            <span className="text-gray-300">
              {botStatus.running ? 'Running' : 'Stopped'}
            </span>
          </div>

          <div className="text-sm text-gray-400">
            Last update: {lastUpdate || '-'}
          </div>

          <div className="flex gap-2">
            {!botStatus.running ? (
              <button
                onClick={startBot}
                disabled={botLoading}
                className="flex items-center gap-2 px-4 py-2 bg-success-600 hover:bg-success-700 text-white rounded-lg disabled:opacity-50"
              >
                <Power size={18} />
                Start
              </button>
            ) : (
              <button
                onClick={stopBot}
                disabled={botLoading}
                className="flex items-center gap-2 px-4 py-2 bg-error-600 hover:bg-error-700 text-white rounded-lg disabled:opacity-50"
              >
                <Square size={18} />
                Stop
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
