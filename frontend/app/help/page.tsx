'use client'

import { useTrading } from '@/hooks/useTrading'
import Link from 'next/link'
import { 
  BarChart3, Cpu, Trophy, History, Bell, Terminal, 
  Settings, HelpCircle, Info, Zap, Shield, CheckCircle2,
  ArrowRight, Layers, Server, Globe, Package
} from 'lucide-react'
import { 
  Box, Typography, Grid, Card, CardContent, 
  Avatar, Paper, Stack, Divider, List, ListItem, 
  ListItemIcon, ListItemText, useTheme, Button,
  Chip
} from '@mui/material'

export default function HelpPage() {
  const { appVersion, settings } = useTrading()
  const theme = useTheme()

  const pages = [
    { href: '/', icon: BarChart3, title: 'Overview', desc: 'Portfolio summary, positions, recent trades', color: 'primary.main' },
    { href: '/bot-status', icon: Cpu, title: 'Bot Status', desc: 'Control panel, live status', color: 'secondary.main' },
    { href: '/performance', icon: Trophy, title: 'Performance', desc: 'Profit/loss analytics by coin', color: 'success.main' },
    { href: '/trades', icon: History, title: 'Trade History', desc: 'Complete trade history', color: 'info.main' },
    { href: '/activity', icon: Bell, title: 'Activity', desc: 'Timeline of trading events', color: 'warning.main' },
    { href: '/logs', icon: Terminal, title: 'Logs', desc: 'Full bot output', color: 'error.main' },
    { href: '/settings', icon: Settings, title: 'Settings', desc: 'Configuration controls', color: 'primary.main' },
  ]

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, pb: 12, maxWidth: 1200, mx: 'auto' }}>
      {/* Hero Section */}
      <Box sx={{ textAlign: 'center', mb: 8 }}>
        <Typography variant="h3" fontWeight={800} gutterBottom sx={{ 
          background: 'linear-gradient(45deg, #7C4DFF 30%, #03DAC6 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Trader Expressive
        </Typography>
        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mb: 2 }}>
          <Chip label={`v${appVersion}`} size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(124, 77, 255, 0.1)', color: 'primary.main' }} />
          <Typography variant="h6" color="text.secondary" fontWeight={500}>
            Automated Momentum Trading
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          A high-performance trading bot designed for sub-$1 cryptocurrencies, 
          leveraging real-time market data and advanced technical indicators.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* About & Features */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', borderRadius: 4, bgcolor: 'background.paper', backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(124, 77, 255, 0.1)', color: 'primary.main' }}>
                <Info size={20} />
              </Avatar>
              <Typography variant="h6" fontWeight={700}>About the Bot</Typography>
            </Box>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary" paragraph sx={{ lineHeight: 1.7 }}>
                This trading bot automatically scans the market for low-priced cryptocurrencies showing momentum. 
                It uses technical indicators like RSI and volume surge detection to identify high-quality trade setups.
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph sx={{ lineHeight: 1.7 }}>
                The bot supports paper trading mode for safe testing without real money. 
                When enabled, all trades are simulated using a virtual $10,000 portfolio.
              </Typography>
              
              <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Zap size={16} className="text-warning-400" /> Key Features
              </Typography>
              <List dense disablePadding>
                {[
                  'Real-time market scanning via WebSocket',
                  'RSI filter to avoid overbought coins',
                  'Volume surge detection for confirmation',
                  'Trailing profit to let winners ride',
                  'Configurable stop loss protection',
                  'Paper trading mode for safe testing'
                ].map((text, i) => (
                  <ListItem key={i} sx={{ px: 0, py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckCircle2 size={16} color={theme.palette.success.main} />
                    </ListItemIcon>
                    <ListItemText primary={text} primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Config */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', borderRadius: 4, bgcolor: 'background.paper', backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(3, 218, 198, 0.1)', color: 'secondary.main' }}>
                <Settings size={20} />
              </Avatar>
              <Typography variant="h6" fontWeight={700}>Active Configuration</Typography>
            </Box>
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={2}>
                {[
                  { label: 'Paper Trading', value: settings.PAPER_TRADING ? 'ENABLED' : 'DISABLED', color: settings.PAPER_TRADING ? 'success.main' : 'error.main' },
                  { label: 'Max Price', value: `$${settings.MAX_PRICE}` },
                  { label: 'Profit Target', value: `${settings.PROFIT_TARGET}%` },
                  { label: 'Stop Loss', value: `${settings.STOP_LOSS}%` },
                  { label: 'Position Size', value: `$${settings.POSITION_SIZE}` },
                  { label: 'Max Positions', value: settings.MAX_POSITIONS },
                ].map((item, i) => (
                  <Grid item xs={6} key={i}>
                    <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                        {item.label}
                      </Typography>
                      <Typography variant="h6" fontWeight={800} sx={{ mt: 0.5, color: item.color || 'text.primary' }}>
                        {item.value}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ mt: 4 }}>
                <Button 
                  component={Link} 
                  href="/settings" 
                  variant="outlined" 
                  fullWidth 
                  endIcon={<ArrowRight size={16} />}
                  sx={{ borderRadius: 3, py: 1.5 }}
                >
                  Modify Settings
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Dashboard Navigation */}
        <Grid item xs={12}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 3, px: 1 }}>Dashboard Navigation</Typography>
          <Grid container spacing={2}>
            {pages.map((page) => {
              const Icon = page.icon
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={page.href}>
                  <Card 
                    component={Link}
                    href={page.href}
                    sx={{ 
                      height: '100%', 
                      borderRadius: 4, 
                      textDecoration: 'none',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        bgcolor: 'rgba(255,255,255,0.03)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Avatar sx={{ mb: 2, bgcolor: `rgba(${page.color === 'primary.main' ? '124, 77, 255' : '3, 218, 198'}, 0.1)`, color: page.color }}>
                        <Icon size={20} />
                      </Avatar>
                      <Typography variant="subtitle1" fontWeight={700} gutterBottom>{page.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{page.desc}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        </Grid>

        {/* Architecture */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 4, bgcolor: 'background.paper', backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(124, 77, 255, 0.1)', color: 'primary.main' }}>
                <Layers size={20} />
              </Avatar>
              <Typography variant="h6" fontWeight={700}>System Architecture</Typography>
            </Box>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ 
                p: 4, 
                borderRadius: 4, 
                bgcolor: 'rgba(0,0,0,0.2)', 
                border: '1px solid rgba(124, 77, 255, 0.1)',
                mb: 4
              }}>
                <Grid container spacing={2} alignItems="center" justifyContent="center">
                  <Grid item xs={12} md={3} sx={{ textAlign: 'center' }}>
                    <Typography variant="subtitle2" fontWeight={800} color="primary.main">FRONTEND</Typography>
                    <Typography variant="caption" color="text.secondary">Next.js + MUI v5</Typography>
                  </Grid>
                  <Grid item xs={12} md={1} sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="text.disabled">⟷</Typography>
                  </Grid>
                  <Grid item xs={12} md={3} sx={{ textAlign: 'center' }}>
                    <Typography variant="subtitle2" fontWeight={800} color="secondary.main">BACKEND</Typography>
                    <Typography variant="caption" color="text.secondary">Node.js + Express</Typography>
                  </Grid>
                  <Grid item xs={12} md={1} sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="text.disabled">⟷</Typography>
                  </Grid>
                  <Grid item xs={12} md={3} sx={{ textAlign: 'center' }}>
                    <Typography variant="subtitle2" fontWeight={800} color="success.main">EXCHANGE</Typography>
                    <Typography variant="caption" color="text.secondary">Coinbase / Kraken API</Typography>
                  </Grid>
                </Grid>
              </Box>

              <Grid container spacing={3}>
                {[
                  { label: 'Frontend', title: 'Next.js 14', desc: 'React 18 + MUI v5', icon: Globe, color: 'primary.main' },
                  { label: 'Backend', title: 'Node.js', desc: 'Express + WebSocket', icon: Server, color: 'secondary.main' },
                  { label: 'Trading', title: 'Exchange API', desc: 'Real-time execution', icon: Zap, color: 'warning.main' },
                  { label: 'Deploy', title: 'Docker', desc: 'Containerized', icon: Package, color: 'info.main' },
                ].map((tech, i) => (
                  <Grid item xs={12} sm={6} md={3} key={i}>
                    <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                        <tech.icon size={16} style={{ color: theme.palette.text.secondary }} />
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                          {tech.label}
                        </Typography>
                      </Stack>
                      <Typography variant="subtitle1" fontWeight={800} color={tech.color}>{tech.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{tech.desc}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* How to Use */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 4, bgcolor: 'background.paper', backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(3, 218, 198, 0.1)', color: 'secondary.main' }}>
                <HelpCircle size={20} />
              </Avatar>
              <Typography variant="h6" fontWeight={700}>Getting Started</Typography>
            </Box>
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={4}>
                {[
                  { step: '1', title: 'Start the Bot', desc: 'Navigate to Bot Status and click Start to begin scanning markets.' },
                  { step: '2', title: 'Configure Settings', desc: 'Adjust profit targets, stop loss, and other parameters in Settings.' },
                  { step: '3', title: 'Monitor Activity', desc: 'Watch trades in real-time on the Overview and Activity pages.' },
                  { step: '4', title: 'Review Performance', desc: 'Check Performance and Trade History for detailed analytics.' },
                ].map((item, i) => (
                  <Grid item xs={12} sm={6} md={3} key={i}>
                    <Stack spacing={2}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem', fontWeight: 800, bgcolor: 'primary.main' }}>
                        {item.step}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>{item.title}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{item.desc}</Typography>
                      </Box>
                    </Stack>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Status Bar */}
      <Paper sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        p: 2, 
        bgcolor: 'background.paper', 
        borderTop: '1px solid rgba(255,255,255,0.05)',
        zIndex: 100,
        borderRadius: 0
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1200, mx: 'auto' }}>
          <Stack direction="row" spacing={3} alignItems="center">
            <Typography variant="caption" fontWeight={700} color="text.secondary">
              VERSION v{appVersion}
            </Typography>
            <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto' }} />
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" fontWeight={700} color="text.secondary">PAPER TRADING:</Typography>
              <Chip 
                label={settings.PAPER_TRADING ? 'ON' : 'OFF'} 
                size="small" 
                color={settings.PAPER_TRADING ? 'success' : 'error'} 
                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800 }}
              />
            </Stack>
          </Stack>
          <Typography variant="caption" color="text.disabled" sx={{ display: { xs: 'none', sm: 'block' } }}>
            Built with Next.js + MUI v5 + Material 3 Expressive
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}
