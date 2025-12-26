'use client'

import { useTrading } from '@/hooks/useTrading'
import { RefreshCw, Power, Square, Cpu, Settings, Target, Clock, Activity, BarChart3, DollarSign, Zap, Monitor } from 'lucide-react'
import { useState, useEffect } from 'react'
import { frontendLogger, type FrontendLog } from '@/lib/logger'
import { 
  Box, Grid, Typography, Card, CardHeader, CardContent, 
  Button, Chip, Avatar, IconButton, Tooltip, 
  CircularProgress, Divider, useTheme, Paper, List, ListItem, ListItemText
} from '@mui/material'

// Utility to get log color class based on content
function getBotLogColor(message: string): string {
  const lowerMsg = message?.toLowerCase()
  if (lowerMsg.includes('error')) return 'error.main'
  if (lowerMsg.includes('success') || lowerMsg.includes('sold')) return 'success.main'
  if (lowerMsg.includes('buy') || lowerMsg.includes('bought')) return 'info.main'
  return 'text.secondary'
}

// Utility to get log color class based on level
function getFrontendLogColor(level: string): string {
  if (level === 'error') return 'error.main'
  if (level === 'warn') return 'warning.main'
  if (level === 'success') return 'success.main'
  return 'text.secondary'
}

export default function BotStatusPage() {
  const { botStatus, botLoading, loading, portfolio, settings, startBot, stopBot, refreshData } = useTrading()
  const [frontendLogs, setFrontendLogs] = useState<FrontendLog[]>([])
  const theme = useTheme()

  // Subscribe to frontend logs
  useEffect(() => {
    setFrontendLogs(frontendLogger.getLogs())
    const unsubscribe = frontendLogger.subscribe((logs) => {
      setFrontendLogs(logs)
    })
    frontendLogger.info('Bot Status page loaded')
    return unsubscribe
  }, [])

  return (
    <Box sx={{ p: { xs: 1, md: 2 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Main Status and Controls */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '100%', borderRadius: 3, bgcolor: 'background.paper', backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.05)' }}>
            <CardHeader 
              avatar={<Avatar sx={{ bgcolor: 'rgba(124, 77, 255, 0.1)', color: 'primary.main' }}><Cpu size={20} /></Avatar>}
              title={<Typography variant="h6" fontWeight={700}>Bot Status</Typography>}
              sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', py: 2 }}
            />
            <CardContent sx={{ py: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                <Box sx={{ position: 'relative' }}>
                  <Avatar sx={{ 
                    width: 100, 
                    height: 100, 
                    borderRadius: 4,
                    bgcolor: botStatus.running ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)',
                    color: botStatus.running ? 'success.main' : 'text.disabled',
                    boxShadow: botStatus.running ? '0 0 30px rgba(34, 197, 94, 0.2)' : 'none',
                    transition: 'all 0.3s'
                  }}>
                    <Cpu size={48} className={botStatus.running ? 'animate-pulse' : ''} />
                  </Avatar>
                  {botStatus.running && (
                    <Box sx={{ 
                      position: 'absolute', 
                      top: -4, 
                      right: -4, 
                      width: 16, 
                      height: 16, 
                      borderRadius: '50%', 
                      bgcolor: 'success.main', 
                      border: '3px solid',
                      borderColor: 'background.paper',
                      animation: 'pulse 2s infinite'
                    }} />
                  )}
                </Box>

                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Box sx={{ mb: 2 }}>
                    <Chip 
                      label={botStatus.running ? 'RUNNING' : 'STOPPED'} 
                      color={botStatus.running ? 'success' : 'default'}
                      size="small"
                      sx={{ fontWeight: 800, borderRadius: 1.5, px: 1 }}
                    />
                  </Box>
                  <Typography variant="h5" fontWeight={800} gutterBottom>
                    {botStatus.message || 'Awaiting status...'}
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Activity size={14} className="text-info-400" />
                        <Typography variant="caption" color="text.secondary">Cycles:</Typography>
                        <Typography variant="caption" fontWeight={700} sx={{ fontFamily: 'monospace' }}>{botStatus.cycleCount || 0}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Zap size={14} className="text-warning-400" />
                        <Typography variant="caption" color="text.secondary">API Calls:</Typography>
                        <Typography variant="caption" fontWeight={700} sx={{ fontFamily: 'monospace' }}>{botStatus.apiCalls || 0}</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%', borderRadius: 3, bgcolor: 'background.paper', backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.05)' }}>
            <CardHeader 
              avatar={<Avatar sx={{ bgcolor: 'rgba(3, 218, 198, 0.1)', color: 'secondary.main' }}><Settings size={20} /></Avatar>}
              title={<Typography variant="h6" fontWeight={700}>Controls</Typography>}
              sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', py: 2 }}
            />
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 3 }}>
              {!botStatus.running ? (
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  size="large"
                  startIcon={<Power size={20} />}
                  onClick={startBot}
                  disabled={botLoading}
                  sx={{ 
                    py: 2, 
                    borderRadius: 2, 
                    fontWeight: 700,
                    boxShadow: '0 8px 24px rgba(34, 197, 94, 0.3)',
                    '&:hover': { boxShadow: '0 12px 32px rgba(34, 197, 94, 0.4)' }
                  }}
                >
                  Start Bot
                </Button>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  color="error"
                  size="large"
                  startIcon={<Square size={20} />}
                  onClick={stopBot}
                  disabled={botLoading}
                  sx={{ 
                    py: 2, 
                    borderRadius: 2, 
                    fontWeight: 700,
                    boxShadow: '0 8px 24px rgba(239, 68, 68, 0.3)',
                    '&:hover': { boxShadow: '0 12px 32px rgba(239, 68, 68, 0.4)' }
                  }}
                >
                  Stop Bot
                </Button>
              )}
              <Button
                fullWidth
                variant="outlined"
                color="inherit"
                size="large"
                startIcon={<RefreshCw size={18} className={loading ? 'animate-spin' : ''} />}
                onClick={refreshData}
                disabled={loading}
                sx={{ 
                  py: 1.5, 
                  borderRadius: 2, 
                  borderColor: 'rgba(255,255,255,0.1)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.2)' }
                }}
              >
                Refresh Data
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Stats Grid */}
      <Grid container spacing={3}>
        {[
          { label: 'Open Positions', value: portfolio.openPositions || 0, suffix: `/${settings.MAX_POSITIONS}`, icon: Target, color: 'primary' },
          { label: 'Available Cash', value: '$' + (portfolio.cash?.toFixed(0) || '0'), icon: DollarSign, color: 'success' },
          { label: 'Total Trades', value: portfolio.totalTrades || 0, icon: BarChart3, color: 'info' },
          { label: 'Scan Interval', value: settings.SCAN_INTERVAL + 's', icon: Clock, color: 'warning' },
        ].map((stat, i) => (
          <Grid item xs={6} md={3} key={i}>
            <Paper sx={{ 
              p: 2.5, 
              borderRadius: 3, 
              bgcolor: 'background.paper', 
              backgroundImage: 'none', 
              border: '1px solid rgba(255,255,255,0.05)',
              '&:hover': { borderColor: `${stat.color}.main`, transform: 'translateY(-4px)' },
              transition: 'all 0.3s'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Avatar sx={{ 
                  width: 28, 
                  height: 28, 
                  bgcolor: `rgba(${stat.color === 'primary' ? '124, 77, 255' : stat.color === 'success' ? '34, 197, 94' : stat.color === 'info' ? '3, 218, 198' : '245, 158, 11'}, 0.1)`, 
                  color: `${stat.color}.main` 
                }}>
                  <stat.icon size={14} />
                </Avatar>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>{stat.label}</Typography>
              </Box>
              <Typography variant="h5" fontWeight={800}>
                {stat.value}<Typography component="span" variant="body2" color="text.disabled">{stat.suffix || ''}</Typography>
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Logs Section */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, bgcolor: 'background.paper', backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.05)' }}>
            <CardHeader 
              avatar={<Avatar sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', color: 'warning.main' }}><Activity size={20} /></Avatar>}
              title={<Typography variant="h6" fontWeight={700}>Bot Logs</Typography>}
              sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', py: 2 }}
            />
            <CardContent sx={{ p: 0 }}>
              <List sx={{ maxHeight: 400, overflow: 'auto', py: 0 }}>
                {botStatus.logs?.map((log, i) => (
                  <ListItem 
                    key={`bot-${log.timestamp}-${i}`}
                    sx={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Typography variant="caption" sx={{ color: 'text.disabled', fontFamily: 'monospace', minWidth: 70 }}>
                            {log.timestamp}
                          </Typography>
                          <Typography variant="body2" sx={{ color: getBotLogColor(log.message), fontFamily: 'monospace' }}>
                            {log.message}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
                {!botStatus.logs?.length && (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Activity size={32} className="text-gray-600" style={{ marginBottom: 8 }} />
                    <Typography variant="body2" color="text.disabled">No logs yet. Start the bot to see activity.</Typography>
                  </Box>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, bgcolor: 'background.paper', backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.05)' }}>
            <CardHeader 
              avatar={<Avatar sx={{ bgcolor: 'rgba(3, 218, 198, 0.1)', color: 'info.main' }}><Monitor size={20} /></Avatar>}
              title={<Typography variant="h6" fontWeight={700}>Frontend Logs</Typography>}
              sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', py: 2 }}
            />
            <CardContent sx={{ p: 0 }}>
              <List sx={{ maxHeight: 400, overflow: 'auto', py: 0 }}>
                {frontendLogs.map((log, i) => (
                  <ListItem 
                    key={`frontend-${log.timestamp}-${i}`}
                    sx={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Typography variant="caption" sx={{ color: 'text.disabled', fontFamily: 'monospace', minWidth: 70 }}>
                            {log.timestamp}
                          </Typography>
                          <Typography variant="body2" sx={{ color: getFrontendLogColor(log.level), fontFamily: 'monospace' }}>
                            {log.message}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
                {!frontendLogs.length && (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Monitor size={32} className="text-gray-600" style={{ marginBottom: 8 }} />
                    <Typography variant="body2" color="text.disabled">No frontend logs yet.</Typography>
                  </Box>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <style jsx global>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </Box>
  )
}
