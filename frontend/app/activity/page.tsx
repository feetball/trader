'use client'

import { useTrading } from '@/hooks/useTrading'
import { formatTimestamp } from '@/lib/utils'
import { 
  Box, Grid, Typography, Card, CardContent, 
  Chip, Avatar, Paper, useTheme, Divider, List, ListItem, ListItemText
} from '@mui/material'
import { Activity, TrendingUp, TrendingDown, Calendar, Clock } from 'lucide-react'

export default function ActivityPage() {
  const { activities, openCoinbase } = useTrading()
  const theme = useTheme()

  const today = new Date().toDateString()
  const todayActivities = activities.filter(a => new Date(a.timestamp).toDateString() === today)
  const todayWins = todayActivities.filter(a => a.profit > 0).length
  const todayLosses = todayActivities.filter(a => a.profit < 0).length
  const todayNet = todayActivities.reduce((sum, a) => sum + a.profit, 0)

  return (
    <Box sx={{ p: { xs: 1, md: 2 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {todayActivities.length > 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ 
              p: 3, 
              borderRadius: 3, 
              bgcolor: 'rgba(34, 197, 94, 0.05)', 
              border: '1px solid rgba(34, 197, 94, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(34, 197, 94, 0.1)', color: 'success.main' }}>
                  <TrendingUp size={18} />
                </Avatar>
                <Typography variant="caption" color="success.main" fontWeight={700}>Wins Today</Typography>
              </Box>
              <Typography variant="h3" fontWeight={800} color="success.main">{todayWins}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ 
              p: 3, 
              borderRadius: 3, 
              bgcolor: 'rgba(239, 68, 68, 0.05)', 
              border: '1px solid rgba(239, 68, 68, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(239, 68, 68, 0.1)', color: 'error.main' }}>
                  <TrendingDown size={18} />
                </Avatar>
                <Typography variant="caption" color="error.main" fontWeight={700}>Losses Today</Typography>
              </Box>
              <Typography variant="h3" fontWeight={800} color="error.main">{todayLosses}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ 
              p: 3, 
              borderRadius: 3, 
              bgcolor: todayNet >= 0 ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)', 
              border: todayNet >= 0 ? '1px solid rgba(34, 197, 94, 0.1)' : '1px solid rgba(239, 68, 68, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: todayNet >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                  color: todayNet >= 0 ? 'success.main' : 'error.main' 
                }}>
                  <Calendar size={18} />
                </Avatar>
                <Typography variant="caption" color={todayNet >= 0 ? 'success.main' : 'error.main'} fontWeight={700}>Net Today</Typography>
              </Box>
              <Typography variant="h3" fontWeight={800} color={todayNet >= 0 ? 'success.main' : 'error.main'}>
                {todayNet >= 0 ? '+' : ''}${todayNet.toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      <Card sx={{ borderRadius: 3, bgcolor: 'background.paper', backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.05)' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(124, 77, 255, 0.1)', color: 'primary.main' }}>
            <Activity size={18} />
          </Avatar>
          <Typography variant="h6" fontWeight={700}>Activity Timeline</Typography>
        </Box>
        <CardContent sx={{ p: 0 }}>
          <List sx={{ maxHeight: 600, overflow: 'auto', py: 0 }}>
            {activities.map((activity, i) => (
              <ListItem 
                key={i}
                sx={{ 
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  borderLeft: '4px solid',
                  borderLeftColor: activity.profit >= 0 ? 'success.main' : 'error.main',
                  bgcolor: activity.profit >= 0 ? 'rgba(34, 197, 94, 0.02)' : 'rgba(239, 68, 68, 0.02)',
                  '&:hover': { bgcolor: activity.profit >= 0 ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)' },
                  transition: 'background-color 0.2s',
                  px: 3,
                  py: 2
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip 
                          label={activity.symbol} 
                          size="small" 
                          onClick={() => openCoinbase(activity.symbol)}
                          sx={{ fontWeight: 700, cursor: 'pointer', '&:hover': { transform: 'scale(1.05)' }, transition: 'transform 0.2s' }}
                        />
                        <Typography variant="subtitle1" fontWeight={800} sx={{ color: activity.profit >= 0 ? 'success.main' : 'error.main' }}>
                          {activity.profit >= 0 ? '+' : ''}${activity.profit.toFixed(2)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.disabled' }}>
                        <Clock size={12} />
                        <Typography variant="caption">{formatTimestamp(activity.timestamp)}</Typography>
                      </Box>
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary">
                      {activity.reason}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
            {activities.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 12 }}>
                <Activity size={48} className="text-gray-600" style={{ marginBottom: 16 }} />
                <Typography variant="h6" color="text.secondary">No recent activity</Typography>
              </Box>
            )}
          </List>
        </CardContent>
      </Card>
    </Box>
  )
}
