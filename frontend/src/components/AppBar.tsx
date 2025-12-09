'use client'

import { useTrading } from '@/hooks/useTrading'
import { RefreshCw, Power, Square, Wifi, WifiOff, Clock, Sparkles } from 'lucide-react'

export default function AppBar() {
  const { botStatus, botLoading, wsConnected, lastUpdate, appVersion, startBot, stopBot } = useTrading()

  return (
    <header className="glass border-b border-white/10 px-6 py-4 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        {/* Left Side - Title & Version */}
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Big DK's Crypto Momentum Trader
              </h2>
              <Sparkles size={16} className="text-warning-400 animate-pulse" />
            </div>
            <p className="text-xs text-gray-500 font-mono">v{appVersion}</p>
          </div>
        </div>

        {/* Right Side - Status & Controls */}
        <div className="flex items-center gap-6">
          {/* Connection Status */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
              wsConnected 
                ? 'bg-success-500/20 text-success-400' 
                : 'bg-error-500/20 text-error-400'
            }`} title={wsConnected ? 'WebSocket connection to server is active' : 'WebSocket connection to server is lost'}>
              {wsConnected ? (
                <Wifi size={14} className="animate-pulse" />
              ) : (
                <WifiOff size={14} />
              )}
              <span className="text-xs font-medium">
                {wsConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Bot Status Indicator */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
              botStatus.running 
                ? 'bg-success-500/20 shadow-glow-success' 
                : 'bg-gray-500/20'
            }`} title={botStatus.running ? `Bot is actively trading. ${botStatus.message}` : `Bot is stopped. ${botStatus.message}`}>
              <div className={`relative w-2 h-2 rounded-full ${
                botStatus.running ? 'bg-success-500' : 'bg-gray-500'
              }`}>
                {botStatus.running && (
                  <span className="absolute inset-0 rounded-full bg-success-500 animate-ping opacity-75"></span>
                )}
              </div>
              <span className={`text-xs font-medium ${
                botStatus.running ? 'text-success-400' : 'text-gray-400'
              }`}>
                {botStatus.running ? 'Running' : 'Stopped'}
              </span>
            </div>
          </div>

          {/* Last Update */}
          <div className="flex items-center gap-2 text-sm text-gray-500" title="Last time data was refreshed from the server">
            <Clock size={14} />
            <span className="font-mono text-xs">{lastUpdate || '--:--:--'}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!botStatus.running ? (
              <button
                onClick={startBot}
                disabled={botLoading}
                className="group relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow-success"
                title="Start the trading bot to begin scanning markets and executing trades"
              >
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-success-600 via-success-500 to-success-600 bg-[length:200%_100%] animate-shimmer"></div>
                <div className="absolute inset-0 bg-success-500 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <Power size={16} className="relative z-10" />
                <span className="relative z-10">Start Bot</span>
              </button>
            ) : (
              <button
                onClick={stopBot}
                disabled={botLoading}
                className="group relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow-error"
                title="Stop the trading bot and halt all trading activities"
              >
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-error-600 via-error-500 to-error-600 bg-[length:200%_100%] animate-shimmer"></div>
                <div className="absolute inset-0 bg-error-500 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <Square size={16} className="relative z-10" />
                <span className="relative z-10">Stop Bot</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
