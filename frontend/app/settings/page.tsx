'use client'

import { useTrading } from '@/hooks/useTrading'
import { Download, Upload, RotateCcw, AlertCircle, Save, Settings, Shield, DollarSign, TrendingUp, Zap, BarChart3, Activity, Percent, Trash2 } from 'lucide-react'
import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Box, Grid, Typography, Card, CardContent, 
  Button, Chip, Avatar, Paper, useTheme, TextField, CircularProgress,
  Select, MenuItem, FormControl, InputLabel, Checkbox, 
  FormControlLabel, Dialog, DialogTitle, DialogContent, 
  DialogActions, Snackbar, Alert, IconButton, Tooltip,
  Divider, Stack
} from '@mui/material'

export default function SettingsPage() {
  const router = useRouter()
  const {
    botStatus,
    settings,
    settingsHistory,
    settingsComment,
    setSettingsComment,
    saveSettings,
    resetSettings,
    resetPortfolio,
  } = useTrading()

  const [settingsLoading, setSettingsLoading] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showResetSettingsDialog, setShowResetSettingsDialog] = useState(false)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' | 'warning' })
  const [localSettings, setLocalSettings] = useState(settings)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const theme = useTheme()

  // Track if settings have been modified (dirty state)
  const isDirty = useMemo(() => {
    return JSON.stringify(localSettings) !== JSON.stringify(settings)
  }, [localSettings, settings])

  // Sync local settings when global settings change (e.g., after load)
  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // Intercept navigation attempts
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      if (link && isDirty) {
        const href = link.getAttribute('href')
        if (href && href.startsWith('/') && href !== '/settings') {
          e.preventDefault()
          e.stopPropagation()
          setPendingNavigation(href)
          setShowUnsavedDialog(true)
        }
      }
    }
    
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [isDirty])

  const handleSettingChange = (key: keyof typeof settings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSettingsLoading(true)
    try {
      await saveSettings(localSettings)
      setSnackbar({ open: true, message: 'Settings saved successfully!', severity: 'success' })
    } catch (error) {
      setSnackbar({ open: true, message: 'Error saving settings', severity: 'error' })
    } finally {
      setSettingsLoading(false)
    }
  }

  const handleDiscardAndNavigate = () => {
    setLocalSettings(settings)
    setShowUnsavedDialog(false)
    if (pendingNavigation) {
      router.push(pendingNavigation)
      setPendingNavigation(null)
    }
  }

  const handleSaveAndNavigate = async () => {
    await handleSave()
    setShowUnsavedDialog(false)
    if (pendingNavigation) {
      router.push(pendingNavigation)
      setPendingNavigation(null)
    }
  }

  const handleExport = () => {
    const payload = {
      settings: localSettings,
      comment: settingsComment,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `trader-settings-${new Date().toISOString().slice(0, 16).replace(/:/g, '-')}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const imported = JSON.parse(text)
      const importedSettings = imported.settings || imported
      const validKeys = Object.keys(localSettings)
      const filtered: any = {}
      for (const key of validKeys) {
        if (key in importedSettings) filtered[key] = importedSettings[key]
      }
      setLocalSettings(filtered)
      setSettingsComment(imported.comment || '')
      setSnackbar({ open: true, message: 'Settings imported! Click save to apply.', severity: 'info' })
    } catch (error) {
      setSnackbar({ open: true, message: 'Error importing settings', severity: 'error' })
    }
  }

  return (
    <Box sx={{ p: { xs: 1, md: 2 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header with Actions */}
      <Paper sx={{ 
        p: 2, 
        borderRadius: 3, 
        bgcolor: 'background.paper', 
        backgroundImage: 'none', 
        border: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        gap: 2,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backdropFilter: 'blur(10px)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'rgba(124, 77, 255, 0.1)', color: 'primary.main' }}>
            <Settings size={20} />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700}>Bot Settings</Typography>
            {isDirty && (
              <Chip 
                label="Unsaved Changes" 
                size="small" 
                color="warning" 
                icon={<AlertCircle size={12} />}
                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
              />
            )}
          </Box>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={<Upload size={16} />}
            onClick={() => fileInputRef.current?.click()}
            sx={{ borderRadius: 2 }}
          >
            Import
          </Button>
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={<Download size={16} />}
            onClick={handleExport}
            sx={{ borderRadius: 2 }}
          >
            Export
          </Button>
          <Button 
            variant="contained" 
            size="small" 
            startIcon={settingsLoading ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
            onClick={handleSave}
            disabled={( !isDirty && !settingsLoading ) || settingsLoading}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            {settingsLoading ? 'Saving...' : (botStatus.running ? 'Apply \u0026 Restart' : 'Save Settings')}
          </Button>
        </Stack>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} hidden />
      </Paper>

      <Grid container spacing={3}>
        {/* Exchange Settings */}
        <Grid item xs={12} md={6} lg={4}>
          <Card sx={{ height: '100%', borderRadius: 3, bgcolor: 'background.paper', backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(3, 218, 198, 0.1)', color: 'secondary.main' }}>
                <Shield size={16} />
              </Avatar>
              <Typography variant="subtitle1" fontWeight={700}>Exchange</Typography>
            </Box>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Select Exchange</InputLabel>
                <Select
                  value={localSettings.EXCHANGE || 'COINBASE'}
                  label="Select Exchange"
                  onChange={(e) => handleSettingChange('EXCHANGE', e.target.value)}
                >
                  <MenuItem value="COINBASE">Coinbase</MenuItem>
                  <MenuItem value="KRAKEN">Kraken</MenuItem>
                </Select>
              </FormControl>
              
              {localSettings.EXCHANGE === 'KRAKEN' && (
                <>
                  <TextField
                    fullWidth
                    size="small"
                    label="API Key"
                    type="password"
                    value={localSettings.KRAKEN_API_KEY || ''}
                    onChange={(e) => handleSettingChange('KRAKEN_API_KEY', e.target.value)}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="API Secret"
                    type="password"
                    value={localSettings.KRAKEN_API_SECRET || ''}
                    onChange={(e) => handleSettingChange('KRAKEN_API_SECRET', e.target.value)}
                  />
                </>
              )}

              <FormControlLabel
                control={
                  <Checkbox 
                    checked={localSettings.PAPER_TRADING} 
                    onChange={(e) => handleSettingChange('PAPER_TRADING', e.target.checked)}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>Paper Trading</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {localSettings.PAPER_TRADING ? 'Simulated trades (Safe)' : 'Real trades (Live)'}
                    </Typography>
                  </Box>
                }
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Position Sizing */}
        <Grid item xs={12} md={6} lg={4}>
          <Card sx={{ height: '100%', borderRadius: 3, bgcolor: 'background.paper', backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(34, 197, 94, 0.1)', color: 'success.main' }}>
                <DollarSign size={16} />
              </Avatar>
              <Typography variant="subtitle1" fontWeight={700}>Position Sizing</Typography>
            </Box>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                fullWidth
                size="small"
                label="Max Price ($)"
                type="number"
                value={localSettings.MAX_PRICE}
                onChange={(e) => handleSettingChange('MAX_PRICE', parseFloat(e.target.value) || 0)}
                helperText="Trade under this price"
              />
              <TextField
                fullWidth
                size="small"
                label="Position Size ($)"
                type="number"
                value={localSettings.POSITION_SIZE}
                onChange={(e) => handleSettingChange('POSITION_SIZE', parseInt(e.target.value) || 0)}
                helperText="USD per trade"
              />
              <TextField
                fullWidth
                size="small"
                label="Max Positions"
                type="number"
                value={localSettings.MAX_POSITIONS}
                onChange={(e) => handleSettingChange('MAX_POSITIONS', parseInt(e.target.value) || 0)}
                helperText="Max concurrent trades"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Profit & Stops */}
        <Grid item xs={12} md={6} lg={4}>
          <Card sx={{ height: '100%', borderRadius: 3, bgcolor: 'background.paper', backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(239, 68, 68, 0.1)', color: 'error.main' }}>
                <TrendingUp size={16} />
              </Avatar>
              <Typography variant="subtitle1" fontWeight={700}>Profit & Stops</Typography>
            </Box>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                fullWidth
                size="small"
                label="Profit Target (%)"
                type="number"
                value={localSettings.PROFIT_TARGET}
                onChange={(e) => handleSettingChange('PROFIT_TARGET', parseFloat(e.target.value) || 0)}
                helperText="Sell at this profit %"
              />
              <TextField
                fullWidth
                size="small"
                label="Stop Loss (%)"
                type="number"
                value={localSettings.STOP_LOSS}
                onChange={(e) => handleSettingChange('STOP_LOSS', parseFloat(e.target.value) || 0)}
                helperText="Cut losses at this %"
              />
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={localSettings.ENABLE_TRAILING_PROFIT} 
                    onChange={(e) => handleSettingChange('ENABLE_TRAILING_PROFIT', e.target.checked)}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>Trailing Profit</Typography>
                    <Typography variant="caption" color="text.secondary">Ride the momentum</Typography>
                  </Box>
                }
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Momentum & Timing */}
        <Grid item xs={12} md={6} lg={4}>
          <Card sx={{ height: '100%', borderRadius: 3, bgcolor: 'background.paper', backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(245, 158, 11, 0.1)', color: 'warning.main' }}>
                <Zap size={16} />
              </Avatar>
              <Typography variant="subtitle1" fontWeight={700}>Momentum & Timing</Typography>
            </Box>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                fullWidth
                size="small"
                label="Momentum Threshold (%)"
                type="number"
                value={localSettings.MOMENTUM_THRESHOLD}
                onChange={(e) => handleSettingChange('MOMENTUM_THRESHOLD', parseFloat(e.target.value) || 0)}
                helperText="Min price change to trigger"
              />
              <TextField
                fullWidth
                size="small"
                label="Momentum Window (min)"
                type="number"
                value={localSettings.MOMENTUM_WINDOW}
                onChange={(e) => handleSettingChange('MOMENTUM_WINDOW', parseInt(e.target.value) || 0)}
                helperText="Timeframe for momentum"
              />
              <TextField
                fullWidth
                size="small"
                label="Scan Interval (sec)"
                type="number"
                value={localSettings.SCAN_INTERVAL}
                onChange={(e) => handleSettingChange('SCAN_INTERVAL', parseInt(e.target.value) || 0)}
                helperText="How often to scan markets"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Volume & Filters */}
        <Grid item xs={12} md={6} lg={4}>
          <Card sx={{ height: '100%', borderRadius: 3, bgcolor: 'background.paper', backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(124, 77, 255, 0.1)', color: 'primary.main' }}>
                <BarChart3 size={16} />
              </Avatar>
              <Typography variant="subtitle1" fontWeight={700}>Volume & Filters</Typography>
            </Box>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                fullWidth
                size="small"
                label="Min 24h Volume ($)"
                type="number"
                value={localSettings.MIN_VOLUME}
                onChange={(e) => handleSettingChange('MIN_VOLUME', parseInt(e.target.value) || 0)}
              />
              <Divider />
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={localSettings.VOLUME_SURGE_FILTER} 
                    onChange={(e) => handleSettingChange('VOLUME_SURGE_FILTER', e.target.checked)}
                  />
                }
                label="Volume Surge Filter"
              />
              <TextField
                fullWidth
                size="small"
                label="Surge Threshold (%)"
                type="number"
                value={localSettings.VOLUME_SURGE_THRESHOLD}
                onChange={(e) => handleSettingChange('VOLUME_SURGE_THRESHOLD', parseInt(e.target.value) || 0)}
                disabled={!localSettings.VOLUME_SURGE_FILTER}
                helperText="% above average volume"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* RSI & Trailing */}
        <Grid item xs={12} md={6} lg={4}>
          <Card sx={{ height: '100%', borderRadius: 3, bgcolor: 'background.paper', backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(3, 218, 198, 0.1)', color: 'secondary.main' }}>
                <Activity size={16} />
              </Avatar>
              <Typography variant="subtitle1" fontWeight={700}>RSI & Trailing</Typography>
            </Box>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={localSettings.RSI_FILTER} 
                    onChange={(e) => handleSettingChange('RSI_FILTER', e.target.checked)}
                  />
                }
                label="RSI Filter"
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="RSI Min"
                  type="number"
                  value={localSettings.RSI_MIN}
                  onChange={(e) => handleSettingChange('RSI_MIN', parseInt(e.target.value) || 0)}
                  disabled={!localSettings.RSI_FILTER}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="RSI Max"
                  type="number"
                  value={localSettings.RSI_MAX}
                  onChange={(e) => handleSettingChange('RSI_MAX', parseInt(e.target.value) || 0)}
                  disabled={!localSettings.RSI_FILTER}
                />
              </Stack>
              <Divider />
              <TextField
                fullWidth
                size="small"
                label="Trailing Stop (%)"
                type="number"
                value={localSettings.TRAILING_STOP_PERCENT}
                onChange={(e) => handleSettingChange('TRAILING_STOP_PERCENT', parseFloat(e.target.value) || 0)}
                disabled={!localSettings.ENABLE_TRAILING_PROFIT}
                helperText="Distance from peak"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Fees & Taxes */}
        <Grid item xs={12} md={6} lg={4}>
          <Card sx={{ height: '100%', borderRadius: 3, bgcolor: 'background.paper', backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(124, 77, 255, 0.1)', color: 'primary.main' }}>
                <Percent size={16} />
              </Avatar>
              <Typography variant="subtitle1" fontWeight={700}>Fees & Taxes</Typography>
            </Box>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                fullWidth
                size="small"
                label="Maker Fee (%)"
                type="number"
                value={localSettings.MAKER_FEE_PERCENT}
                onChange={(e) => handleSettingChange('MAKER_FEE_PERCENT', parseFloat(e.target.value) || 0)}
              />
              <TextField
                fullWidth
                size="small"
                label="Taker Fee (%)"
                type="number"
                value={localSettings.TAKER_FEE_PERCENT}
                onChange={(e) => handleSettingChange('TAKER_FEE_PERCENT', parseFloat(e.target.value) || 0)}
              />
              <TextField
                fullWidth
                size="small"
                label="Tax Rate (%)"
                type="number"
                value={localSettings.TAX_PERCENT}
                onChange={(e) => handleSettingChange('TAX_PERCENT', parseFloat(e.target.value) || 0)}
                helperText="Applied to net profits"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Comments & History */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '100%', borderRadius: 3, bgcolor: 'background.paper', backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(3, 218, 198, 0.1)', color: 'secondary.main' }}>
                <Activity size={16} />
              </Avatar>
              <Typography variant="subtitle1" fontWeight={700}>Comments & History</Typography>
            </Box>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Configuration Comment"
                placeholder="Describe this setup (e.g., 'Aggressive scalping for BTC')"
                value={settingsComment}
                onChange={(e) => setSettingsComment(e.target.value)}
              />
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mb: 1, display: 'block' }}>
                  RECENT SAVES
                </Typography>
                <Stack spacing={1}>
                  {settingsHistory.slice(0, 5).map((entry, i) => (
                    <Paper key={i} sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" fontWeight={700} color="primary.main">
                          {new Date(entry.savedAt).toLocaleString()}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {entry.comment || 'No comment provided'}
                      </Typography>
                    </Paper>
                  ))}
                  {settingsHistory.length === 0 && (
                    <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                      No history yet
                    </Typography>
                  )}
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Danger Zone */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3, bgcolor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(239, 68, 68, 0.1)', color: 'error.main' }}>
                <Trash2 size={16} />
              </Avatar>
              <Typography variant="subtitle1" fontWeight={700} color="error.main">Danger Zone</Typography>
            </Box>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" fontWeight={600} gutterBottom>Reset Portfolio</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    Clears all trade history and resets balance to $10,000. This cannot be undone.
                  </Typography>
                  <Button 
                    variant="outlined" 
                    color="error" 
                    startIcon={<RotateCcw size={16} />}
                    onClick={() => setShowResetDialog(true)}
                    sx={{ borderRadius: 2 }}
                  >
                    Reset Portfolio
                  </Button>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" fontWeight={600} gutterBottom>Reset Settings</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    Reverts all configuration to safe default values. Current settings will be lost.
                  </Typography>
                  <Button 
                    variant="outlined" 
                    color="error" 
                    startIcon={<RotateCcw size={16} />}
                    onClick={() => setShowResetSettingsDialog(true)}
                    sx={{ borderRadius: 2 }}
                  >
                    Reset Settings
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialogs */}
      <Dialog open={showResetDialog} onClose={() => setShowResetDialog(false)} PaperProps={{ sx: { borderRadius: 3, bgcolor: 'background.paper', backgroundImage: 'none' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Reset Portfolio?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will clear all positions and trade history. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setShowResetDialog(false)} color="inherit">Cancel</Button>
          <Button variant="contained" color="error" onClick={async () => {
            await resetPortfolio()
            setShowResetDialog(false)
            setSnackbar({ open: true, message: 'Portfolio reset successfully', severity: 'success' })
          }}>Reset Everything</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showResetSettingsDialog} onClose={() => setShowResetSettingsDialog(false)} PaperProps={{ sx: { borderRadius: 3, bgcolor: 'background.paper', backgroundImage: 'none' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Reset Settings?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will revert all settings to their default safe values. Your current configuration will be lost.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setShowResetSettingsDialog(false)} color="inherit">Cancel</Button>
          <Button variant="contained" color="error" onClick={async () => {
            await resetSettings()
            setShowResetSettingsDialog(false)
            setSnackbar({ open: true, message: 'Settings reset to defaults', severity: 'info' })
          }}>Reset to Defaults</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showUnsavedDialog} onClose={() => setShowUnsavedDialog(false)} PaperProps={{ sx: { borderRadius: 3, bgcolor: 'background.paper', backgroundImage: 'none' } }}>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AlertCircle color={theme.palette.warning.main} />
          Unsaved Changes
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            You have unsaved changes. What would you like to do?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => { setShowUnsavedDialog(false); setPendingNavigation(null); }} color="inherit">Stay</Button>
          <Button variant="outlined" color="error" onClick={handleDiscardAndNavigate}>Discard</Button>
          <Button variant="contained" color="primary" onClick={handleSaveAndNavigate}>Save & Continue</Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2, fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
