'use client'

import { useTrading, type Position } from '@/hooks/useTrading'
import WidgetGrid, { Widget } from '@/components/WidgetGrid'
import AuditEntryDisplay from '@/components/AuditEntryDisplay'
import { useMemo, useState } from 'react'
import { 
  Box, Typography, Chip, IconButton,
  CircularProgress,
  Avatar, List, ListItem, ListItemText,
  Paper
} from '@mui/material'
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded'
import TrendingDownRounded from '@mui/icons-material/TrendingDownRounded'
import AttachMoneyRounded from '@mui/icons-material/AttachMoneyRounded'
import AccountBalanceWalletRounded from '@mui/icons-material/AccountBalanceWalletRounded'
import EmojiEventsRounded from '@mui/icons-material/EmojiEventsRounded'
import TrackChangesRounded from '@mui/icons-material/TrackChangesRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'

// Individual widget components with enhanced visuals
function TotalValueWidget() {
  const { portfolio } = useTrading()
  const roi = portfolio.roi || 0
  return (
    <Box sx={{ position: 'relative' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <Avatar sx={{ 
          width: 32, 
          height: 32, 
          bgcolor: 'rgba(124, 77, 255, 0.1)', 
          color: 'primary.main' 
        }}>
          <AttachMoneyRounded fontSize="small" />
        </Avatar>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>Total Value</Typography>
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 800 }}>
        ${(portfolio.totalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </Typography>
      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip 
          size="small"
          icon={roi >= 0 ? <TrendingUpRounded fontSize="small" /> : <TrendingDownRounded fontSize="small" />}
          label={`${roi >= 0 ? '+' : ''}${roi.toFixed(2)}% ROI`}
          color={roi >= 0 ? 'success' : 'error'}
          sx={{ fontWeight: 700, borderRadius: 1.5 }}
        />
      </Box>
    </Box>
  )
}

function CashWidget() {
  const { portfolio } = useTrading()
  return (
    <Box sx={{ position: 'relative' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <Avatar sx={{ 
          width: 32, 
          height: 32, 
          bgcolor: 'rgba(3, 218, 198, 0.1)', 
          color: 'secondary.main' 
        }}>
          <AccountBalanceWalletRounded fontSize="small" />
        </Avatar>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>Available Cash</Typography>
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 800 }}>
        ${(portfolio.cash || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </Typography>
      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'secondary.main' }} />
        <Typography variant="caption" color="text.secondary">
          Positions: ${(portfolio.positionsValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Typography>
      </Box>
    </Box>
  )
}

function ProfitWidget() {
  const { portfolio } = useTrading()
  const profit = (portfolio.totalNetProfit ?? portfolio.totalProfit) || 0
  const isPositive = profit >= 0
  return (
    <Box sx={{ position: 'relative' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <Avatar sx={{ 
          width: 32, 
          height: 32, 
          bgcolor: isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
          color: isPositive ? 'success.main' : 'error.main' 
        }}>
          {isPositive ? <TrendingUpRounded fontSize="small" /> : <TrendingDownRounded fontSize="small" />}
        </Avatar>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>Total Profit</Typography>
      </Box>
      <Typography variant="h4" sx={{ 
        fontWeight: 800, 
        color: isPositive ? 'success.main' : 'error.main'
      }}>
        {isPositive ? '+' : ''}${profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </Typography>
      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="caption" color="text.secondary">{portfolio.totalTrades || 0} trades</Typography>
        <Typography variant="caption" color="text.disabled">•</Typography>
        <Typography variant="caption" color="text.secondary">Fees: ${(portfolio.totalFees || 0).toFixed(2)}</Typography>
      </Box>
    </Box>
  )
}

function WinRateWidget() {
  const { portfolio } = useTrading()
  const winRate = portfolio.winRate || 0
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress 
          variant="determinate" 
          value={100} 
          size={80} 
          thickness={5} 
          sx={{ color: 'rgba(255,255,255,0.05)' }} 
        />
        <CircularProgress 
          variant="determinate" 
          value={winRate} 
          size={80} 
          thickness={5} 
          sx={{ 
            position: 'absolute', 
            left: 0, 
            color: 'primary.main',
            '& .MuiCircularProgress-circle': { strokeLinecap: 'round' }
          }} 
        />
        <Box sx={{ 
          position: 'absolute', 
          inset: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Typography variant="h6" fontWeight={800}>{winRate.toFixed(0)}%</Typography>
        </Box>
      </Box>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <EmojiEventsRounded fontSize="small" sx={{ color: 'warning.main' }} />
          <Typography variant="caption" color="text.secondary" fontWeight={600}>Win Rate</Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main' }} />
            <Typography variant="caption" color="success.main" fontWeight={600}>{portfolio.winningTrades || 0} Wins</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'error.main' }} />
            <Typography variant="caption" color="error.main" fontWeight={600}>{portfolio.losingTrades || 0} Losses</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

function PositionsWidget() {
  const { livePositions, totalUnrealizedPL, openCoinbase, forceSellPosition } = useTrading()
  const [sellingId, setSellingId] = useState<string | null>(null)

  const handleForceSell = async (pos: Position) => {
    if (!confirm(`Force sell ${pos.symbol}?\n\nCurrent P&L: ${(pos.currentPLPercent || 0).toFixed(2)}%\nThis will sell immediately at market price.`)) {
      return
    }
    
    setSellingId(pos.id)
    try {
      const result = await forceSellPosition(pos.id)
      if (result.success) {
        alert(`✅ ${result.message}`)
      } else {
        alert(`❌ Error: ${result.message}`)
      }
    } catch (err) {
      alert(`❌ Failed to sell: ${err}`)
    } finally {
      setSellingId(null)
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(245, 158, 11, 0.1)', color: 'warning.main' }}>
            <TrackChangesRounded fontSize="small" />
          </Avatar>
          <Typography variant="subtitle2" fontWeight={700}>Open Positions ({livePositions.length})</Typography>
        </Box>
        {totalUnrealizedPL !== 0 && (
          <Chip 
            label={`${totalUnrealizedPL >= 0 ? '+' : ''}$${totalUnrealizedPL.toFixed(2)}`}
            color={totalUnrealizedPL >= 0 ? 'success' : 'error'}
            size="small"
            sx={{ fontWeight: 700, borderRadius: 1.5 }}
          />
        )}
      </Box>
      <List sx={{ maxHeight: 320, overflow: 'auto', pr: 1 }}>
        {livePositions.map((pos, idx) => (
          <ListItem 
            key={pos.id} 
            sx={{ 
              mb: 1, 
              borderRadius: 2, 
              bgcolor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' },
              transition: 'all 0.2s'
            }}
            secondaryAction={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography 
                  variant="body2" 
                  fontWeight={700} 
                  sx={{ 
                    color: (pos.currentPLPercent || 0) >= 0 ? 'success.main' : 'error.main',
                    bgcolor: (pos.currentPLPercent || 0) >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    px: 1, py: 0.5, borderRadius: 1
                  }}
                >
                  {(pos.currentPLPercent || 0) >= 0 ? '+' : ''}{(pos.currentPLPercent || 0).toFixed(2)}%
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => handleForceSell(pos)}
                  disabled={sellingId === pos.id}
                  sx={{ color: 'error.light', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' } }}
                >
                  {sellingId === pos.id ? <CircularProgress size={16} color="inherit" /> : <CloseRounded fontSize="small" />}
                </IconButton>
              </Box>
            }
          >
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography 
                    variant="body2" 
                    fontWeight={700} 
                    onClick={() => openCoinbase(pos.symbol)}
                    sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                  >
                    {pos.symbol}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {(pos.quantity || 0).toFixed(4)} coins
                  </Typography>
                </Box>
              }
              secondary={
                <Box>
                  <AuditEntryDisplay audit={pos.audit} className="contents" />
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">Entry: ${pos.entryPrice?.toFixed(6)}</Typography>
                    {pos.currentPrice && <Typography variant="caption" color="info.main">Now: ${pos.currentPrice.toFixed(6)}</Typography>}
                  </Box>
                </Box>
              }
            />
          </ListItem>
        ))}
        {livePositions.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.disabled">No open positions</Typography>
          </Box>
        )}
      </List>
    </Box>
  )
}

function TopPerformersWidget() {
  const { coinPerformance } = useTrading()
  const topPerformers = useMemo(() => {
    return (coinPerformance || []).filter(c => c.profit > 0).slice(0, 5)
  }, [coinPerformance])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {topPerformers.map((coin, idx) => (
        <Paper 
          key={coin.symbol} 
          sx={{ 
            p: 1.5, 
            borderRadius: 2, 
            bgcolor: 'rgba(34, 197, 94, 0.03)', 
            border: '1px solid rgba(34, 197, 94, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="caption" color="text.disabled" fontWeight={700}>#{idx + 1}</Typography>
            <Chip label={coin.symbol} size="small" sx={{ bgcolor: 'rgba(34, 197, 94, 0.1)', color: 'success.light', fontWeight: 700 }} />
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" fontWeight={700} color="success.main">+${coin.profit.toFixed(2)}</Typography>
            <Typography variant="caption" color="text.disabled">{coin.winRate.toFixed(0)}% win</Typography>
          </Box>
        </Paper>
      ))}
      {topPerformers.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.disabled">No profitable coins yet</Typography>
        </Box>
      )}
    </Box>
  )
}

function WorstPerformersWidget() {
  const { coinPerformance } = useTrading()
  const worstPerformers = useMemo(() => {
    return (coinPerformance || []).filter(c => c.profit < 0).sort((a, b) => a.profit - b.profit).slice(0, 5)
  }, [coinPerformance])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {worstPerformers.map((coin, idx) => (
        <Paper 
          key={coin.symbol} 
          sx={{ 
            p: 1.5, 
            borderRadius: 2, 
            bgcolor: 'rgba(239, 68, 68, 0.03)', 
            border: '1px solid rgba(239, 68, 68, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="caption" color="text.disabled" fontWeight={700}>#{idx + 1}</Typography>
            <Chip label={coin.symbol} size="small" sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: 'error.light', fontWeight: 700 }} />
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" fontWeight={700} color="error.main">${coin.profit.toFixed(2)}</Typography>
            <Typography variant="caption" color="text.disabled">{coin.winRate.toFixed(0)}% win</Typography>
          </Box>
        </Paper>
      ))}
      {worstPerformers.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.disabled">No losing coins yet</Typography>
        </Box>
      )}
    </Box>
  )
}

function RecentTradesWidget() {
  const { recentTrades, openCoinbase } = useTrading()
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 400, overflow: 'auto', pr: 1 }}>
      {recentTrades.slice(0, 5).map((trade, idx) => (
        <Paper 
          key={idx} 
          sx={{ 
            p: 2, 
            borderRadius: 2, 
            bgcolor: trade.profit >= 0 ? 'rgba(34, 197, 94, 0.03)' : 'rgba(239, 68, 68, 0.03)', 
            border: '1px solid',
            borderColor: trade.profit >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            '&:hover': { borderColor: trade.profit >= 0 ? 'success.main' : 'error.main' },
            transition: 'all 0.2s'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Chip 
              label={trade.symbol} 
              size="small" 
              onClick={() => openCoinbase(trade.symbol)}
              sx={{ cursor: 'pointer', fontWeight: 700, bgcolor: 'rgba(255,255,255,0.05)' }} 
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="body2" fontWeight={700} color={trade.profit >= 0 ? 'success.main' : 'error.main'}>
                {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
              </Typography>
              <Typography 
                variant="caption" 
                fontWeight={700} 
                sx={{ 
                  color: trade.profitPercent >= 0 ? 'success.main' : 'error.main',
                  bgcolor: trade.profitPercent >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  px: 1, py: 0.25, borderRadius: 1
                }}
              >
                {trade.profitPercent >= 0 ? '+' : ''}{trade.profitPercent.toFixed(2)}%
              </Typography>
            </Box>
          </Box>
          <AuditEntryDisplay audit={trade.audit} className="contents" />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
            <Typography variant="caption" color="text.disabled">Coins: {(trade.quantity || 0).toFixed(4)}</Typography>
            <Typography variant="caption" color="text.disabled">Buy: ${trade.entryPrice?.toFixed(6)}</Typography>
            <Typography variant="caption" color="text.disabled">Sell: ${trade.exitPrice?.toFixed(6)}</Typography>
          </Box>
        </Paper>
      ))}
      {recentTrades.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.disabled">No trades yet</Typography>
        </Box>
      )}
    </Box>
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {recentActivities.map((activity, idx) => {
        const type = getActivityType(activity)
        const color = getActivityColor(activity)
        return (
          <Paper 
            key={idx} 
            sx={{ 
              p: 1.5, 
              borderRadius: 2, 
              bgcolor: 'rgba(255,255,255,0.02)', 
              border: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Chip 
                label={type} 
                size="small" 
                color={color as any} 
                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }} 
              />
              <Typography variant="body2" fontWeight={600}>{activity.symbol}</Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              {activity.profit !== undefined && (
                <Typography variant="caption" fontWeight={700} color={activity.profit >= 0 ? 'success.main' : 'error.main'}>
                  {activity.profit >= 0 ? '+' : ''}${activity.profit.toFixed(2)}
                </Typography>
              )}
              <Typography variant="caption" display="block" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
                {new Date(activity.timestamp).toLocaleTimeString()}
              </Typography>
            </Box>
          </Paper>
        )
      })}
      {recentActivities.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.disabled">No activity yet</Typography>
        </Box>
      )}
    </Box>
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
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <WidgetGrid widgets={widgets} storageKey="overview" />
    </Box>
  )
}
