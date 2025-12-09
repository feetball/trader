'use client'

import { useTrading } from '@/hooks/useTrading'
import { AlertCircle, X } from 'lucide-react'
import { useState } from 'react'

export default function UpdateDialog() {
  const { updatePrompt, confirmUpdate } = useTrading()
  const [confirming, setConfirming] = useState(false)

  if (!updatePrompt.visible) return null

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      await confirmUpdate()
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface-light border border-gray-700 rounded-lg p-6 max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="text-warning-500" size={24} />
          <h2 className="text-xl font-semibold">Update Ready</h2>
        </div>

        <p className="text-gray-300 mb-4">
          Version <strong>{updatePrompt.newVersion || 'unknown'}</strong> has been prepared.
        </p>

        <p className="text-gray-400 text-sm mb-6">
          Click <strong>Restart</strong> to restart the server and apply the update now, or <strong>Cancel</strong> to postpone.
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => updatePrompt.visible = false}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex-1"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex-1 disabled:opacity-50"
          >
            {confirming ? 'Restarting...' : 'Restart'}
          </button>
        </div>
      </div>
    </div>
  )
}
