'use client'

import { useTrading } from '@/hooks/useTrading'
import { useState, useEffect, useRef } from 'react'
import { 
  Box, Grid, Typography, Card, CardContent, 
  Chip, Avatar, Paper, TextField, InputAdornment,
  Stack, List, ListItem, ListItemText
} from '@mui/material'
import SearchRounded from '@mui/icons-material/SearchRounded'
import CodeRounded from '@mui/icons-material/CodeRounded'
import ShoppingCartRounded from '@mui/icons-material/ShoppingCartRounded'
import LocalOfferRounded from '@mui/icons-material/LocalOfferRounded'
import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded'
import TravelExploreRounded from '@mui/icons-material/TravelExploreRounded'

export default function LogsPage() {
  const { botStatus } = useTrading()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const containerRef = useRef<HTMLDivElement>(null)

  const logs = botStatus.logs || []

  const filteredLogs = logs.filter(log => {
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterType === 'all') return true
    const msg = log.message.toLowerCase()
    switch (filterType) {
      case 'buy': return msg.includes('buy')
      case 'sell': return msg.includes('sell')
      case 'error': return msg.includes('error') || msg.includes('❌')
      case 'scan': return msg.includes('scan') || msg.includes('checking')
      default: return true
    }
  })

  const buyCount = logs.filter(l => l.message.toLowerCase().includes('buy')).length
  const sellCount = logs.filter(l => l.message.toLowerCase().includes('sell')).length
  const errorCount = logs.filter(l => l.message.toLowerCase().includes('error')).length

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs])

  return (
    <Box sx={{ p: { xs: 1, md: 2 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                <ShoppingCartRounded fontSize="small" />
              </Avatar>
              <Typography variant="caption" color="success.main" fontWeight={700}>Buy Orders</Typography>
            </Box>
            <Typography variant="h3" fontWeight={800} color="success.main">{buyCount}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ 
            p: 3, 
            borderRadius: 3, 
            bgcolor: 'rgba(3, 218, 198, 0.05)', 
            border: '1px solid rgba(3, 218, 198, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(3, 218, 198, 0.1)', color: 'secondary.main' }}>
                <LocalOfferRounded fontSize="small" />
              </Avatar>
              <Typography variant="caption" color="secondary.main" fontWeight={700}>Sell Orders</Typography>
            </Box>
            <Typography variant="h3" fontWeight={800} color="secondary.main">{sellCount}</Typography>
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
                <ErrorOutlineRounded fontSize="small" />
              </Avatar>
              <Typography variant="caption" color="error.main" fontWeight={700}>Errors</Typography>
            </Box>
            <Typography variant="h3" fontWeight={800} color="error.main">{errorCount}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3, bgcolor: 'background.paper', backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.05)' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(124, 77, 255, 0.1)', color: 'primary.main' }}>
            <CodeRounded fontSize="small" />
          </Avatar>
          <Typography variant="h6" fontWeight={700}>Bot Logs</Typography>
        </Box>
        <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Search logs..."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ 
                flex: 1, 
                minWidth: 200,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.03)',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded fontSize="small" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {[
                { id: 'all', label: 'All', icon: CodeRounded },
                { id: 'buy', label: 'Buy', icon: ShoppingCartRounded },
                { id: 'sell', label: 'Sell', icon: LocalOfferRounded },
                { id: 'error', label: 'Error', icon: ErrorOutlineRounded },
                { id: 'scan', label: 'Scan', icon: TravelExploreRounded },
              ].map(type => (
                <Chip
                  key={type.id}
                  label={type.label}
                  icon={<type.icon fontSize="small" />}
                  onClick={() => setFilterType(type.id)}
                  color={filterType === type.id ? 'primary' : 'default'}
                  variant={filterType === type.id ? 'filled' : 'outlined'}
                  sx={{ 
                    borderRadius: 1.5, 
                    fontWeight: 600,
                    bgcolor: filterType === type.id ? 'primary.main' : 'transparent',
                    borderColor: filterType === type.id ? 'primary.main' : 'rgba(255,255,255,0.1)',
                    '&:hover': { bgcolor: filterType === type.id ? 'primary.dark' : 'rgba(255,255,255,0.05)' }
                  }}
                />
              ))}
            </Stack>
          </Box>

          <Paper 
            ref={containerRef}
            sx={{ 
              p: 2, 
              borderRadius: 2, 
              bgcolor: 'rgba(0,0,0,0.2)', 
              maxHeight: 500, 
              overflow: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              border: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            <List sx={{ py: 0 }}>
              {filteredLogs.map((log, i) => (
                <ListItem key={i} sx={{ py: 0.25, px: 0, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Typography variant="caption" sx={{ color: 'text.disabled', minWidth: 70, pt: 0.25 }}>
                    {log.timestamp}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: log.message.toLowerCase().includes('error') ? 'error.main' : 
                           log.message.toLowerCase().includes('buy') ? 'success.main' :
                           log.message.toLowerCase().includes('sell') ? 'info.main' : 'text.secondary',
                    wordBreak: 'break-word'
                  }}>
                    {log.message}
                  </Typography>
                </ListItem>
              ))}
              {filteredLogs.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <SearchRounded sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.disabled">No logs match criteria</Typography>
                </Box>
              )}
            </List>
          </Paper>
        </CardContent>
      </Card>
    </Box>
  )
}
