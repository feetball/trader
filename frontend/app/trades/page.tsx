'use client'

import { useTrading } from '@/hooks/useTrading'
import { AuditEntryDisplay } from '@/components/AuditEntryDisplay'
import { extractTradeAuditData } from '@/lib/utils'
import { 
  Box, Grid, Typography, Card, CardContent, 
  Chip, Avatar, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Divider
} from '@mui/material'
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded'
import TrendingDownRounded from '@mui/icons-material/TrendingDownRounded'
import BarChartRounded from '@mui/icons-material/BarChartRounded'
import AttachMoneyRounded from '@mui/icons-material/AttachMoneyRounded'
import TrackChangesRounded from '@mui/icons-material/TrackChangesRounded'
import HistoryRounded from '@mui/icons-material/HistoryRounded'
import NorthEastRounded from '@mui/icons-material/NorthEastRounded'
import SouthEastRounded from '@mui/icons-material/SouthEastRounded'

export default function TradeHistoryPage() {
  const { trades, openCoinbase } = useTrading()

  const totalProfit = trades.reduce((sum, t) => sum + (t.netProfit ?? t.profit), 0)
  const winRate = trades.length ? (trades.filter(t => (t.netProfit ?? t.profit) > 0).length / trades.length * 100) : 0
  const avgProfit = trades.length ? totalProfit / trades.length : 0

  return (
    <Box sx={{ p: { xs: 1, md: 2 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {trades.length > 0 && (
        <Grid container spacing={2}>
          {[
            { 
              label: 'Win Rate', 
              value: winRate.toFixed(1) + '%', 
              icon: TrackChangesRounded, 
              color: 'primary',
              subtext: `${trades.filter(t => (t.netProfit ?? t.profit) > 0).length}W / ${trades.filter(t => (t.netProfit ?? t.profit) <= 0).length}L`
            },
            { 
              label: 'Avg Profit', 
              value: '$' + avgProfit.toFixed(2), 
              icon: BarChartRounded, 
              color: avgProfit >= 0 ? 'success' : 'error',
              trend: avgProfit >= 0 ? 'up' : 'down'
            },
            { 
              label: 'Total Trades', 
              value: trades.length, 
              icon: HistoryRounded, 
              color: 'info' 
            },
            { 
              label: 'Total Profit', 
              value: (totalProfit >= 0 ? '+' : '') + '$' + totalProfit.toFixed(2), 
              icon: AttachMoneyRounded,
              color: totalProfit >= 0 ? 'success' : 'error',
              trend: totalProfit >= 0 ? 'up' : 'down',
              highlight: true
            },
          ].map((stat, i) => (
            <Grid item xs={6} lg={3} key={i}>
              <Paper sx={{ 
                p: 2.5, 
                borderRadius: 3, 
                bgcolor: 'background.paper', 
                backgroundImage: 'none', 
                border: '1px solid rgba(255,255,255,0.05)',
                '&:hover': { borderColor: `${stat.color}.main`, transform: 'translateY(-4px)' },
                transition: 'all 0.3s'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Avatar sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: `rgba(${stat.color === 'primary' ? '124, 77, 255' : stat.color === 'success' ? '34, 197, 94' : stat.color === 'info' ? '3, 218, 198' : '239, 68, 68'}, 0.1)`, 
                    color: `${stat.color}.main` 
                  }}>
                      <stat.icon fontSize="small" />
                  </Avatar>
                  {stat.trend && (
                    <Box sx={{ color: stat.trend === 'up' ? 'success.main' : 'error.main' }}>
                        {stat.trend === 'up' ? <NorthEastRounded fontSize="small" /> : <SouthEastRounded fontSize="small" />}
                    </Box>
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>{stat.label}</Typography>
                <Typography variant="h5" fontWeight={800} sx={{ 
                  color: stat.highlight ? (totalProfit >= 0 ? 'success.main' : 'error.main') : 'text.primary'
                }}>
                  {stat.value}
                </Typography>
                {stat.subtext && (
                  <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>{stat.subtext}</Typography>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <Card sx={{ borderRadius: 3, bgcolor: 'background.paper', backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.05)' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(3, 218, 198, 0.1)', color: 'secondary.main' }}>
            <HistoryRounded fontSize="small" />
          </Avatar>
          <Typography variant="h6" fontWeight={700}>Trade History</Typography>
        </Box>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table sx={{ minWidth: 1000 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Coin</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Entry Date & Time</TableCell>
                  <TableCell align="right" sx={{ color: 'text.secondary', fontWeight: 600 }}>Coins</TableCell>
                  <TableCell align="right" sx={{ color: 'text.secondary', fontWeight: 600 }}>Buy Price</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Exit Date & Time</TableCell>
                  <TableCell align="right" sx={{ color: 'text.secondary', fontWeight: 600 }}>Sell Price</TableCell>
                  <TableCell align="right" sx={{ color: 'text.secondary', fontWeight: 600 }}>P&L</TableCell>
                  <TableCell align="right" sx={{ color: 'text.secondary', fontWeight: 600 }}>%</TableCell>
                  <TableCell align="center" sx={{ color: 'text.secondary', fontWeight: 600 }}>Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trades.map((trade, i) => {
                  const profit = trade.netProfit ?? trade.profit
                  const isProfit = profit >= 0
                  const auditData = extractTradeAuditData(trade.audit)
                  const { hasAudit } = auditData
                  return (
                    <TableRow 
                      key={i}
                      sx={{ 
                        '&:hover': { bgcolor: isProfit ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)' },
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ width: 4, height: 32, borderRadius: 1, bgcolor: isProfit ? 'success.main' : 'error.main' }} />
                          <Box>
                            <Chip 
                              label={trade.symbol} 
                              size="small" 
                              onClick={() => openCoinbase(trade.symbol)}
                              sx={{ fontWeight: 700, cursor: 'pointer', '&:hover': { transform: 'scale(1.05)' }, transition: 'transform 0.2s' }}
                            />
                            {!hasAudit && (
                              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.disabled', fontSize: '0.65rem' }}>
                                Legacy trade
                              </Typography>
                            )}
                            <AuditEntryDisplay 
                              entry={trade.audit?.entry}
                              showVolume={true}
                              showReasons={true}
                              maxReasons={4}
                              configAtEntry={trade.audit?.configAtEntry}
                              configAtExit={trade.audit?.configAtExit}
                            />
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                        {new Date(trade.entryTime).toLocaleString()}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                        {(trade.quantity || 0).toFixed(4)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                        ${(trade.entryPrice || 0).toFixed(6)}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                        {new Date(trade.exitTime).toLocaleString()}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                        ${(trade.exitPrice || 0).toFixed(6)}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, color: isProfit ? 'success.main' : 'error.main' }}>
                          {isProfit ? <TrendingUpRounded fontSize="small" /> : <TrendingDownRounded fontSize="small" />}
                          <Typography variant="body2" fontWeight={700}>
                            {isProfit ? '+' : ''}${profit.toFixed(2)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={`${isProfit ? '+' : ''}${(trade.netProfitPercent ?? trade.profitPercent).toFixed(2)}%`}
                          size="small"
                          color={isProfit ? 'success' : 'error'}
                          sx={{ fontWeight: 700, borderRadius: 1 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="caption" sx={{ px: 1, py: 0.5, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.05)', color: 'text.secondary' }}>
                          {trade.reason || '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
          {trades.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 12 }}>
              <HistoryRounded sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">No trades yet</Typography>
              <Typography variant="body2" color="text.disabled">Start the bot to begin trading</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
