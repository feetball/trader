'use client'

import { useTrading } from '@/hooks/useTrading'
import { useMemo } from 'react'
import { 
  Box, Grid, Typography, Card, CardContent, 
  Chip, Avatar, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper
} from '@mui/material'
import EmojiEventsRounded from '@mui/icons-material/EmojiEventsRounded'
import TrendingDownRounded from '@mui/icons-material/TrendingDownRounded'
import BarChartRounded from '@mui/icons-material/BarChartRounded'
import NorthEastRounded from '@mui/icons-material/NorthEastRounded'
import SouthEastRounded from '@mui/icons-material/SouthEastRounded'
import MilitaryTechRounded from '@mui/icons-material/MilitaryTechRounded'
import LocalFireDepartmentRounded from '@mui/icons-material/LocalFireDepartmentRounded'

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
    <Box sx={{ p: { xs: 1, md: 2 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Summary Cards */}
      {coinPerformance.length > 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ 
              height: '100%', 
              borderRadius: 3, 
              bgcolor: 'background.paper', 
              backgroundImage: 'none', 
              border: '1px solid rgba(255,255,255,0.05)',
              '&:hover': { borderColor: 'success.main', transform: 'translateY(-4px)' },
              transition: 'all 0.3s'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Avatar sx={{ 
                    width: 48, 
                    height: 48, 
                    bgcolor: 'rgba(34, 197, 94, 0.1)', 
                    color: 'success.main'
                  }}>
                    <EmojiEventsRounded />
                  </Avatar>
                  <Chip 
                    label="Best" 
                    color="success" 
                    size="small" 
                    icon={<NorthEastRounded fontSize="small" />}
                    sx={{ fontWeight: 700, borderRadius: 1.5 }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
                  Best Performer
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Chip 
                    label={bestCoin?.symbol} 
                    color="success" 
                    onClick={() => openCoinbase(bestCoin?.symbol || '')}
                    sx={{ fontWeight: 800, fontSize: '1rem', px: 1, cursor: 'pointer', '&:hover': { transform: 'scale(1.05)' }, transition: 'transform 0.2s' }}
                  />
                </Box>
                <Typography variant="h4" fontWeight={800} color="success.main">
                  +${bestCoin?.profit.toFixed(2)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">{bestCoin?.trades} trades</Typography>
                  <Typography variant="caption" color="text.disabled">•</Typography>
                  <Typography variant="caption" color="success.main" fontWeight={700}>{bestCoin?.winRate.toFixed(0)}% win rate</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ 
              height: '100%', 
              borderRadius: 3, 
              bgcolor: 'background.paper', 
              backgroundImage: 'none', 
              border: '1px solid rgba(255,255,255,0.05)',
              '&:hover': { borderColor: 'error.main', transform: 'translateY(-4px)' },
              transition: 'all 0.3s'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Avatar sx={{ 
                    width: 48, 
                    height: 48, 
                    bgcolor: 'rgba(239, 68, 68, 0.1)', 
                    color: 'error.main'
                  }}>
                    <TrendingDownRounded />
                  </Avatar>
                  <Chip 
                    label="Worst" 
                    color="error" 
                    size="small" 
                    icon={<SouthEastRounded fontSize="small" />}
                    sx={{ fontWeight: 700, borderRadius: 1.5 }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
                  Worst Performer
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Chip 
                    label={worstCoin?.symbol} 
                    color="error" 
                    onClick={() => openCoinbase(worstCoin?.symbol || '')}
                    sx={{ fontWeight: 800, fontSize: '1rem', px: 1, cursor: 'pointer', '&:hover': { transform: 'scale(1.05)' }, transition: 'transform 0.2s' }}
                  />
                </Box>
                <Typography variant="h4" fontWeight={800} color="error.main">
                  ${worstCoin?.profit.toFixed(2)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">{worstCoin?.trades} trades</Typography>
                  <Typography variant="caption" color="text.disabled">•</Typography>
                  <Typography variant="caption" color="error.main" fontWeight={700}>{worstCoin?.winRate.toFixed(0)}% win rate</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ 
              height: '100%', 
              borderRadius: 3, 
              bgcolor: 'background.paper', 
              backgroundImage: 'none', 
              border: '1px solid rgba(255,255,255,0.05)',
              '&:hover': { borderColor: 'info.main', transform: 'translateY(-4px)' },
              transition: 'all 0.3s'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Avatar sx={{ 
                    width: 48, 
                    height: 48, 
                    bgcolor: 'rgba(3, 218, 198, 0.1)', 
                    color: 'secondary.main'
                  }}>
                    <LocalFireDepartmentRounded />
                  </Avatar>
                  <Chip 
                    label="Active" 
                    color="info" 
                    size="small" 
                    icon={<BarChartRounded fontSize="small" />}
                    sx={{ fontWeight: 700, borderRadius: 1.5 }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
                  Most Traded
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Chip 
                    label={mostTraded?.symbol} 
                    color="info" 
                    onClick={() => openCoinbase(mostTraded?.symbol || '')}
                    sx={{ fontWeight: 800, fontSize: '1rem', px: 1, cursor: 'pointer', '&:hover': { transform: 'scale(1.05)' }, transition: 'transform 0.2s' }}
                  />
                </Box>
                <Typography variant="h4" fontWeight={800}>
                  {mostTraded?.trades} trades
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, color: (mostTraded?.profit ?? 0) >= 0 ? 'success.main' : 'error.main' }}>
                  {(mostTraded?.profit ?? 0) >= 0 ? <NorthEastRounded fontSize="small" /> : <SouthEastRounded fontSize="small" />}
                  <Typography variant="caption" fontWeight={700}>
                    {(mostTraded?.profit ?? 0) >= 0 ? '+' : ''}${(mostTraded?.profit ?? 0).toFixed(2)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Coins Table */}
      <Card sx={{ borderRadius: 3, bgcolor: 'background.paper', backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.05)' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(124, 77, 255, 0.1)', color: 'primary.main' }}>
            <BarChartRounded fontSize="small" />
          </Avatar>
          <Typography variant="h6" fontWeight={700}>Performance by Coin</Typography>
        </Box>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Coin</TableCell>
                  <TableCell align="right" sx={{ color: 'text.secondary', fontWeight: 600 }}>Profit</TableCell>
                  <TableCell align="right" sx={{ color: 'text.secondary', fontWeight: 600 }}>Trades</TableCell>
                  <TableCell align="right" sx={{ color: 'text.secondary', fontWeight: 600 }}>Win Rate</TableCell>
                  <TableCell align="right" sx={{ color: 'text.secondary', fontWeight: 600 }}>Avg Trade</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {coinPerformance.map((coin, idx) => (
                  <TableRow 
                    key={coin.symbol}
                    sx={{ 
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontFamily: 'monospace', width: 24 }}>
                          #{idx + 1}
                        </Typography>
                        <Chip 
                          label={coin.symbol} 
                          size="small" 
                          onClick={() => openCoinbase(coin.symbol)}
                          sx={{ fontWeight: 700, cursor: 'pointer', '&:hover': { transform: 'scale(1.05)' }, transition: 'transform 0.2s' }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700} sx={{ color: coin.profit >= 0 ? 'success.main' : 'error.main' }}>
                        {coin.profit >= 0 ? '+' : ''}${coin.profit.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{coin.trades}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={`${coin.winRate.toFixed(0)}%`}
                        size="small"
                        color={coin.winRate >= 60 ? 'success' : coin.winRate >= 40 ? 'warning' : 'error'}
                        sx={{ fontWeight: 700, borderRadius: 1 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ color: coin.profit / coin.trades >= 0 ? 'success.main' : 'error.main', fontFamily: 'monospace' }}>
                        ${(coin.profit / coin.trades).toFixed(2)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {coinPerformance.length > 0 && (
                  <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                    <TableCell sx={{ fontWeight: 800 }}>Total</TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle1" fontWeight={800} sx={{ color: totalProfit >= 0 ? 'success.main' : 'error.main' }}>
                        {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle1" fontWeight={800} sx={{ fontFamily: 'monospace' }}>
                        {coinPerformance.reduce((acc, c) => acc + c.trades, 0)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" />
                    <TableCell align="right" />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {coinPerformance.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 12 }}>
              <MilitaryTechRounded sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">No performance data yet</Typography>
              <Typography variant="body2" color="text.disabled">Start trading to see your coin performance</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
