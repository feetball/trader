'use client'

import { useTrading } from '@/hooks/useTrading'
import { Card, CardTitle, CardContent } from '@/components/Card'
import Chip from '@/components/Chip'
import { useMemo } from 'react'

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

  return (
    <div className="p-6 space-y-6">
      {/* Summary Cards */}
      {coinPerformance.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="tonal" color="success">
            <CardContent>
              <p className="text-sm text-gray-400">Best Performer</p>
              <div className="mt-2">
                <Chip color="success" size="large">{bestCoin?.symbol}</Chip>
                <p className="text-2xl font-bold text-success-500 mt-2">+${bestCoin?.profit.toFixed(2)}</p>
                <p className="text-xs text-gray-500">{bestCoin?.trades} trades</p>
              </div>
            </CardContent>
          </Card>

          <Card variant="tonal" color="error">
            <CardContent>
              <p className="text-sm text-gray-400">Worst Performer</p>
              <div className="mt-2">
                <Chip color="error" size="large">{worstCoin?.symbol}</Chip>
                <p className="text-2xl font-bold text-error-500 mt-2">${worstCoin?.profit.toFixed(2)}</p>
                <p className="text-xs text-gray-500">{worstCoin?.trades} trades</p>
              </div>
            </CardContent>
          </Card>

          <Card variant="tonal" color="info">
            <CardContent>
              <p className="text-sm text-gray-400">Most Traded</p>
              <div className="mt-2">
                <Chip color="info" size="large">{mostTraded?.symbol}</Chip>
                <p className="text-2xl font-bold mt-2">{mostTraded?.trades} trades</p>
                <p className={`text-xs ${mostTraded?.profit >= 0 ? 'text-success-500' : 'text-error-500'}`}>
                  {mostTraded?.profit >= 0 ? '+' : ''}${mostTraded?.profit.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Coins Table */}
      <Card>
        <CardTitle>Performance by Coin</CardTitle>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-2">Coin</th>
                  <th className="text-right py-2 px-2">Profit</th>
                  <th className="text-right py-2 px-2">Trades</th>
                  <th className="text-right py-2 px-2">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {coinPerformance.map((coin) => (
                  <tr key={coin.symbol} className="border-b border-gray-800 hover:bg-surface-light">
                    <td className="py-2 px-2">
                      <Chip size="small" onClick={() => openCoinbase(coin.symbol)} className="cursor-pointer">
                        {coin.symbol}
                      </Chip>
                    </td>
                    <td className={`text-right py-2 px-2 ${coin.profit >= 0 ? 'text-success-500' : 'text-error-500'}`}>
                      {coin.profit >= 0 ? '+' : ''}${coin.profit.toFixed(2)}
                    </td>
                    <td className="text-right py-2 px-2">{coin.trades}</td>
                    <td className="text-right py-2 px-2">
                      <Chip size="small" color={coin.winRate >= 60 ? 'success' : coin.winRate >= 40 ? 'warning' : 'error'}>
                        {coin.winRate.toFixed(0)}%
                      </Chip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {coinPerformance.length === 0 && (
              <p className="text-center py-8 text-gray-500">No performance data yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
