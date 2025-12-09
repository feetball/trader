'use client'

import { useTrading } from '@/hooks/useTrading'
import { AlertCircle, X } from 'lucide-react'
import { useState } from 'react'

export default function UpdateDialog() {
  const { updatePrompt, confirmUpdate, applyUpdate } = useTrading()
  const [confirming, setConfirming] = useState(false)

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface-light border border-gray-700 rounded-lg p-6 max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className={`text-${isAvailable ? 'info' : 'warning'}-500`} size={24} />
          <h2 className="text-xl font-semibold">
            {isAvailable ? 'Update Available' : isReady ? 'Update Ready' : 'Applying Update'}
          </h2>
        </div>

        <p className="text-gray-300 mb-4">
          {isAvailable && `Version ${updatePrompt.newVersion || 'unknown'} is available.`}
          {isReady && `Version ${updatePrompt.newVersion || 'unknown'} has been prepared.`}
          {isApplying && 'Applying update...'}
        </p>

        <p className="text-gray-400 text-sm mb-6">
          {isAvailable && 'Click Apply to download and prepare the update.'}
          {isReady && 'Click Restart to restart the server and apply the update now, or Cancel to postpone.'}
          {isApplying && 'Please wait while the update is being applied...'}
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => updatePrompt.visible = false}
            disabled={isApplying}
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
        </div>
      </div>
    </div>
  )
}
