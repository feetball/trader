'use client'

import { useTrading } from '@/hooks/useTrading'
import { Card, CardTitle, CardContent } from '@/components/Card'
import Button from '@/components/Button'
import { Download, Upload, RotateCcw } from 'lucide-react'
import { useState, useRef } from 'react'

export default function SettingsPage() {
  const {
    botStatus,
    settings,
    settingsHistory,
    settingsComment,
    setSettingsComment,
    loadSettings,
    saveSettings,
    resetPortfolio,
  } = useTrading()

  const [settingsLoading, setSettingsLoading] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [snackbar, setSnackbar] = useState('')
  const [localSettings, setLocalSettings] = useState(settings)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSettingChange = (key: keyof typeof settings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }))
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
    <div className="p-6 space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <h1 className="text-3xl font-bold">Bot Settings</h1>
        <div className="flex gap-2 flex-wrap">
          <Button size="small" variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} /> Import
          </Button>
          <Button size="small" variant="secondary" onClick={handleExport}>
            <Download size={16} /> Export
          </Button>
          <Button size="small" variant="primary" loading={settingsLoading} onClick={handleSave}>
            {botStatus.running ? 'Apply & Restart' : 'Save'}
          </Button>
        </div>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} hidden />
      </div>

      {/* Settings Groups - Multi-column layout for 2K */}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
        {/* Trading Mode */}
        <Card variant="glass">
          <CardTitle>Trading Mode</CardTitle>
          <CardContent>
            <div>
              <label className="text-sm text-gray-400 block mb-2">Paper Trading</label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localSettings.PAPER_TRADING}
                  onChange={(e) => handleSettingChange('PAPER_TRADING', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-300">
                  {localSettings.PAPER_TRADING ? 'Simulated trades (safe testing)' : 'Real trades (use real money)'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Position Sizing */}
        <Card variant="glass">
          <CardTitle>Position Sizing</CardTitle>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Max Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={localSettings.MAX_PRICE}
                  onChange={(e) => handleSettingChange('MAX_PRICE', parseFloat(e.target.value) || 0)}
                  className="w-full bg-surface px-3 py-2 rounded border border-gray-700 text-sm"
                />
                <p className="text-xs text-gray-500 mt-0.5">Only trade coins under this price</p>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Position Size ($)</label>
                <input
                  type="number"
                  value={localSettings.POSITION_SIZE}
                  onChange={(e) => handleSettingChange('POSITION_SIZE', parseInt(e.target.value) || 0)}
                  className="w-full bg-surface px-3 py-2 rounded border border-gray-700 text-sm"
                />
                <p className="text-xs text-gray-500 mt-0.5">USD amount per trade</p>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Max Positions</label>
                <input
                  type="number"
                  value={localSettings.MAX_POSITIONS}
                  onChange={(e) => handleSettingChange('MAX_POSITIONS', parseInt(e.target.value) || 0)}
                  className="w-full bg-surface px-3 py-2 rounded border border-gray-700 text-sm"
                />
                <p className="text-xs text-gray-500 mt-0.5">Concurrent positions limit</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profit Targets */}
        <Card variant="glass">
          <CardTitle>Profit & Stops</CardTitle>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Profit Target (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={localSettings.PROFIT_TARGET}
                  onChange={(e) => handleSettingChange('PROFIT_TARGET', parseFloat(e.target.value) || 0)}
                  className="w-full bg-surface px-3 py-2 rounded border border-gray-700 text-sm"
                />
                <p className="text-xs text-gray-500 mt-0.5">Sell at profit %</p>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Stop Loss (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={localSettings.STOP_LOSS}
                  onChange={(e) => handleSettingChange('STOP_LOSS', parseFloat(e.target.value) || 0)}
                  className="w-full bg-surface px-3 py-2 rounded border border-gray-700 text-sm"
                />
                <p className="text-xs text-gray-500 mt-0.5">Cut losses at %</p>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Trailing Profit</label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={localSettings.ENABLE_TRAILING_PROFIT}
                    onChange={(e) => handleSettingChange('ENABLE_TRAILING_PROFIT', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-300">Enabled</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Momentum & Timing */}
        <Card variant="glass">
          <CardTitle>Momentum & Timing</CardTitle>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Momentum Threshold (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={localSettings.MOMENTUM_THRESHOLD}
                  onChange={(e) => handleSettingChange('MOMENTUM_THRESHOLD', parseFloat(e.target.value) || 0)}
                  className="w-full bg-surface px-3 py-2 rounded border border-gray-700 text-sm"
                />
                <p className="text-xs text-gray-500 mt-0.5">Min price change</p>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Momentum Window (min)</label>
                <input
                  type="number"
                  value={localSettings.MOMENTUM_WINDOW}
                  onChange={(e) => handleSettingChange('MOMENTUM_WINDOW', parseInt(e.target.value) || 0)}
                  className="w-full bg-surface px-3 py-2 rounded border border-gray-700 text-sm"
                />
                <p className="text-xs text-gray-500 mt-0.5">Time window for calc</p>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Scan Interval (sec)</label>
                <input
                  type="number"
                  value={localSettings.SCAN_INTERVAL}
                  onChange={(e) => handleSettingChange('SCAN_INTERVAL', parseInt(e.target.value) || 0)}
                  className="w-full bg-surface px-3 py-2 rounded border border-gray-700 text-sm"
                />
                <p className="text-xs text-gray-500 mt-0.5">How often to scan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Volume & Filters */}
        <Card variant="glass">
          <CardTitle>Volume & Filters</CardTitle>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Min Volume ($)</label>
                <input
                  type="number"
                  value={localSettings.MIN_VOLUME}
                  onChange={(e) => handleSettingChange('MIN_VOLUME', parseInt(e.target.value) || 0)}
                  className="w-full bg-surface px-3 py-2 rounded border border-gray-700 text-sm"
                />
                <p className="text-xs text-gray-500 mt-0.5">24h volume requirement</p>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Volume Surge Filter</label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={localSettings.VOLUME_SURGE_FILTER}
                    onChange={(e) => handleSettingChange('VOLUME_SURGE_FILTER', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-300">{localSettings.VOLUME_SURGE_FILTER ? 'Enabled' : 'Disabled'}</span>
                </div>
                <label className="text-sm text-gray-400 block mb-1">Threshold (%)</label>
                <input
                  type="number"
                  value={localSettings.VOLUME_SURGE_THRESHOLD}
                  onChange={(e) => handleSettingChange('VOLUME_SURGE_THRESHOLD', parseInt(e.target.value) || 0)}
                  className="w-full bg-surface px-3 py-2 rounded border border-gray-700 text-sm"
                  disabled={!localSettings.VOLUME_SURGE_FILTER}
                />
                <p className="text-xs text-gray-500 mt-0.5">Volume % of average</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RSI Filter */}
        <Card variant="glass">
          <CardTitle>RSI Filter</CardTitle>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={localSettings.RSI_FILTER}
                  onChange={(e) => handleSettingChange('RSI_FILTER', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-300">{localSettings.RSI_FILTER ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">RSI Min</label>
                <input
                  type="number"
                  value={localSettings.RSI_MIN}
                  onChange={(e) => handleSettingChange('RSI_MIN', parseInt(e.target.value) || 0)}
                  className="w-full bg-surface px-3 py-2 rounded border border-gray-700 text-sm"
                  disabled={!localSettings.RSI_FILTER}
                />
                <p className="text-xs text-gray-500 mt-0.5">Minimum for entry</p>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">RSI Max</label>
                <input
                  type="number"
                  value={localSettings.RSI_MAX}
                  onChange={(e) => handleSettingChange('RSI_MAX', parseInt(e.target.value) || 0)}
                  className="w-full bg-surface px-3 py-2 rounded border border-gray-700 text-sm"
                  disabled={!localSettings.RSI_FILTER}
                />
                <p className="text-xs text-gray-500 mt-0.5">Maximum for entry</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trailing Stop */}
        <Card variant="glass">
          <CardTitle>Trailing Stop</CardTitle>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Trailing Stop (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={localSettings.TRAILING_STOP_PERCENT}
                  onChange={(e) => handleSettingChange('TRAILING_STOP_PERCENT', parseFloat(e.target.value) || 0)}
                  className="w-full bg-surface px-3 py-2 rounded border border-gray-700 text-sm"
                  disabled={!localSettings.ENABLE_TRAILING_PROFIT}
                />
                <p className="text-xs text-gray-500 mt-0.5">Trail stop distance</p>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Min Momentum (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={localSettings.MIN_MOMENTUM_TO_RIDE}
                  onChange={(e) => handleSettingChange('MIN_MOMENTUM_TO_RIDE', parseFloat(e.target.value) || 0)}
                  className="w-full bg-surface px-3 py-2 rounded border border-gray-700 text-sm"
                  disabled={!localSettings.ENABLE_TRAILING_PROFIT}
                />
                <p className="text-xs text-gray-500 mt-0.5">Min for trailing</p>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Position Check (sec)</label>
                <input
                  type="number"
                  value={localSettings.OPEN_POSITION_SCAN_INTERVAL}
                  onChange={(e) => handleSettingChange('OPEN_POSITION_SCAN_INTERVAL', parseInt(e.target.value) || 0)}
                  className="w-full bg-surface px-3 py-2 rounded border border-gray-700 text-sm"
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
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Maker Fee (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={localSettings.MAKER_FEE_PERCENT}
                  onChange={(e) => handleSettingChange('MAKER_FEE_PERCENT', parseFloat(e.target.value) || 0)}
                  className="w-full bg-surface px-3 py-2 rounded border border-gray-700 text-sm"
                />
                <p className="text-xs text-gray-500 mt-0.5">Fee for limit orders</p>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Taker Fee (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={localSettings.TAKER_FEE_PERCENT}
                  onChange={(e) => handleSettingChange('TAKER_FEE_PERCENT', parseFloat(e.target.value) || 0)}
                  className="w-full bg-surface px-3 py-2 rounded border border-gray-700 text-sm"
                />
                <p className="text-xs text-gray-500 mt-0.5">Fee for market orders</p>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={localSettings.TAX_PERCENT}
                  onChange={(e) => handleSettingChange('TAX_PERCENT', parseFloat(e.target.value) || 0)}
                  className="w-full bg-surface px-3 py-2 rounded border border-gray-700 text-sm"
                />
                <p className="text-xs text-gray-500 mt-0.5">Tax on profits (tracking)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comments & History - Full width */}
      <Card>
        <CardTitle>Comments & History</CardTitle>
        <CardContent className="space-y-4">
          <textarea
            value={settingsComment}
            onChange={(e) => setSettingsComment(e.target.value)}
            placeholder="Add a comment about this settings change..."
            className="w-full bg-surface p-2 rounded border border-gray-700 text-sm"
            rows={2}
          />
          <div>
            <h4 className="font-semibold mb-2 text-sm">Recent Changes</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {settingsHistory.slice(0, 6).map((entry, i) => (
                <div key={i} className="text-xs bg-surface p-2 rounded">
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
        <CardTitle>Danger Zone</CardTitle>
        <CardContent>
          <p className="text-sm text-gray-300 mb-4">Reset portfolio to $10,000 and clear all trades</p>
          <Button variant="error" onClick={() => setShowResetDialog(true)}>
            <RotateCcw size={16} /> Reset Portfolio
          </Button>
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
                }} className="flex-1">Reset</Button>
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
