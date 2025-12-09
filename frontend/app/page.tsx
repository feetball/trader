'use client'

import { useTrading } from '@/hooks/useTrading'
import { Card, CardTitle, CardContent } from '@/components/Card'
import Chip from '@/components/Chip'
import Button from '@/components/Button'
import { BarChart3, TrendingUp, TrendingDown, Clock, Zap } from 'lucide-react'
import { useMemo } from 'react'

export default function OverviewPage() {
  const {
    portfolio,
    livePositions,
    trades,
    activities,
    botStatus,
    totalUnrealizedPL,
    loading,
    refreshData,
    openCoinbase,
  } = useTrading()

  const topPerformers = useMemo(() => {
    return (coinPerformance || []).filter(c => c.profit > 0).slice(0, 5)
  }, [coinPerformance])

  const worstPerformers = useMemo(() => {
    return (coinPerformance || []).filter(c => c.profit < 0).sort((a, b) => a.profit - b.profit).slice(0, 5)
  }, [coinPerformance])

  return (
    <div className="p-6 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex flex-col justify-center">
          <CardContent>
            <div className="text-sm text-gray-400">Total Value</div>
            <div className="text-3xl font-bold mt-2">${(portfolio.totalValue || 0).toFixed(2)}</div>
            <div className={`text-sm mt-2 flex items-center gap-1 ${(portfolio.roi || 0) >= 0 ? 'text-success-500' : 'text-error-500'}`}>
              {(portfolio.roi || 0) >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {(portfolio.roi || 0).toFixed(2)}% ROI
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-center">
          <CardContent>
            <div className="text-sm text-gray-400">Available Cash</div>
            <div className="text-3xl font-bold mt-2">${(portfolio.cash || 0).toFixed(2)}</div>
            <div className="text-xs text-gray-500 mt-2">Positions: ${(portfolio.positionsValue || 0).toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-center">
          <CardContent>
            <div className="text-sm text-gray-400">Total Profit</div>
            <div className={`text-3xl font-bold mt-2 ${(portfolio.totalNetProfit ?? portfolio.totalProfit ?? 0) >= 0 ? 'text-success-500' : 'text-error-500'}`}>
              ${((portfolio.totalNetProfit ?? portfolio.totalProfit) || 0).toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {portfolio.totalTrades || 0} trades · Fees: ${(portfolio.totalFees || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-center">
          <CardContent>
            <div className="text-sm text-gray-400">Win Rate</div>
            <div className="text-3xl font-bold mt-2">{(portfolio.winRate || 0).toFixed(1)}%</div>
            <div className="text-xs text-gray-500 mt-2">
              {portfolio.winningTrades || 0}W / {portfolio.losingTrades || 0}L
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Positions and Recent Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card>
            <CardTitle className="flex items-center justify-between">
              <span>Open Positions ({livePositions.length})</span>
              {totalUnrealizedPL !== 0 && (
                <Chip color={totalUnrealizedPL >= 0 ? 'success' : 'error'}>
                  {totalUnrealizedPL >= 0 ? '+' : ''}${totalUnrealizedPL.toFixed(2)}
                </Chip>
              )}
            </CardTitle>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
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
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardTitle>Top Performers</CardTitle>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>

      {/* Recent Trades */}
      <Card>
        <CardTitle>Recent Trades</CardTitle>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  )
}
