'use client'

import { useTrading } from '@/hooks/useTrading'
import { AlertCircle, X, Check } from 'lucide-react'
import { useState } from 'react'

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface-light border border-gray-700 rounded-lg p-6 max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          {isComplete ? (
            <Check className="text-success-500" size={24} />
          ) : (
            <AlertCircle className={`text-${isAvailable ? 'info' : 'warning'}-500`} size={24} />
          )}
          <h2 className="text-xl font-semibold">
            {isAvailable ? 'Update Available' : isReady ? 'Update Ready' : isApplying ? 'Applying Update' : 'Update Complete'}
          </h2>
        </div>

        <p className="text-gray-300 mb-2">
          {isAvailable && `Version ${updatePrompt.newVersion || 'unknown'} is available.`}
          {isReady && `Version ${updatePrompt.newVersion || 'unknown'} has been prepared.`}
          {isApplying && 'Applying update...'}
          {isComplete && `Version ${updatePrompt.newVersion || 'unknown'} has been applied!`}
        </p>

        <p className="text-gray-400 text-sm mb-4">
          {isAvailable && 'Click Apply to download and prepare the update.'}
          {isReady && 'Click Restart to restart the server and apply the update now, or Cancel to postpone.'}
          {isApplying && 'Please wait while the update is being applied...'}
          {isComplete && 'The update has been successfully applied. Click OK to continue.'}
        </p>

        {/* Logs Section */}
        {updateLogs.length > 0 && (
          <div className="flex-1 min-h-[200px] mb-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-300">Update Log</h3>
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="text-xs px-2 py-1 text-gray-400 hover:text-gray-300 border border-gray-600 rounded"
              >
                {showLogs ? 'Hide' : 'Show'}
              </button>
            </div>
            {showLogs && (
              <div className="flex-1 bg-gray-900 border border-gray-700 rounded p-3 overflow-y-auto">
                <div className="font-mono text-xs text-gray-300 space-y-1">
                  {updateLogs.map((log, i) => (
                    <div key={i} className="text-gray-400">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          {isComplete ? (
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-success-600 hover:bg-success-700 text-white rounded-lg flex-1 font-medium"
            >
              OK
            </button>
          ) : (
            <>
              <button
                onClick={() => updatePrompt.visible = false}
                disabled={isApplying || confirming}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex-1 disabled:opacity-50"
              >
                {isApplying ? 'Applying...' : 'Cancel'}
              </button>
              {isAvailable && (
                <button
                  onClick={handleApply}
                  disabled={confirming}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex-1 disabled:opacity-50"
                >
                  {confirming ? 'Applying...' : 'Apply'}
                </button>
              )}
              {isReady && (
                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex-1 disabled:opacity-50"
                >
                  {confirming ? 'Restarting...' : 'Restart'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
