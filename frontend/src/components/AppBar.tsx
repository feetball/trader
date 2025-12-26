'use client'

import { useTrading } from '@/hooks/useTrading'
import { RefreshCw, Power, Square, Wifi, WifiOff, Clock, Sparkles } from 'lucide-react'
import AppBarMui from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'

export default function AppBar() {
  const { botStatus, botLoading, wsConnected, lastUpdate, appVersion, startBot, stopBot } = useTrading()

  return (
    <AppBarMui position="sticky" color="transparent" elevation={0} sx={{ backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm md:text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent truncate">
                <span className="hidden sm:inline">Big DK's Crypto Momentum Trader</span>
                <span className="sm:hidden">Big DK's</span>
              </h2>
              <Sparkles size={14} className="text-warning-400 animate-pulse flex-shrink-0" />
            </div>
            <p className="text-xs text-gray-500 font-mono">v{appVersion}</p>
          </div>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.5, borderRadius: 2, bgcolor: wsConnected ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)' }} title={wsConnected ? 'WebSocket connection to server is active' : 'WebSocket connection to server is lost'}>
              {wsConnected ? (
                <Wifi size={12} className="animate-pulse" />
              ) : (
                <WifiOff size={12} />
              )}
              <span className="text-xs font-medium hidden md:inline">{wsConnected ? 'Connected' : 'Disconnected'}</span>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.5, borderRadius: 2, bgcolor: botStatus.running ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)' }} title={botStatus.running ? `Bot is actively trading. ${botStatus.message}` : `Bot is stopped. ${botStatus.message}`}>
              <div className={`relative w-2 h-2 rounded-full ${botStatus.running ? 'bg-success-500' : 'bg-gray-500'}`}></div>
              <span className={`text-xs font-medium hidden md:inline ${botStatus.running ? 'text-success-400' : 'text-gray-400'}`}>{botStatus.running ? 'Running' : 'Stopped'}</span>
            </Box>
          </Box>

          <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 2, color: 'rgba(255,255,255,0.6)' }} title="Last time data was refreshed from the server">
            <Clock size={14} />
            <span className="font-mono text-xs">{lastUpdate || '--:--:--'}</span>
          </Box>

          {!botStatus.running ? (
            <Button variant="contained" color="success" onClick={startBot} disabled={botLoading} startIcon={<Power size={14} />}>
              Start
            </Button>
          ) : (
            <Button variant="contained" color="error" onClick={stopBot} disabled={botLoading} startIcon={<Square size={14} />}>
              Stop
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBarMui>
  )
}
