'use client'

import { useTrading } from '@/hooks/useTrading'
import { Card, CardTitle, CardContent } from '@/components/Card'
import Chip from '@/components/Chip'
import Button from '@/components/Button'
import { RefreshCw, Power, Square, Cpu, Settings, Target, Clock, Activity, BarChart3, DollarSign, Zap } from 'lucide-react'

export default function BotStatusPage() {
  const { botStatus, botLoading, loading, portfolio, settings, startBot, stopBot, refreshData } = useTrading()

  return (
    <div className="p-6 space-y-6">
      {/* Main Status Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="glass" className="lg:col-span-2">
          <CardTitle icon={<Cpu size={18} className="text-primary-400" />}>
            Bot Status
          </CardTitle>
          <CardContent>
            <div className="flex items-start gap-6">
              {/* Status Indicator */}
              <div className="relative">
                <div className={`w-24 h-24 rounded-2xl flex items-center justify-center ${
                  botStatus.running 
                    ? 'bg-gradient-to-br from-success-500/30 to-success-600/10 shadow-glow-success' 
                    : 'bg-gradient-to-br from-gray-500/30 to-gray-600/10'
                }`}>
                  <Cpu size={40} className={botStatus.running ? 'text-success-400 animate-pulse' : 'text-gray-500'} />
                </div>
                {botStatus.running && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-success-500 animate-ping"></div>
                )}
              </div>

              {/* Status Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Chip 
                    color={botStatus.running ? 'success' : 'grey'} 
                    variant="glow"
                    size="medium"
                  >
                    {botStatus.running ? '● Running' : '○ Stopped'}
                  </Chip>
                </div>
                <p className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-4">
                  {botStatus.message || 'Awaiting status...'}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-info-400" />
                    <span className="text-gray-500">Cycles:</span>
                    <span className="font-mono text-white">{botStatus.cycleCount || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-warning-400" />
                    <span className="text-gray-500">API Calls:</span>
                    <span className="font-mono text-white">{botStatus.apiCalls || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls Card */}
        <Card variant="glass">
          <CardTitle icon={<Settings size={18} className="text-info-400" />}>
            Controls
          </CardTitle>
          <CardContent className="space-y-4">
            {!botStatus.running ? (
              <button
                onClick={startBot}
                disabled={botLoading}
                className="group relative w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow-success"
                title="Start the trading bot to begin scanning markets and executing trades"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-success-600 via-success-500 to-success-600 bg-[length:200%_100%] animate-shimmer"></div>
                <Power size={20} className="relative z-10" />
                <span className="relative z-10">Start Bot</span>
              </button>
            ) : (
              <button
                onClick={stopBot}
                disabled={botLoading}
                className="group relative w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow-error"
                title="Stop the trading bot and halt all trading activities"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-error-600 via-error-500 to-error-600 bg-[length:200%_100%] animate-shimmer"></div>
                <Square size={20} className="relative z-10" />
                <span className="relative z-10">Stop Bot</span>
              </button>
            )}
            <button
              onClick={refreshData}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-gray-300 glass hover:bg-white/10 transition-all duration-300 disabled:opacity-50"
              title="Refresh portfolio data, positions, and trading statistics from the server"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              Refresh Data
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Open Positions', value: portfolio.openPositions || 0, suffix: `/${settings.MAX_POSITIONS}`, icon: Target, color: 'primary' },
          { label: 'Available Cash', value: '$' + (portfolio.cash?.toFixed(0) || '0'), icon: DollarSign, color: 'success' },
          { label: 'Total Trades', value: portfolio.totalTrades || 0, icon: BarChart3, color: 'info' },
          { label: 'Scan Interval', value: settings.SCAN_INTERVAL + 's', icon: Clock, color: 'warning' },
        ].map((stat, i) => (
          <div key={i} title={`${stat.label}: ${stat.value}${stat.suffix || ''} - ${stat.label === 'Open Positions' ? 'Number of active trades currently held' : stat.label === 'Available Cash' ? 'Cash available for new trades' : stat.label === 'Total Trades' ? 'Total number of completed trades' : 'How often the bot scans for opportunities'}`}>
            <Card variant="glass" hover className="group">
              <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg bg-${stat.color}-500/20`}>
                  <stat.icon size={14} className={`text-${stat.color}-400`} />
                </div>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                {stat.value}{stat.suffix || ''}
              </p>
            </CardContent>
          </Card>
          </div>
        ))}
      </div>

      {/* Recent Logs */}
      <Card variant="glass">
        <CardTitle icon={<Activity size={18} className="text-warning-400" />}>
          Recent Logs
        </CardTitle>
        <CardContent>
          <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar font-mono text-sm">
            {botStatus.logs?.slice(-15).map((log, i) => (
              <div 
                key={i} 
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <span className="text-gray-600 text-xs whitespace-nowrap">{log.timestamp}</span>
                <span className={`flex-1 ${
                  log.message?.toLowerCase().includes('error') ? 'text-error-400' :
                  log.message?.toLowerCase().includes('success') || log.message?.toLowerCase().includes('sold') ? 'text-success-400' :
                  log.message?.toLowerCase().includes('buy') || log.message?.toLowerCase().includes('bought') ? 'text-info-400' :
                  'text-gray-400'
                }`}>
                  {log.message}
                </span>
              </div>
            ))}
            {!botStatus.logs?.length && (
              <div className="text-center py-8">
                <Activity size={32} className="mx-auto text-gray-600 mb-2" />
                <p className="text-gray-500">No logs yet. Start the bot to see activity.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
