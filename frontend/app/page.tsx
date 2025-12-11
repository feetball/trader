'use client'

import { useTrading } from '@/hooks/useTrading'
import Chip from '@/components/Chip'
import WidgetGrid, { Widget } from '@/components/WidgetGrid'
import { TrendingUp, TrendingDown, DollarSign, Wallet, Trophy, Target, Zap, BarChart3, Activity } from 'lucide-react'
import { useMemo } from 'react'

// Individual widget components with enhanced visuals
function TotalValueWidget() {
  const { portfolio } = useTrading()
  const roi = portfolio.roi || 0
  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-lg bg-gradient-to-br from-primary-500/20 to-info-500/20">
          <DollarSign size={18} className="text-primary-400" />
        </div>
        <span className="text-sm text-gray-400">Total Value</span>
      </div>
      <div className="text-4xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
        ${(portfolio.totalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <div className={`mt-3 flex items-center gap-2 ${roi >= 0 ? 'text-success-400' : 'text-error-400'}`}>
        <div className={`p-1 rounded-md ${roi >= 0 ? 'bg-success-500/20' : 'bg-error-500/20'}`}>
          {roi >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        </div>
        <span className="font-semibold">{roi >= 0 ? '+' : ''}{roi.toFixed(2)}% ROI</span>
      </div>
    </div>
  )
}

function CashWidget() {
  const { portfolio } = useTrading()
  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-lg bg-gradient-to-br from-info-500/20 to-primary-500/20">
          <Wallet size={18} className="text-info-400" />
        </div>
        <span className="text-sm text-gray-400">Available Cash</span>
      </div>
      <div className="text-4xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
        ${(portfolio.cash || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <div className="mt-3 text-sm text-gray-500 flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-info-500/50 animate-pulse"></span>
        Positions: ${(portfolio.positionsValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
  )
}

function ProfitWidget() {
  const { portfolio } = useTrading()
  const profit = (portfolio.totalNetProfit ?? portfolio.totalProfit) || 0
  const isPositive = profit >= 0
  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${isPositive ? 'from-success-500/20 to-success-400/10' : 'from-error-500/20 to-error-400/10'}`}>
          <TrendingUp size={18} className={isPositive ? 'text-success-400' : 'text-error-400'} />
        </div>
        <span className="text-sm text-gray-400">Total Profit</span>
      </div>
      <div className={`text-4xl font-bold ${isPositive ? 'gradient-text-profit' : 'gradient-text-loss'}`}>
        {isPositive ? '+' : ''}${profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <div className="mt-3 text-sm text-gray-500 flex items-center gap-3">
        <span>{portfolio.totalTrades || 0} trades</span>
        <span className="text-gray-600">•</span>
        <span>Fees: ${(portfolio.totalFees || 0).toFixed(2)}</span>
      </div>
    </div>
  )
}

function WinRateWidget() {
  const { portfolio } = useTrading()
  const winRate = portfolio.winRate || 0
  const circumference = 2 * Math.PI * 36
  const progress = (winRate / 100) * circumference
  
  return (
    <div className="relative flex items-center gap-4">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="36"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-gray-800"
          />
          <circle
            cx="48"
            cy="48"
            r="36"
            stroke="url(#gradient)"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">{winRate.toFixed(0)}%</span>
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Trophy size={16} className="text-warning-400" />
          <span className="text-sm text-gray-400">Win Rate</span>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success-500"></span>
            <span className="text-success-400">{portfolio.winningTrades || 0} Wins</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-error-500"></span>
            <span className="text-error-400">{portfolio.losingTrades || 0} Losses</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function PositionsWidget() {
  const { livePositions, totalUnrealizedPL, openCoinbase } = useTrading()
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-warning-500/20 to-primary-500/20">
            <Target size={16} className="text-warning-400" />
          </div>
          <span className="text-sm text-gray-400">Open Positions ({livePositions.length})</span>
        </div>
        {totalUnrealizedPL !== 0 && (
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
            totalUnrealizedPL >= 0 
              ? 'bg-success-500/20 text-success-400 shadow-glow-success' 
              : 'bg-error-500/20 text-error-400 shadow-glow-error'
          }`}>
            {totalUnrealizedPL >= 0 ? '+' : ''}${totalUnrealizedPL.toFixed(2)}
          </div>
        )}
      </div>
      <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
        {livePositions.slice(0, 10).map((pos, idx) => (
          <div 
            key={pos.id} 
            className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 border border-white/5 hover:border-white/10 group"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Chip onClick={() => openCoinbase(pos.symbol)} size="small" className="cursor-pointer hover:scale-105 transition-transform">
                  {pos.symbol}
                </Chip>
                <span className="text-xs text-gray-500 font-mono">Invested: ${(pos.investedAmount || 0).toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 font-mono">Bought: {new Date(pos.entryTime).toLocaleString()} @ ${(pos.entryPrice || 0).toFixed(6)}</p>
            </div>
            <div className="text-right">
              <div className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                (pos.currentPLPercent || 0) >= 0 
                  ? 'bg-success-500/20 text-success-400' 
                  : 'bg-error-500/20 text-error-400'
              }`}>
                {(pos.currentPLPercent || 0) >= 0 ? '+' : ''}{(pos.currentPLPercent || 0).toFixed(2)}%
              </div>
            </div>
          </div>
        ))}
        {livePositions.length === 0 && (
          <div className="text-center py-8">
            <Target size={32} className="mx-auto text-gray-600 mb-2" />
            <p className="text-gray-500">No open positions</p>
          </div>
        )}
      </div>
    </div>
  )
}

function TopPerformersWidget() {
  const { coinPerformance } = useTrading()
  const topPerformers = useMemo(() => {
    return (coinPerformance || []).filter(c => c.profit > 0).slice(0, 5)
  }, [coinPerformance])

  return (
    <div className="space-y-2">
      {topPerformers.map((coin, idx) => (
        <div 
          key={coin.symbol} 
          className="p-3 rounded-xl bg-gradient-to-r from-success-500/10 to-transparent border border-success-500/20 hover:border-success-500/40 transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-mono">#{idx + 1}</span>
              <Chip size="small" className="bg-success-500/20">{coin.symbol}</Chip>
            </div>
            <span className="text-success-400 font-bold">+${coin.profit.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <span>{coin.trades} trades</span>
            <span className="text-gray-600">•</span>
            <span className="text-success-400">{coin.winRate.toFixed(0)}% win</span>
          </div>
        </div>
      ))}
      {topPerformers.length === 0 && (
        <div className="text-center py-8">
          <Trophy size={32} className="mx-auto text-gray-600 mb-2" />
          <p className="text-gray-500">No profitable coins yet</p>
        </div>
      )}
    </div>
  )
}

function WorstPerformersWidget() {
  const { coinPerformance } = useTrading()
  const worstPerformers = useMemo(() => {
    return (coinPerformance || []).filter(c => c.profit < 0).sort((a, b) => a.profit - b.profit).slice(0, 5)
  }, [coinPerformance])

  return (
    <div className="space-y-2">
      {worstPerformers.map((coin, idx) => (
        <div 
          key={coin.symbol} 
          className="p-3 rounded-xl bg-gradient-to-r from-error-500/10 to-transparent border border-error-500/20 hover:border-error-500/40 transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-mono">#{idx + 1}</span>
              <Chip size="small" className="bg-error-500/20">{coin.symbol}</Chip>
            </div>
            <span className="text-error-400 font-bold">${coin.profit.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <span>{coin.trades} trades</span>
            <span className="text-gray-600">•</span>
            <span className="text-error-400">{coin.winRate.toFixed(0)}% win</span>
          </div>
        </div>
      ))}
      {worstPerformers.length === 0 && (
        <div className="text-center py-8">
          <BarChart3 size={32} className="mx-auto text-gray-600 mb-2" />
          <p className="text-gray-500">No losing coins yet</p>
        </div>
      )}
    </div>
  )
}

function RecentTradesWidget() {
  const { trades, openCoinbase } = useTrading()
  return (
    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
      {trades.slice(0, 5).map((trade, idx) => (
        <div 
          key={idx} 
          className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 hover:scale-[1.01] ${
            trade.profit >= 0 
              ? 'bg-gradient-to-r from-success-500/5 to-transparent border-success-500/20 hover:border-success-500/40' 
              : 'bg-gradient-to-r from-error-500/5 to-transparent border-error-500/20 hover:border-error-500/40'
          }`}
        >
          <Chip onClick={() => openCoinbase(trade.symbol)} size="small" className="cursor-pointer hover:scale-105 transition-transform">
            {trade.symbol}
          </Chip>
          <div className="flex items-center gap-3">
            <span className={`font-bold ${trade.profit >= 0 ? 'text-success-400' : 'text-error-400'}`}>
              {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
            </span>
            <div className={`px-2 py-1 rounded-lg text-xs font-semibold ${
              trade.profit >= 0 
                ? 'bg-success-500/20 text-success-400' 
                : 'bg-error-500/20 text-error-400'
            }`}>
              {trade.profitPercent >= 0 ? '+' : ''}{trade.profitPercent.toFixed(2)}%
            </div>
          </div>
        </div>
      ))}
      {trades.length === 0 && (
        <div className="text-center py-8">
          <Zap size={32} className="mx-auto text-gray-600 mb-2" />
          <p className="text-gray-500">No trades yet</p>
        </div>
      )}
    </div>
  )
}

function RecentActivityWidget() {
  const { activities } = useTrading()
  const recentActivities = activities.slice(0, 5)

  const getActivityColor = (activity: { profit: number; reason?: string }) => {
    if (activity.reason?.toLowerCase().includes('buy')) return 'info'
    return activity.profit >= 0 ? 'success' : 'error'
  }

  const getActivityType = (activity: { profit: number; reason?: string }) => {
    if (activity.reason?.toLowerCase().includes('buy')) return 'BUY'
    return activity.profit >= 0 ? 'WIN' : 'LOSS'
  }

  const getActivityStyles = (type: string) => {
    switch(type) {
      case 'BUY': return 'from-info-500/10 border-info-500/20 hover:border-info-500/40'
      case 'WIN': return 'from-success-500/10 border-success-500/20 hover:border-success-500/40'
      default: return 'from-error-500/10 border-error-500/20 hover:border-error-500/40'
    }
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
      {recentActivities.map((activity, idx) => {
        const type = getActivityType(activity)
        return (
          <div 
            key={idx} 
            className={`p-3 rounded-xl bg-gradient-to-r to-transparent border transition-all duration-300 ${getActivityStyles(type)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={14} className={
                  type === 'BUY' ? 'text-info-400' : type === 'WIN' ? 'text-success-400' : 'text-error-400'
                } />
                <Chip 
                  size="small" 
                  color={getActivityColor(activity)}
                >
                  {type}
                </Chip>
                <span className="text-sm font-medium">{activity.symbol}</span>
              </div>
              <span className="text-xs text-gray-500 font-mono">
                {new Date(activity.timestamp).toLocaleTimeString()}
              </span>
            </div>
            {activity.profit !== undefined && (
              <p className={`text-sm mt-2 font-bold ${activity.profit >= 0 ? 'text-success-400' : 'text-error-400'}`}>
                {activity.profit >= 0 ? '+' : ''}${activity.profit.toFixed(2)}
              </p>
            )}
          </div>
        )
      })}
      {recentActivities.length === 0 && (
        <div className="text-center py-8">
          <Activity size={32} className="mx-auto text-gray-600 mb-2" />
          <p className="text-gray-500">No activity yet</p>
        </div>
      )}
    </div>
  )
}

export default function OverviewPage() {
  const widgets: Widget[] = useMemo(() => [
    { id: 'total-value', title: 'Total Value', component: <TotalValueWidget />, minWidth: 1, defaultWidth: 1 },
    { id: 'cash', title: 'Available Cash', component: <CashWidget />, minWidth: 1, defaultWidth: 1 },
    { id: 'profit', title: 'Total Profit', component: <ProfitWidget />, minWidth: 1, defaultWidth: 1 },
    { id: 'winrate', title: 'Win Rate', component: <WinRateWidget />, minWidth: 1, defaultWidth: 1 },
    { id: 'positions', title: 'Open Positions', component: <PositionsWidget />, minWidth: 2, defaultWidth: 2 },
    { id: 'top-performers', title: 'Top Performers', component: <TopPerformersWidget />, minWidth: 1, defaultWidth: 1 },
    { id: 'worst-performers', title: 'Worst Performers', component: <WorstPerformersWidget />, minWidth: 1, defaultWidth: 1 },
    { id: 'recent-trades', title: 'Recent Trades', component: <RecentTradesWidget />, minWidth: 2, defaultWidth: 2 },
    { id: 'activity', title: 'Recent Activity', component: <RecentActivityWidget />, minWidth: 1, defaultWidth: 2 },
  ], [])

  return (
    <div className="p-3 md:p-6 max-h-[calc(100vh-80px)] overflow-y-auto">
      <WidgetGrid widgets={widgets} storageKey="overview" />
    </div>
  )
}
