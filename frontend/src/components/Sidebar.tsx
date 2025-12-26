'use client'

import { useTrading } from '@/hooks/useTrading'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  BarChart3, Cpu, Trophy, History, Bell, Terminal, HelpCircle, Settings, 
  Menu, X, Zap, RefreshCw, Activity, AlertTriangle, CheckCircle, XCircle 
} from 'lucide-react'
import { useState } from 'react'
import { 
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, 
  Box, Typography, Divider, IconButton, useMediaQuery, useTheme, 
  Chip, Tooltip, Button, Snackbar, Alert, CircularProgress
} from '@mui/material'

const navLinks = [
  { href: '/', icon: BarChart3, label: 'Overview', tooltip: 'Main dashboard overview' },
  { href: '/bot-status', icon: Cpu, label: 'Bot Status', tooltip: 'Control and monitor the trading bot' },
  { href: '/performance', icon: Trophy, label: 'Performance', tooltip: 'View trading performance analytics' },
  { href: '/trades', icon: History, label: 'Trade History', tooltip: 'Browse complete trade history' },
  { href: '/activity', icon: Bell, label: 'Activity', tooltip: 'See recent trading activity' },
  { href: '/logs', icon: Terminal, label: 'Logs', tooltip: 'View detailed bot logs' },
  { href: '/settings', icon: Settings, label: 'Settings', tooltip: 'Configure trading parameters' },
  { href: '/help', icon: HelpCircle, label: 'Help', tooltip: 'Get help and documentation' },
]

const DRAWER_WIDTH = 280

export default function Sidebar() {
  const pathname = usePathname()
  const { botStatus, exchangeApiStatus, settings } = useTrading()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [checking, setChecking] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; type: 'info' | 'success' | 'error'; message: string }>({
    open: false,
    type: 'info',
    message: ''
  })

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const showSnackbar = (type: 'info' | 'success' | 'error', message: string) => {
    setSnackbar({ open: true, type, message })
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const handleCheckUpdates = async () => {
    setChecking(true)
    try {
      const response = await fetch('/api/updates/check', { method: 'POST' })
      const data = await response.json()
      
      if (data.updateAvailable) {
        showSnackbar('info', `Update available: v${data.newVersion}. Check the update dialog to proceed.`)
      } else {
        showSnackbar('success', 'You are running the latest version!')
      }
    } catch (error) {
      console.error('Failed to check for updates:', error)
      showSnackbar('error', 'Failed to check for updates')
    } finally {
      setChecking(false)
    }
  }

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo Section */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ 
          position: 'relative',
          width: 40,
          height: 40,
          borderRadius: 2,
          bgcolor: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(124, 77, 255, 0.4)'
        }}>
          <Zap size={22} color="white" />
          <Box sx={{ 
            position: 'absolute',
            top: -2,
            right: -2,
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: 'success.main',
            border: '2px solid',
            borderColor: 'background.paper',
            animation: 'pulse 2s infinite'
          }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            Trader
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Dashboard
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ opacity: 0.1 }} />

      {/* Navigation */}
      <List sx={{ flexGrow: 1, px: 2, py: 2 }}>
        {navLinks.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={item.tooltip} placement="right" arrow>
                <ListItemButton
                  component={Link}
                  href={item.href}
                  onClick={() => isMobile && setMobileOpen(false)}
                  selected={isActive}
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    '&.Mui-selected': {
                      bgcolor: 'rgba(124, 77, 255, 0.12)',
                      color: 'primary.main',
                      '&:hover': {
                        bgcolor: 'rgba(124, 77, 255, 0.18)',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'primary.main',
                      }
                    },
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Icon size={20} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label} 
                    primaryTypographyProps={{ 
                      variant: 'body2', 
                      fontWeight: isActive ? 600 : 500 
                    }} 
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          )
        })}
      </List>

      {/* Bottom Section */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <Box sx={{ 
          bgcolor: 'rgba(255,255,255,0.03)', 
          borderRadius: 2, 
          p: 2, 
          mb: 2,
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                bgcolor: botStatus.running ? 'success.main' : 'text.disabled',
                animation: botStatus.running ? 'pulse 2s infinite' : 'none'
              }} />
              <Typography variant="caption" fontWeight={600}>System Status</Typography>
            </Box>
            {botStatus.running && (
              <Chip 
                size="small" 
                icon={<Activity size={12} />} 
                label={`${botStatus.apiRate || 0}/min`}
                variant="outlined"
                sx={{ height: 20, fontSize: '0.65rem', borderColor: 'rgba(255,255,255,0.1)' }}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {settings.EXCHANGE === 'KRAKEN' ? 'Kraken API' : 'Coinbase API'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {exchangeApiStatus === 'ok' && <CheckCircle size={12} className="text-success-500" />}
              {exchangeApiStatus === 'rate-limited' && <AlertTriangle size={12} className="text-warning-500" />}
              {exchangeApiStatus === 'error' && <XCircle size={12} className="text-error-500" />}
              <Typography 
                variant="caption" 
                sx={{ 
                  textTransform: 'capitalize',
                  color: exchangeApiStatus === 'ok' ? 'success.main' : 
                         exchangeApiStatus === 'rate-limited' ? 'warning.main' : 
                         exchangeApiStatus === 'error' ? 'error.main' : 'text.secondary'
                }}
              >
                {exchangeApiStatus === 'ok' ? 'OK' : exchangeApiStatus}
              </Typography>
            </Box>
          </Box>

          {botStatus.running && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">Avg Rate (1h)</Typography>
              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                {botStatus.apiRateHourly || 0}/min
              </Typography>
            </Box>
          )}
        </Box>

        <Button
          fullWidth
          variant="outlined"
          size="small"
          startIcon={checking ? <CircularProgress size={14} color="inherit" /> : <RefreshCw size={14} />}
          onClick={handleCheckUpdates}
          disabled={checking}
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            borderColor: 'rgba(124, 77, 255, 0.3)',
            color: 'primary.light',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'rgba(124, 77, 255, 0.05)'
            }
          }}
        >
          {checking ? 'Checking...' : 'Check Updates'}
        </Button>
      </Box>
    </Box>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <IconButton
          onClick={handleDrawerToggle}
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 1200,
            bgcolor: 'rgba(15, 23, 36, 0.8)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)',
            '&:hover': { bgcolor: 'rgba(15, 23, 36, 0.9)' }
          }}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </IconButton>
      )}

      {/* Desktop Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          // Ensure permanent drawer takes space in the flex layout on desktop.
          width: { md: DRAWER_WIDTH },
          flexShrink: { md: 0 },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            borderRight: '1px solid rgba(255,255,255,0.05)',
            boxShadow: 'none',
            // Prevent overlaying the page when used inside a flex layout.
            // MUI's Drawer paper is positioned for overlay by default.
            position: { md: 'relative' },
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.type === 'info' ? 'info' : snackbar.type === 'success' ? 'success' : 'error'}
          variant="filled"
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <style jsx global>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  )
}
