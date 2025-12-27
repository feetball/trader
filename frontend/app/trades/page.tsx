'use client'

import { useTrading } from '@/hooks/useTrading'
import { Card, CardTitle, CardContent } from '@/components/Card'
import { AuditEntryDisplay } from '@/components/AuditEntryDisplay'
import Chip from '@/components/Chip'
import { formatHoldTime, formatTimestamp, extractTradeAuditData, formatTradeAuditTexts } from '@/lib/utils'
import { TrendingUp, TrendingDown, BarChart3, DollarSign, Target, History, ArrowUpRight, ArrowDownRight } from 'lucide-react'

export default function TradeHistoryPage() {
  const { trades, openCoinbase } = useTrading()

  const totalProfit = trades.reduce((sum, t) => sum + (t.netProfit ?? t.profit), 0)
  const winRate = trades.length ? (trades.filter(t => (t.netProfit ?? t.profit) > 0).length / trades.length * 100) : 0
  const avgProfit = trades.length ? totalProfit / trades.length : 0

  return (
    <div className="p-3 md:p-6 pb-24 md:pb-6 space-y-3 md:space-y-6">
      {trades.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
          {[
            { 
              label: 'Win Rate', 
              value: winRate.toFixed(1) + '%', 
              icon: Target, 
              color: 'primary',
              subtext: `${trades.filter(t => (t.netProfit ?? t.profit) > 0).length}W / ${trades.filter(t => (t.netProfit ?? t.profit) <= 0).length}L`
            },
            { 
              label: 'Avg Profit', 
              value: '$' + avgProfit.toFixed(2), 
              icon: BarChart3, 
              color: avgProfit >= 0 ? 'success' : 'error',
              trend: avgProfit >= 0 ? 'up' : 'down'
            },
            { 
              label: 'Total Trades', 
              value: trades.length, 
              icon: History, 
              color: 'info' 
            },
            { 
              label: 'Total Profit', 
              value: (totalProfit >= 0 ? '+' : '') + '$' + totalProfit.toFixed(2), 
              icon: DollarSign,
              color: totalProfit >= 0 ? 'success' : 'error',
              trend: totalProfit >= 0 ? 'up' : 'down',
              highlight: true
            },
          ].map((stat, i) => (
            <Card key={i} variant="glass" hover className="group">
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-xl bg-gradient-to-br from-${stat.color}-500/20 to-${stat.color}-600/10`}>
                    <stat.icon size={18} className={`text-${stat.color}-400`} />
                  </div>
                  {stat.trend && (
                    <div className={`flex items-center gap-1 text-xs ${stat.trend === 'up' ? 'text-success-400' : 'text-error-400'}`}>
                      {stat.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                <p className={`text-2xl font-bold ${
                  stat.highlight 
                    ? (totalProfit >= 0 ? 'gradient-text-profit' : 'gradient-text-loss')
                    : 'bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent'
                }`}>
                  {stat.value}
                </p>
                {stat.subtext && (
                  <p className="text-xs text-gray-500 mt-1">{stat.subtext}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card variant="glass">
        <CardTitle icon={<History size={18} className="text-info-400" />}>
          Trade History
        </CardTitle>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-gray-400 font-medium">Coin</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium">Entry Date & Time</th>
                  <th className="text-right py-4 px-4 text-gray-400 font-medium">Coins</th>
                  <th className="text-right py-4 px-4 text-gray-400 font-medium">Buy Price</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium">Exit Date & Time</th>
                  <th className="text-right py-4 px-4 text-gray-400 font-medium">Sell Price</th>
                  <th className="text-right py-4 px-4 text-gray-400 font-medium">P&L</th>
                  <th className="text-right py-4 px-4 text-gray-400 font-medium">%</th>
                  <th className="text-center py-4 px-4 text-gray-400 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade, i) => {
                  const profit = trade.netProfit ?? trade.profit
                  const isProfit = profit >= 0
                  const auditData = extractTradeAuditData(trade.audit)
                  const { hasAudit, entry } = auditData
                  const { gradeText, momentumText, rsiText, volText, cfgBuyText, cfgSellText } = formatTradeAuditTexts(auditData)
                  return (
                    <tr 
                      key={i} 
                      className={`border-b border-white/5 hover:bg-white/5 transition-colors group ${
                        isProfit ? 'hover:bg-success-500/5' : 'hover:bg-error-500/5'
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-1 h-8 rounded-full ${isProfit ? 'bg-success-500' : 'bg-error-500'}`}></div>
                          <Chip 
                            size="small" 
                            onClick={() => openCoinbase(trade.symbol)}
                            className="cursor-pointer group-hover:scale-105 transition-transform"
                          >
                            {trade.symbol}
                          </Chip>
                        </div>
                        {!hasAudit && (
                          <div className="mt-2">
                            <span className="text-xs text-gray-600 font-mono px-2 py-1 rounded-lg bg-white/5">
                              Audit: legacy trade (no signal/config snapshot)
                            </span>
                          </div>
                        )}
                        <AuditEntryDisplay 
                          entry={trade.audit?.entry}
                          showVolume={true}
                          showReasons={true}
                          maxReasons={4}
                          configAtEntry={trade.audit?.configAtEntry}
                          configAtExit={trade.audit?.configAtExit}
                        />
                      </td>
                      <td className="text-left py-4 px-4 font-mono text-xs text-gray-400">
                        {new Date(trade.entryTime).toLocaleString()}
                      </td>
                      <td className="text-right py-4 px-4 font-mono text-xs text-gray-400">
                        {(trade.quantity || 0).toFixed(4)}
                      </td>
                      <td className="text-right py-4 px-4 font-mono text-xs text-gray-400">
                        ${(trade.entryPrice || 0).toFixed(6)}
                      </td>
                      <td className="text-left py-4 px-4 font-mono text-xs text-gray-400">
                        {new Date(trade.exitTime).toLocaleString()}
                      </td>
                      <td className="text-right py-4 px-4 font-mono text-xs text-gray-400">
                        ${(trade.exitPrice || 0).toFixed(6)}
                      </td>
                      <td className={`text-right py-4 px-4 font-bold ${isProfit ? 'text-success-400' : 'text-error-400'}`}>
                        <div className="flex items-center justify-end gap-1">
                          {isProfit ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {isProfit ? '+' : ''}${profit.toFixed(2)}
                        </div>
                      </td>
                      <td className="text-right py-4 px-4">
                        <Chip 
                          size="small" 
                          variant="glow"
                          color={isProfit ? 'success' : 'error'}
                        >
                          {isProfit ? '+' : ''}{(trade.netProfitPercent ?? trade.profitPercent).toFixed(2)}%
                        </Chip>
                      </td>
                      <td className="text-center py-4 px-4">
                        <span className="text-xs text-gray-500 px-2 py-1 rounded-lg bg-white/5">
                          {trade.reason || '-'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {trades.map((trade, i) => {
              const profit = trade.netProfit ?? trade.profit
              const isProfit = profit >= 0
              const auditData = extractTradeAuditData(trade.audit)
              const { hasAudit, entry } = auditData
              return (
                <div 
                  key={i}
                  className={`p-4 rounded-xl border transition-all ${
                    isProfit 
                      ? 'bg-gradient-to-r from-success-500/5 to-transparent border-success-500/20' 
                      : 'bg-gradient-to-r from-error-500/5 to-transparent border-error-500/20'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <Chip 
                      size="small" 
                      onClick={() => openCoinbase(trade.symbol)}
                      className="cursor-pointer hover:scale-105 transition-transform"
                    >
                      {trade.symbol}
                    </Chip>
                    <div className="flex items-center gap-2">
                      <Chip 
                        size="small" 
                        variant="glow"
                        color={isProfit ? 'success' : 'error'}
                      >
                        {isProfit ? '+' : ''}{(trade.netProfitPercent ?? trade.profitPercent).toFixed(2)}%
                      </Chip>
                      <div className={`flex items-center gap-1 font-bold text-sm ${isProfit ? 'text-success-400' : 'text-error-400'}`}>
                        {isProfit ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {isProfit ? '+' : ''}${profit.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Audit Info */}
                  {!hasAudit && (
                    <div className="mb-2">
                      <span className="text-xs text-gray-600 font-mono px-2 py-1 rounded-lg bg-white/5">
                        Audit: legacy trade (no signal/config snapshot)
                      </span>
                    </div>
                  )}
                  <AuditEntryDisplay 
                    entry={trade.audit?.entry}
                    showVolume={true}
                    showReasons={true}
                    maxReasons={4}
                    configAtEntry={trade.audit?.configAtEntry}
                    configAtExit={trade.audit?.configAtExit}
                    className="mb-3"
                  />

                  {/* Trade Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500 mb-0.5">Entry</p>
                      <p className="font-mono text-gray-300">{new Date(trade.entryTime).toLocaleString()}</p>
                      <p className="font-mono text-gray-400">${(trade.entryPrice || 0).toFixed(6)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-0.5">Exit</p>
                      <p className="font-mono text-gray-300">{new Date(trade.exitTime).toLocaleString()}</p>
                      <p className="font-mono text-gray-400">${(trade.exitPrice || 0).toFixed(6)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-0.5">Quantity</p>
                      <p className="font-mono text-gray-300">{(trade.quantity || 0).toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-0.5">Reason</p>
                      <p className="text-gray-300">{trade.reason || '-'}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Empty State */}
          {trades.length === 0 && (
            <div className="text-center py-12">
              <History size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-500 text-lg">No trades yet</p>
              <p className="text-gray-600 text-sm mt-1">Start the bot to begin trading</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
