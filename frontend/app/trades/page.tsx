'use client'

import { useTrading } from '@/hooks/useTrading'
import { Card, CardTitle, CardContent } from '@/components/Card'
import Chip from '@/components/Chip'

export default function TradeHistoryPage() {
  const { trades, formatHoldTime, formatTimestamp, openCoinbase } = useTrading()

  const totalProfit = trades.reduce((sum, t) => sum + (t.netProfit ?? t.profit), 0)
  const winRate = trades.length ? (trades.filter(t => (t.netProfit ?? t.profit) > 0).length / trades.length * 100) : 0

  return (
    <div className="p-6 space-y-6">
      {trades.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Win Rate', value: winRate.toFixed(1) + '%' },
            { label: 'Avg Profit', value: '$' + (trades.length ? (totalProfit / trades.length).toFixed(2) : '0.00') },
            { label: 'Total Trades', value: trades.length },
            { label: 'Total Profit', value: (totalProfit >= 0 ? '+' : '') + '$' + totalProfit.toFixed(2), color: totalProfit >= 0 ? 'success' : 'error' },
          ].map((stat, i) => (
            <Card key={i} className="flex flex-col justify-center">
              <CardContent>
                <p className="text-xs text-gray-400">{stat.label}</p>
                <p className={`text-xl font-bold mt-1 ${stat.color === 'success' ? 'text-success-500' : stat.color === 'error' ? 'text-error-500' : ''}`}>
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardTitle>Trade History</CardTitle>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-2">Coin</th>
                  <th className="text-right py-2 px-2">Entry</th>
                  <th className="text-right py-2 px-2">Exit</th>
                  <th className="text-right py-2 px-2">P&L</th>
                  <th className="text-right py-2 px-2">%</th>
                  <th className="text-center py-2 px-2">Reason</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade, i) => (
                  <tr key={i} className="border-b border-gray-800 hover:bg-surface-light">
                    <td className="py-2 px-2">
                      <Chip size="small" onClick={() => openCoinbase(trade.symbol)}>
                        {trade.symbol}
                      </Chip>
                    </td>
                    <td className="text-right py-2 px-2 font-mono text-xs">${(trade.entryPrice || 0).toFixed(6)}</td>
                    <td className="text-right py-2 px-2 font-mono text-xs">${(trade.exitPrice || 0).toFixed(6)}</td>
                    <td className={`text-right py-2 px-2 font-bold ${(trade.netProfit ?? trade.profit) >= 0 ? 'text-success-500' : 'text-error-500'}`}>
                      {(trade.netProfit ?? trade.profit) >= 0 ? '+' : ''}${(trade.netProfit ?? trade.profit).toFixed(2)}
                    </td>
                    <td className="text-right py-2 px-2">
                      <Chip size="small" color={(trade.netProfit ?? trade.profit) >= 0 ? 'success' : 'error'}>
                        {(trade.netProfit ?? trade.profit) >= 0 ? '+' : ''}{(trade.netProfitPercent ?? trade.profitPercent).toFixed(2)}%
                      </Chip>
                    </td>
                    <td className="text-center py-2 px-2 text-xs">{trade.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {trades.length === 0 && (
              <p className="text-center py-8 text-gray-500">No trades yet. Start the bot to begin!</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
