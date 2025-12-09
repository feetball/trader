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
    <div className="p-6 space-y-6">
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

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(localSettings).map(([key, value]) => (
          <Card key={key}>
            <CardContent>
              <label className="text-sm text-gray-400 block mb-2">{key}</label>
              {typeof value === 'boolean' ? (
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => handleSettingChange(key as keyof typeof localSettings, e.target.checked)}
                  className="w-4 h-4"
                />
              ) : (
                <input
                  type="number"
                  value={value}
                  onChange={(e) => handleSettingChange(key as keyof typeof localSettings, isNaN(+e.target.value) ? value : +e.target.value)}
                  className="w-full bg-surface px-2 py-1 rounded text-sm border border-gray-700"
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comment */}
      <Card>
        <CardTitle>Comments & History</CardTitle>
        <CardContent className="space-y-4">
          <textarea
            value={settingsComment}
            onChange={(e) => setSettingsComment(e.target.value)}
            placeholder="Add a comment about this settings change..."
            className="w-full bg-surface p-2 rounded border border-gray-700 text-sm"
            rows={3}
          />
          <div>
            <h4 className="font-semibold mb-2">Recent Changes</h4>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {settingsHistory.slice(0, 8).map((entry, i) => (
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
