'use client'

import { useTrading } from '@/hooks/useTrading'
import Chip from '@/components/Chip'
import WidgetGrid, { Widget } from '@/components/WidgetGrid'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useMemo } from 'react'

// Individual widget components
function TotalValueWidget() {
  const { portfolio } = useTrading()
  return (
    <div>
      <div className="text-sm text-gray-400">Total Value</div>
      <div className="text-3xl font-bold mt-2">${(portfolio.totalValue || 0).toFixed(2)}</div>
      <div className={`text-sm mt-2 flex items-center gap-1 ${(portfolio.roi || 0) >= 0 ? 'text-success-500' : 'text-error-500'}`}>
        {(portfolio.roi || 0) >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        {(portfolio.roi || 0).toFixed(2)}% ROI
      </div>
    </div>
  )
}

function CashWidget() {
  const { portfolio } = useTrading()
  return (
    <div>
      <div className="text-sm text-gray-400">Available Cash</div>
      <div className="text-3xl font-bold mt-2">${(portfolio.cash || 0).toFixed(2)}</div>
      <div className="text-xs text-gray-500 mt-2">Positions: ${(portfolio.positionsValue || 0).toFixed(2)}</div>
    </div>
  )
}

function ProfitWidget() {
  const { portfolio } = useTrading()
  return (
    <div>
      <div className="text-sm text-gray-400">Total Profit</div>
      <div className={`text-3xl font-bold mt-2 ${(portfolio.totalNetProfit ?? portfolio.totalProfit ?? 0) >= 0 ? 'text-success-500' : 'text-error-500'}`}>
        ${((portfolio.totalNetProfit ?? portfolio.totalProfit) || 0).toFixed(2)}
      </div>
      <div className="text-xs text-gray-500 mt-2">
        {portfolio.totalTrades || 0} trades · Fees: ${(portfolio.totalFees || 0).toFixed(2)}
      </div>
    </div>
  )
}

function WinRateWidget() {
  const { portfolio } = useTrading()
  return (
    <div>
      <div className="text-sm text-gray-400">Win Rate</div>
      <div className="text-3xl font-bold mt-2">{(portfolio.winRate || 0).toFixed(1)}%</div>
      <div className="text-xs text-gray-500 mt-2">
        {portfolio.winningTrades || 0}W / {portfolio.losingTrades || 0}L
      </div>
    </div>
  )
}

function PositionsWidget() {
  const { livePositions, totalUnrealizedPL, openCoinbase } = useTrading()
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400">Open Positions ({livePositions.length})</span>
        {totalUnrealizedPL !== 0 && (
          <Chip color={totalUnrealizedPL >= 0 ? 'success' : 'error'} size="small">
            {totalUnrealizedPL >= 0 ? '+' : ''}${totalUnrealizedPL.toFixed(2)}
          </Chip>
        )}
      </div>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {livePositions.slice(0, 10).map((pos) => (
          <div key={pos.id} className="flex items-center justify-between p-2 bg-surface rounded">
            <div>
              <Chip onClick={() => openCoinbase(pos.symbol)} size="small">
                {pos.symbol}
              </Chip>
              <p className="text-xs text-gray-500 mt-1">${(pos.entryPrice || 0).toFixed(6)}</p>
            </div>
            <div className="text-right">
              <Chip
                color={(pos.currentPLPercent || 0) >= 0 ? 'success' : 'error'}
                size="small"
              >
                {(pos.currentPLPercent || 0) >= 0 ? '+' : ''}{(pos.currentPLPercent || 0).toFixed(2)}%
              </Chip>
            </div>
          </div>
        ))}
        {livePositions.length === 0 && (
          <p className="text-center text-gray-400 py-4">No open positions</p>
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
      {topPerformers.map((coin) => (
        <div key={coin.symbol} className="p-2 bg-surface rounded">
          <Chip size="small">{coin.symbol}</Chip>
          <p className="text-sm text-success-500 mt-1">+${coin.profit.toFixed(2)}</p>
          <p className="text-xs text-gray-500">{coin.trades} trades · {coin.winRate.toFixed(0)}% win</p>
        </div>
      ))}
      {topPerformers.length === 0 && (
        <p className="text-center text-gray-400 py-4">No profitable coins yet</p>
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
      {worstPerformers.map((coin) => (
        <div key={coin.symbol} className="p-2 bg-surface rounded">
          <Chip size="small">{coin.symbol}</Chip>
          <p className="text-sm text-error-500 mt-1">${coin.profit.toFixed(2)}</p>
          <p className="text-xs text-gray-500">{coin.trades} trades · {coin.winRate.toFixed(0)}% win</p>
        </div>
      ))}
      {worstPerformers.length === 0 && (
        <p className="text-center text-gray-400 py-4">No losing coins yet</p>
      )}
    </div>
  )
}

function RecentTradesWidget() {
  const { trades, openCoinbase } = useTrading()
  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {trades.slice(0, 5).map((trade, idx) => (
        <div key={idx} className="flex items-center justify-between p-2 bg-surface rounded">
          <Chip onClick={() => openCoinbase(trade.symbol)} size="small">
            {trade.symbol}
          </Chip>
          <div className="flex items-center gap-2">
            <span className={trade.profit >= 0 ? 'text-success-500' : 'text-error-500'}>
              {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
            </span>
            <Chip color={trade.profit >= 0 ? 'success' : 'error'} size="small">
              {trade.profitPercent >= 0 ? '+' : ''}{trade.profitPercent.toFixed(2)}%
            </Chip>
          </div>
        </div>
      ))}
      {trades.length === 0 && (
        <p className="text-center text-gray-400 py-4">No trades yet</p>
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

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {recentActivities.map((activity, idx) => (
        <div key={idx} className="p-2 bg-surface rounded">
          <div className="flex items-center justify-between">
            <Chip 
              size="small" 
              color={getActivityColor(activity)}
            >
              {getActivityType(activity)}
            </Chip>
            <span className="text-xs text-gray-500">
              {new Date(activity.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-xs mt-1">{activity.symbol}</p>
          {activity.profit !== undefined && (
            <p className={`text-xs ${activity.profit >= 0 ? 'text-success-500' : 'text-error-500'}`}>
              {activity.profit >= 0 ? '+' : ''}${activity.profit.toFixed(2)}
            </p>
          )}
        </div>
      ))}
      {recentActivities.length === 0 && (
        <p className="text-center text-gray-400 py-4">No activity yet</p>
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
    <div className="p-6">
      <WidgetGrid widgets={widgets} storageKey="overview" />
    </div>
  )
}
