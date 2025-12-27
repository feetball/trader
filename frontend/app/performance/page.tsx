'use client'

import { useTrading } from '@/hooks/useTrading'
import { Card, CardTitle, CardContent } from '@/components/Card'
import Chip from '@/components/Chip'
import { useMemo } from 'react'
import { Trophy, TrendingDown, BarChart3, ArrowUpRight, ArrowDownRight, Award, Flame } from 'lucide-react'

export default function PerformancePage() {
  const { coinPerformance, openCoinbase } = useTrading()

  const bestCoin = useMemo(() => 
    coinPerformance?.length ? [...coinPerformance].sort((a, b) => b.profit - a.profit)[0] : null, 
    [coinPerformance]
  )

  const worstCoin = useMemo(() => 
    coinPerformance?.length ? [...coinPerformance].sort((a, b) => a.profit - b.profit)[0] : null, 
    [coinPerformance]
  )

  const mostTraded = useMemo(() => 
    coinPerformance?.length ? [...coinPerformance].sort((a, b) => b.trades - a.trades)[0] : null, 
    [coinPerformance]
  )

  const totalProfit = useMemo(() => 
    coinPerformance?.reduce((acc, coin) => acc + coin.profit, 0) || 0,
    [coinPerformance]
  )

  return (
    <div className="p-3 md:p-6 pb-24 md:pb-6 space-y-3 md:space-y-6">
      {/* Summary Cards */}
      {coinPerformance.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
          <Card variant="glass" hover glow color="success">
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-success-500/30 to-success-600/10 shadow-glow-success">
                  <Trophy size={24} className="text-success-400" />
                </div>
                <Chip color="success" variant="glow" size="small">
                  <ArrowUpRight size={12} />
                  Best
                </Chip>
              </div>
              <p className="text-sm text-gray-400 mb-2">Best Performer</p>
              <div className="flex items-center gap-3 mb-3">
                <Chip 
                  color="success" 
                  size="large" 
                  onClick={() => openCoinbase(bestCoin?.symbol || '')}
                  className="cursor-pointer hover:scale-105 transition-transform"
                >
                  {bestCoin?.symbol}
                </Chip>
              </div>
              <p className="text-3xl font-bold gradient-text-profit">+${bestCoin?.profit.toFixed(2)}</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                <span>{bestCoin?.trades} trades</span>
                <span className="text-gray-600">•</span>
                <span className="text-success-400">{bestCoin?.winRate.toFixed(0)}% win rate</span>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass" hover glow color="error">
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-error-500/30 to-error-600/10 shadow-glow-error">
                  <TrendingDown size={24} className="text-error-400" />
                </div>
                <Chip color="error" variant="glow" size="small">
                  <ArrowDownRight size={12} />
                  Worst
                </Chip>
              </div>
              <p className="text-sm text-gray-400 mb-2">Worst Performer</p>
              <div className="flex items-center gap-3 mb-3">
                <Chip 
                  color="error" 
                  size="large"
                  onClick={() => openCoinbase(worstCoin?.symbol || '')}
                  className="cursor-pointer hover:scale-105 transition-transform"
                >
                  {worstCoin?.symbol}
                </Chip>
              </div>
              <p className="text-3xl font-bold gradient-text-loss">${worstCoin?.profit.toFixed(2)}</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                <span>{worstCoin?.trades} trades</span>
                <span className="text-gray-600">•</span>
                <span className="text-error-400">{worstCoin?.winRate.toFixed(0)}% win rate</span>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass" hover glow color="info">
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-info-500/30 to-info-600/10 shadow-glow-sm">
                  <Flame size={24} className="text-info-400" />
                </div>
                <Chip color="info" variant="glow" size="small">
                  <BarChart3 size={12} />
                  Active
                </Chip>
              </div>
              <p className="text-sm text-gray-400 mb-2">Most Traded</p>
              <div className="flex items-center gap-3 mb-3">
                <Chip 
                  color="info" 
                  size="large"
                  onClick={() => openCoinbase(mostTraded?.symbol || '')}
                  className="cursor-pointer hover:scale-105 transition-transform"
                >
                  {mostTraded?.symbol}
                </Chip>
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                {mostTraded?.trades} trades
              </p>
              <div className={`flex items-center gap-2 mt-2 text-sm ${(mostTraded?.profit ?? 0) >= 0 ? 'text-success-400' : 'text-error-400'}`}>
                {(mostTraded?.profit ?? 0) >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {(mostTraded?.profit ?? 0) >= 0 ? '+' : ''}${(mostTraded?.profit ?? 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Coins Table */}
      <Card variant="glass">
        <CardTitle icon={<BarChart3 size={18} className="text-primary-400" />}>
          Performance by Coin
        </CardTitle>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-gray-400 font-medium">Coin</th>
                  <th className="text-right py-4 px-4 text-gray-400 font-medium">Profit</th>
                  <th className="text-right py-4 px-4 text-gray-400 font-medium">Trades</th>
                  <th className="text-right py-4 px-4 text-gray-400 font-medium">Win Rate</th>
                  <th className="text-right py-4 px-4 text-gray-400 font-medium">Avg Trade</th>
                </tr>
              </thead>
              <tbody>
                {coinPerformance.map((coin, idx) => (
                  <tr 
                    key={coin.symbol} 
                    className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-600 font-mono w-6">#{idx + 1}</span>
                        <Chip 
                          size="small" 
                          onClick={() => openCoinbase(coin.symbol)} 
                          className="cursor-pointer group-hover:scale-105 transition-transform"
                        >
                          {coin.symbol}
                        </Chip>
                      </div>
                    </td>
                    <td className="text-right py-4 px-4">
                      <span className={`font-bold ${coin.profit >= 0 ? 'text-success-400' : 'text-error-400'}`}>
                        {coin.profit >= 0 ? '+' : ''}${coin.profit.toFixed(2)}
                      </span>
                    </td>
                    <td className="text-right py-4 px-4">
                      <span className="font-mono">{coin.trades}</span>
                    </td>
                    <td className="text-right py-4 px-4">
                      <Chip 
                        size="small" 
                        variant="glow"
                        color={coin.winRate >= 60 ? 'success' : coin.winRate >= 40 ? 'warning' : 'error'}
                      >
                        {coin.winRate.toFixed(0)}%
                      </Chip>
                    </td>
                    <td className="text-right py-4 px-4">
                      <span className={`text-sm ${coin.profit / coin.trades >= 0 ? 'text-success-400' : 'text-error-400'}`}>
                        ${(coin.profit / coin.trades).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              {coinPerformance.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-white/10 bg-white/5">
                    <td className="py-4 px-4">
                      <span className="font-bold text-gray-300">Total</span>
                    </td>
                    <td className="text-right py-4 px-4">
                      <span className={`font-bold text-lg ${totalProfit >= 0 ? 'gradient-text-profit' : 'gradient-text-loss'}`}>
                        {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
                      </span>
                    </td>
                    <td className="text-right py-4 px-4">
                      <span className="font-mono font-bold">{coinPerformance.reduce((acc, c) => acc + c.trades, 0)}</span>
                    </td>
                    <td className="text-right py-4 px-4">
                      <span className="text-gray-400">-</span>
                    </td>
                    <td className="text-right py-4 px-4">
                      <span className="text-gray-400">-</span>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {coinPerformance.map((coin, idx) => (
              <div 
                key={coin.symbol}
                className={`p-4 rounded-xl border transition-all ${
                  coin.profit >= 0 
                    ? 'bg-gradient-to-r from-success-500/5 to-transparent border-success-500/20' 
                    : 'bg-gradient-to-r from-error-500/5 to-transparent border-error-500/20'
                }`}
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 font-mono">#{idx + 1}</span>
                    <Chip 
                      size="small" 
                      onClick={() => openCoinbase(coin.symbol)} 
                      className="cursor-pointer hover:scale-105 transition-transform"
                    >
                      {coin.symbol}
                    </Chip>
                  </div>
                  <span className={`font-bold text-lg ${coin.profit >= 0 ? 'text-success-400' : 'text-error-400'}`}>
                    {coin.profit >= 0 ? '+' : ''}${coin.profit.toFixed(2)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Trades</p>
                    <p className="font-mono font-semibold">{coin.trades}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Win Rate</p>
                    <Chip 
                      size="small" 
                      variant="glow"
                      color={coin.winRate >= 60 ? 'success' : coin.winRate >= 40 ? 'warning' : 'error'}
                    >
                      {coin.winRate.toFixed(0)}%
                    </Chip>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Avg Trade</p>
                    <p className={`text-sm font-semibold ${coin.profit / coin.trades >= 0 ? 'text-success-400' : 'text-error-400'}`}>
                      ${(coin.profit / coin.trades).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {coinPerformance.length > 0 && (
              <div className="p-4 rounded-xl bg-white/10 border border-white/20">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-300">Total</span>
                  <div className="text-right">
                    <div className={`font-bold text-xl ${totalProfit >= 0 ? 'gradient-text-profit' : 'gradient-text-loss'}`}>
                      {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {coinPerformance.reduce((acc, c) => acc + c.trades, 0)} trades
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Empty State */}
          {coinPerformance.length === 0 && (
            <div className="text-center py-12">
              <Award size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-500 text-lg">No performance data yet</p>
              <p className="text-gray-600 text-sm mt-1">Start trading to see your coin performance</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
