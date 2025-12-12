'use client'

import { useTrading } from '@/hooks/useTrading'
import { Card, CardTitle, CardContent } from '@/components/Card'
import Button from '@/components/Button'
import { Download, Upload, RotateCcw, AlertCircle } from 'lucide-react'
import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()
  const {
    botStatus,
    settings,
    settingsHistory,
    settingsComment,
    setSettingsComment,
    loadSettings,
    saveSettings,
    resetSettings,
    resetPortfolio,
  } = useTrading()

  const [settingsLoading, setSettingsLoading] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showResetSettingsDialog, setShowResetSettingsDialog] = useState(false)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState('')
  const [localSettings, setLocalSettings] = useState(settings)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // Helper to select all content in numeric inputs on focus for easier mobile editing
  const handleNumericInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select()
  }

  const handleSave = async () => {
    setSettingsLoading(true)
    try {
      // Apply local settings to global settings
      Object.assign(settings, localSettings)
      await saveSettings()
      setSnackbar('Settings saved successfully!')
      setTimeout(() => setSnackbar(''), 3000)
    } catch (error) {
      setSnackbar('Error saving settings')
      setTimeout(() => setSnackbar(''), 3000)
    } finally {
      setSettingsLoading(false)
    }
  }

  const handleDiscardAndNavigate = () => {
    setLocalSettings(settings) // Reset to saved settings
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
      setSnackbar('Settings imported! Click save to apply.')
      setTimeout(() => setSnackbar(''), 3000)
    } catch (error) {
      setSnackbar('Error importing settings')
      setTimeout(() => setSnackbar(''), 3000)
    }
  }

  return (
    <div className="p-2 md:p-4 space-y-2 md:space-y-3 pb-20 md:pb-4">
      {/* Sticky header for mobile */}
      <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-sm -mx-2 md:mx-0 px-2 md:px-0 py-2 md:py-0 md:static border-b md:border-b-0 border-gray-800 md:bg-transparent md:backdrop-blur-none">
        <div className="flex flex-col md:flex-row gap-2 md:gap-3 items-start md:items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold">Bot Settings</h1>
            {isDirty && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning-500/20 text-warning-400 text-xs font-medium">
                <AlertCircle size={12} />
                <span>Unsaved</span>
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="small" variant="secondary" onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} /> Import
            </Button>
            <Button size="small" variant="secondary" onClick={handleExport}>
              <Download size={16} /> Export
            </Button>
            <Button size="small" variant={isDirty ? 'primary' : 'secondary'} loading={settingsLoading} onClick={handleSave} disabled={!isDirty && !settingsLoading}>
              {botStatus.running ? 'Apply & Restart' : 'Save'}
            </Button>
          </div>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} hidden />
        </div>
      </div>

      {/* Settings Groups - Multi-column layout optimized for 2K */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 md:gap-3">
        {/* Trading Mode */}
        <Card variant="glass">
          <CardTitle>Trading Mode</CardTitle>
          <CardContent>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Paper Trading</label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localSettings.PAPER_TRADING}
                  onChange={(e) => handleSettingChange('PAPER_TRADING', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-xs text-gray-300">
                  {localSettings.PAPER_TRADING ? 'Simulated trades' : 'Real trades'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Position Sizing */}
        <Card variant="glass">
          <CardTitle>Position Sizing</CardTitle>
          <CardContent>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-400 block mb-0.5">Max Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={localSettings.MAX_PRICE}
                  onChange={(e) => handleSettingChange('MAX_PRICE', parseFloat(e.target.value) || 0)}
                  onFocus={handleNumericInputFocus}
                  className="w-full bg-surface px-2 py-1 rounded border border-gray-700 text-xs"
                />
                <p className="text-xs text-gray-500 mt-0.5">Trade under this price</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-0.5">Position Size ($)</label>
                <input
                  type="number"
                  value={localSettings.POSITION_SIZE}
                  onChange={(e) => handleSettingChange('POSITION_SIZE', parseInt(e.target.value) || 0)}
                  onFocus={handleNumericInputFocus}
                  className="w-full bg-surface px-2 py-1 rounded border border-gray-700 text-xs"
                />
                <p className="text-xs text-gray-500 mt-0.5">USD per trade</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-0.5">Max Positions</label>
                <input
                  type="number"
                  value={localSettings.MAX_POSITIONS}
                  onChange={(e) => handleSettingChange('MAX_POSITIONS', parseInt(e.target.value) || 0)}
                  onFocus={handleNumericInputFocus}
                  className="w-full bg-surface px-2 py-1 rounded border border-gray-700 text-xs"
                />
                <p className="text-xs text-gray-500 mt-0.5">Max concurrent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profit Targets */}
        <Card variant="glass">
          <CardTitle>Profit & Stops</CardTitle>
          <CardContent>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-400 block mb-0.5">Profit Target (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={localSettings.PROFIT_TARGET}
                  onChange={(e) => handleSettingChange('PROFIT_TARGET', parseFloat(e.target.value) || 0)}
                  onFocus={handleNumericInputFocus}
                  className="w-full bg-surface px-2 py-1 rounded border border-gray-700 text-xs"
                />
                <p className="text-xs text-gray-500 mt-0.5">Sell at %</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-0.5">Stop Loss (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={localSettings.STOP_LOSS}
                  onChange={(e) => handleSettingChange('STOP_LOSS', parseFloat(e.target.value) || 0)}
                  onFocus={handleNumericInputFocus}
                  className="w-full bg-surface px-2 py-1 rounded border border-gray-700 text-xs"
                />
                <p className="text-xs text-gray-500 mt-0.5">Cut losses</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-0.5">Trailing Profit</label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={localSettings.ENABLE_TRAILING_PROFIT}
                    onChange={(e) => handleSettingChange('ENABLE_TRAILING_PROFIT', e.target.checked)}
                    className="w-3 h-3"
                  />
                  <span className="text-xs text-gray-300">On</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Momentum & Timing */}
        <Card variant="glass">
          <CardTitle>Momentum & Timing</CardTitle>
          <CardContent>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-400 block mb-0.5">Momentum Threshold (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={localSettings.MOMENTUM_THRESHOLD}
                  onChange={(e) => handleSettingChange('MOMENTUM_THRESHOLD', parseFloat(e.target.value) || 0)}
                  onFocus={handleNumericInputFocus}
                  className="w-full bg-surface px-2 py-1 rounded border border-gray-700 text-xs"
                />
                <p className="text-xs text-gray-500 mt-0.5">Min change</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-0.5">Momentum Window</label>
                <input
                  type="number"
                  value={localSettings.MOMENTUM_WINDOW}
                  onChange={(e) => handleSettingChange('MOMENTUM_WINDOW', parseInt(e.target.value) || 0)}
                  onFocus={handleNumericInputFocus}
                  className="w-full bg-surface px-2 py-1 rounded border border-gray-700 text-xs"
                />
                <p className="text-xs text-gray-500 mt-0.5">Minutes</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-0.5">Scan Interval</label>
                <input
                  type="number"
                  value={localSettings.SCAN_INTERVAL}
                  onChange={(e) => handleSettingChange('SCAN_INTERVAL', parseInt(e.target.value) || 0)}
                  onFocus={handleNumericInputFocus}
                  className="w-full bg-surface px-2 py-1 rounded border border-gray-700 text-xs"
                />
                <p className="text-xs text-gray-500 mt-0.5">Seconds</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Volume & Filters */}
        <Card variant="glass">
          <CardTitle>Volume & Filters</CardTitle>
          <CardContent>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-400 block mb-0.5">Min Volume ($)</label>
                <input
                  type="number"
                  value={localSettings.MIN_VOLUME}
                  onChange={(e) => handleSettingChange('MIN_VOLUME', parseInt(e.target.value) || 0)}
                  onFocus={handleNumericInputFocus}
                  className="w-full bg-surface px-2 py-1 rounded border border-gray-700 text-xs"
                />
                <p className="text-xs text-gray-500 mt-0.5">24h vol</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-0.5">Volume Surge</label>
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="checkbox"
                    checked={localSettings.VOLUME_SURGE_FILTER}
                    onChange={(e) => handleSettingChange('VOLUME_SURGE_FILTER', e.target.checked)}
                    className="w-3 h-3"
                  />
                  <span className="text-xs text-gray-300">{localSettings.VOLUME_SURGE_FILTER ? 'On' : 'Off'}</span>
                </div>
                <label className="text-xs text-gray-400 block mb-0.5">Threshold (%)</label>
                <input
                  type="number"
                  value={localSettings.VOLUME_SURGE_THRESHOLD}
                  onChange={(e) => handleSettingChange('VOLUME_SURGE_THRESHOLD', parseInt(e.target.value) || 0)}
                  onFocus={handleNumericInputFocus}
                  className="w-full bg-surface px-2 py-1 rounded border border-gray-700 text-xs"
                  disabled={!localSettings.VOLUME_SURGE_FILTER}
                />
                <p className="text-xs text-gray-500 mt-0.5">% of avg</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RSI Filter */}
        <Card variant="glass">
          <CardTitle>RSI Filter</CardTitle>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={localSettings.RSI_FILTER}
                  onChange={(e) => handleSettingChange('RSI_FILTER', e.target.checked)}
                  className="w-3 h-3"
                />
                <span className="text-xs font-medium text-gray-300">{localSettings.RSI_FILTER ? 'On' : 'Off'}</span>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-0.5">RSI Min</label>
                <input
                  type="number"
                  value={localSettings.RSI_MIN}
                  onChange={(e) => handleSettingChange('RSI_MIN', parseInt(e.target.value) || 0)}
                  onFocus={handleNumericInputFocus}
                  className="w-full bg-surface px-2 py-1 rounded border border-gray-700 text-xs"
                  disabled={!localSettings.RSI_FILTER}
                />
                <p className="text-xs text-gray-500 mt-0.5">Min</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-0.5">RSI Max</label>
                <input
                  type="number"
                  value={localSettings.RSI_MAX}
                  onChange={(e) => handleSettingChange('RSI_MAX', parseInt(e.target.value) || 0)}
                  onFocus={handleNumericInputFocus}
                  className="w-full bg-surface px-2 py-1 rounded border border-gray-700 text-xs"
                  disabled={!localSettings.RSI_FILTER}
                />
                <p className="text-xs text-gray-500 mt-0.5">Max</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trailing Stop */}
        <Card variant="glass">
          <CardTitle>Trailing Stop</CardTitle>
          <CardContent>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-400 block mb-0.5">Trailing Stop (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={localSettings.TRAILING_STOP_PERCENT}
                  onChange={(e) => handleSettingChange('TRAILING_STOP_PERCENT', parseFloat(e.target.value) || 0)}
                  onFocus={handleNumericInputFocus}
                  className="w-full bg-surface px-2 py-1 rounded border border-gray-700 text-xs"
                  disabled={!localSettings.ENABLE_TRAILING_PROFIT}
                />
                <p className="text-xs text-gray-500 mt-0.5">Distance %</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-0.5">Min Momentum (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={localSettings.MIN_MOMENTUM_TO_RIDE}
                  onChange={(e) => handleSettingChange('MIN_MOMENTUM_TO_RIDE', parseFloat(e.target.value) || 0)}
                  onFocus={handleNumericInputFocus}
                  className="w-full bg-surface px-2 py-1 rounded border border-gray-700 text-xs"
                  disabled={!localSettings.ENABLE_TRAILING_PROFIT}
                />
                <p className="text-xs text-gray-500 mt-0.5">Min thresh</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-0.5">Pos Check (sec)</label>
                <input
                  type="number"
                  value={localSettings.OPEN_POSITION_SCAN_INTERVAL}
                  onChange={(e) => handleSettingChange('OPEN_POSITION_SCAN_INTERVAL', parseInt(e.target.value) || 0)}
                  onFocus={handleNumericInputFocus}
                  className="w-full bg-surface px-2 py-1 rounded border border-gray-700 text-xs"
                />
                <p className="text-xs text-gray-500 mt-0.5">Check interval</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fees & Taxes */}
        <Card variant="glass">
          <CardTitle>Fees & Taxes</CardTitle>
          <CardContent>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-400 block mb-0.5">Maker Fee (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={localSettings.MAKER_FEE_PERCENT}
                  onChange={(e) => handleSettingChange('MAKER_FEE_PERCENT', parseFloat(e.target.value) || 0)}
                  onFocus={handleNumericInputFocus}
                  className="w-full bg-surface px-2 py-1 rounded border border-gray-700 text-xs"
                />
                <p className="text-xs text-gray-500 mt-0.5">Limit orders</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-0.5">Taker Fee (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={localSettings.TAKER_FEE_PERCENT}
                  onChange={(e) => handleSettingChange('TAKER_FEE_PERCENT', parseFloat(e.target.value) || 0)}
                  onFocus={handleNumericInputFocus}
                  className="w-full bg-surface px-2 py-1 rounded border border-gray-700 text-xs"
                />
                <p className="text-xs text-gray-500 mt-0.5">Market orders</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-0.5">Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={localSettings.TAX_PERCENT}
                  onChange={(e) => handleSettingChange('TAX_PERCENT', parseFloat(e.target.value) || 0)}
                  onFocus={handleNumericInputFocus}
                  className="w-full bg-surface px-2 py-1 rounded border border-gray-700 text-xs"
                />
                <p className="text-xs text-gray-500 mt-0.5">Profits only</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comments & History - Full width */}
      <Card>
        <CardTitle>Comments & History</CardTitle>
        <CardContent className="space-y-2">
          <textarea
            value={settingsComment}
            onChange={(e) => setSettingsComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full bg-surface p-1.5 rounded border border-gray-700 text-xs"
            rows={1}
          />
          <div>
            <h4 className="font-semibold mb-1 text-xs">Recent</h4>
            <div className="space-y-0.5 max-h-24 overflow-y-auto">
              {settingsHistory.slice(0, 4).map((entry, i) => (
                <div key={i} className="text-xs bg-surface p-1 rounded">
                  <p className="text-gray-400">{new Date(entry.savedAt).toLocaleString()}</p>
                  <p className="text-gray-500">{entry.comment || 'No comment'}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card variant="tonal" color="error">
        <CardTitle className="text-sm">Danger Zone</CardTitle>
        <CardContent className="flex flex-col gap-4">
          <div>
            <p className="text-xs text-gray-300 mb-2">Reset portfolio to $10,000 (clears all trades)</p>
            <Button size="small" variant="error" onClick={() => setShowResetDialog(true)}>
              <RotateCcw size={14} /> Reset Portfolio
            </Button>
          </div>
          <div className="border-t border-white/10 pt-4">
            <p className="text-xs text-gray-300 mb-2">Reset all settings to safe defaults</p>
            <Button size="small" variant="error" onClick={() => setShowResetSettingsDialog(true)}>
              <RotateCcw size={14} /> Reset Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      {showResetDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md">
            <CardTitle>Reset Portfolio?</CardTitle>
            <CardContent className="space-y-4 mt-4">
              <p className="text-sm text-gray-300">This will clear all positions and trade history. This action cannot be undone.</p>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setShowResetDialog(false)} className="flex-1">Cancel</Button>
                <Button variant="error" onClick={async () => {
                  await resetPortfolio()
                  setShowResetDialog(false)
                }} className="flex-1">Reset Portfolio</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showResetSettingsDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md">
            <CardTitle>Reset Settings?</CardTitle>
            <CardContent className="space-y-4 mt-4">
              <p className="text-sm text-gray-300">This will revert all settings to their default safe values. Your current configuration will be lost.</p>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setShowResetSettingsDialog(false)} className="flex-1">Cancel</Button>
                <Button variant="error" onClick={async () => {
                  await resetSettings()
                  setShowResetSettingsDialog(false)
                  setSnackbar('Settings reset to defaults')
                  setTimeout(() => setSnackbar(''), 3000)
                }} className="flex-1">Reset Settings</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Unsaved Changes Dialog */}
      {showUnsavedDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle size={20} className="text-warning-400" />
              Unsaved Changes
            </CardTitle>
            <CardContent className="space-y-4 mt-4">
              <p className="text-sm text-gray-300">You have unsaved changes. What would you like to do?</p>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => { setShowUnsavedDialog(false); setPendingNavigation(null); }} className="flex-1">
                  Stay
                </Button>
                <Button variant="error" onClick={handleDiscardAndNavigate} className="flex-1">
                  Discard
                </Button>
                <Button variant="primary" onClick={handleSaveAndNavigate} className="flex-1">
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {snackbar && (
        <div className="fixed bottom-4 right-4 bg-primary-600 text-white px-4 py-2 rounded-lg">
          {snackbar}
        </div>
      )}
    </div>
  )
}
