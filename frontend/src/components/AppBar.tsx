'use client'

import { useTrading } from '@/hooks/useTrading'
import AppBarMui from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import WifiRounded from '@mui/icons-material/WifiRounded'
import WifiOffRounded from '@mui/icons-material/WifiOffRounded'
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded'
import PowerSettingsNewRounded from '@mui/icons-material/PowerSettingsNewRounded'
import StopCircleRounded from '@mui/icons-material/StopCircleRounded'

export default function AppBar() {
  const { botStatus, botLoading, wsConnected, lastUpdate, appVersion, startBot, stopBot } = useTrading()

  return (
    <AppBarMui position="sticky" color="transparent" elevation={0} sx={{ borderBottom: '1px solid var(--md-sys-color-outline)' }}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={700} noWrap>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  {'Big DK\u2019s Crypto Momentum Trader'}
                </Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                  {'Big DK\u2019s'}
                </Box>
              </Typography>
              <AutoAwesomeRounded fontSize="small" sx={{ color: 'warning.main', opacity: 0.9, flexShrink: 0 }} />
            </Box>
            <Typography variant="caption" sx={{ opacity: 0.7, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>
              v{appVersion}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
            <Chip
              size="small"
              variant="outlined"
              icon={wsConnected ? <WifiRounded fontSize="small" /> : <WifiOffRounded fontSize="small" />}
              label={wsConnected ? 'Connected' : 'Disconnected'}
              sx={{ borderColor: 'var(--md-sys-color-outline)', bgcolor: 'transparent' }}
            />

            <Chip
              size="small"
              variant="outlined"
              label={botStatus.running ? 'Running' : 'Stopped'}
              sx={{
                borderColor: 'var(--md-sys-color-outline)',
                bgcolor: 'transparent',
                color: botStatus.running ? 'success.main' : 'text.secondary',
              }}
              title={botStatus.running ? `Bot is actively trading. ${botStatus.message}` : `Bot is stopped. ${botStatus.message}`}
            />
          </Box>

          <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 1, opacity: 0.7 }} title="Last time data was refreshed from the server">
            <AccessTimeRounded fontSize="small" />
            <Typography variant="caption" sx={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>
              {lastUpdate || '--:--:--'}
            </Typography>
          </Box>

          {!botStatus.running ? (
            <Button variant="contained" color="success" onClick={startBot} disabled={botLoading} startIcon={<PowerSettingsNewRounded fontSize="small" />}>
              Start
            </Button>
          ) : (
            <Button variant="contained" color="error" onClick={stopBot} disabled={botLoading} startIcon={<StopCircleRounded fontSize="small" />}>
              Stop
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBarMui>
  )
}
