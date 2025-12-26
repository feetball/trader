'use client'

import { useTrading } from '@/hooks/useTrading'
import { AlertCircle, X, Check } from 'lucide-react'
import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

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

  return (
    <Dialog open onClose={() => { updatePrompt.visible = false }} maxWidth="md" fullWidth>
      <DialogTitle>
        <div className="flex items-center gap-3">
          {isComplete ? (
            <Check className="text-success-500" size={20} />
          ) : (
            <AlertCircle className={`text-${isAvailable ? 'info' : 'warning'}-500`} size={20} />
          )}
          <span>{isAvailable ? 'Update Available' : isReady ? 'Update Ready' : isApplying ? 'Applying Update' : 'Update Complete'}</span>
        </div>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body1" gutterBottom>
          {isAvailable && `Version ${updatePrompt.newVersion || 'unknown'} is available.`}
          {isReady && `Version ${updatePrompt.newVersion || 'unknown'} has been prepared.`}
          {isApplying && 'Applying update...'}
          {isComplete && `Version ${updatePrompt.newVersion || 'unknown'} has been applied!`}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {isAvailable && 'Click Apply to download and prepare the update.'}
          {isReady && 'Click Restart to restart the server and apply the update now, or Cancel to postpone.'}
          {isApplying && 'Please wait while the update is being applied...'}
          {isComplete && 'The update has been successfully applied. Click OK to continue.'}
        </Typography>

        {updateLogs.length > 0 && (
          <Box mt={2}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-300">Update Log</h3>
              <button onClick={() => setShowLogs(!showLogs)} className="text-xs px-2 py-1 text-gray-400 hover:text-gray-300 border border-gray-600 rounded">{showLogs ? 'Hide' : 'Show'}</button>
            </div>
            {showLogs && (
              <Box sx={{ bgcolor: '#0f1724', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 1, p: 1, maxHeight: 240, overflow: 'auto' }}>
                <div className="font-mono text-xs text-gray-300 space-y-1">
                  {updateLogs.map((log, i) => (
                    <div key={i} className="text-gray-400">{log}</div>
                  ))}
                </div>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {isComplete ? (
          <Button variant="contained" color="success" onClick={() => window.location.reload()}>OK</Button>
        ) : (
          <>
            <Button onClick={() => { updatePrompt.visible = false }} disabled={isApplying || confirming}>Cancel</Button>
            {isAvailable && <Button variant="contained" color="primary" onClick={handleApply} disabled={confirming}>{confirming ? 'Applying...' : 'Apply'}</Button>}
            {isReady && <Button variant="contained" color="primary" onClick={handleConfirm} disabled={confirming}>{confirming ? 'Restarting...' : 'Restart'}</Button>}
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}
