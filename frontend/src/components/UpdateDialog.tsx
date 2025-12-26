'use client'

import { useTrading } from '@/hooks/useTrading'
import { useState } from 'react'
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, Box, Avatar, IconButton, 
  Paper, Stack, Collapse
} from '@mui/material'
import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import CheckRounded from '@mui/icons-material/CheckRounded'
import TerminalRounded from '@mui/icons-material/TerminalRounded'
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import ExpandLessRounded from '@mui/icons-material/ExpandLessRounded'

export default function UpdateDialog() {
  const { updatePrompt, confirmUpdate, applyUpdate, updateLogs } = useTrading()
  const [confirming, setConfirming] = useState(false)
  const [showLogs, setShowLogs] = useState(true)

  if (!updatePrompt.visible) return null

  const handleApply = async () => {
    setConfirming(true)
    try {
      await applyUpdate()
    } finally {
      setConfirming(false)
    }
  }

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      await confirmUpdate()
    } finally {
      setConfirming(false)
    }
  }

  const isAvailable = updatePrompt.mode === 'available'
  const isReady = updatePrompt.mode === 'ready'
  const isApplying = updatePrompt.mode === 'applying'
  const isComplete = updatePrompt.mode === 'complete'

  const getStatusColor = () => {
    if (isComplete) return 'success'
    if (isAvailable) return 'info'
    return 'warning'
  }

  const statusColor = getStatusColor()

  return (
    <Dialog 
      open 
      onClose={() => { updatePrompt.visible = false }} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          bgcolor: 'background.paper',
          backgroundImage: 'none',
          border: '1px solid rgba(255,255,255,0.05)'
        }
      }}
    >
      <DialogTitle sx={{ p: 3, pb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ 
            bgcolor: `rgba(${statusColor === 'success' ? '34, 197, 94' : statusColor === 'info' ? '124, 77, 255' : '245, 158, 11'}, 0.1)`, 
            color: `${statusColor}.main` 
          }}>
            {isComplete ? <CheckRounded /> : <ErrorOutlineRounded />}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" fontWeight={700}>
              {isAvailable ? 'Update Available' : isReady ? 'Update Ready' : isApplying ? 'Applying Update' : 'Update Complete'}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              VERSION {updatePrompt.newVersion || 'UNKNOWN'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => { updatePrompt.visible = false }} disabled={isApplying || confirming}>
            <CloseRounded fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
          {isAvailable && 'A new version of the trading bot is available. Click Apply to download and prepare the update.'}
          {isReady && 'The update has been prepared and is ready to be installed. Click Restart to apply it now.'}
          {isApplying && 'Please wait while the update is being applied. The server will restart automatically.'}
          {isComplete && 'The update has been successfully applied! The system is now running the latest version.'}
        </Typography>

        {updateLogs.length > 0 && (
          <Box>
            <Button 
              size="small" 
              variant="text" 
              color="inherit"
              onClick={() => setShowLogs(!showLogs)}
              startIcon={<TerminalRounded fontSize="small" />}
              endIcon={showLogs ? <ExpandLessRounded fontSize="small" /> : <ExpandMoreRounded fontSize="small" />}
              sx={{ mb: 1, fontWeight: 700, fontSize: '0.7rem', opacity: 0.7 }}
            >
              {showLogs ? 'HIDE UPDATE LOGS' : 'SHOW UPDATE LOGS'}
            </Button>
            
            <Collapse in={showLogs}>
              <Paper sx={{ 
                bgcolor: 'rgba(0,0,0,0.3)', 
                border: '1px solid rgba(255,255,255,0.05)', 
                borderRadius: 2, 
                p: 2, 
                maxHeight: 200, 
                overflow: 'auto' 
              }}>
                <Stack spacing={0.5}>
                  {updateLogs.map((log, i) => (
                    <Typography key={i} variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', display: 'block' }}>
                      <Box component="span" sx={{ color: 'primary.main', mr: 1 }}>$</Box>
                      {log}
                    </Typography>
                  ))}
                </Stack>
              </Paper>
            </Collapse>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
        {isComplete ? (
          <Button 
            variant="contained" 
            fullWidth 
            onClick={() => window.location.reload()}
            sx={{ borderRadius: 3, py: 1.2, fontWeight: 700 }}
          >
            Reload Dashboard
          </Button>
        ) : (
          <>
            <Button 
              onClick={() => { updatePrompt.visible = false }} 
              disabled={isApplying || confirming}
              sx={{ borderRadius: 3, px: 3 }}
            >
              Cancel
            </Button>
            {isAvailable && (
              <Button 
                variant="contained" 
                onClick={handleApply} 
                disabled={confirming}
                sx={{ borderRadius: 3, px: 4, fontWeight: 700 }}
              >
                {confirming ? 'Applying...' : 'Apply Update'}
              </Button>
            )}
            {isReady && (
              <Button 
                variant="contained" 
                onClick={handleConfirm} 
                disabled={confirming}
                sx={{ borderRadius: 3, px: 4, fontWeight: 700 }}
              >
                {confirming ? 'Restarting...' : 'Restart Now'}
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}
