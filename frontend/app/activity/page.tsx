'use client'

import { useTrading } from '@/hooks/useTrading'
import { Card, CardTitle, CardContent } from '@/components/Card'
import Chip from '@/components/Chip'
import { formatHoldTime, formatTimestamp } from '@/lib/utils'

export default function ActivityPage() {
  const { activities, openCoinbase } = useTrading()

  const today = new Date().toDateString()
  const todayActivities = activities.filter(a => new Date(a.timestamp).toDateString() === today)
  const todayWins = todayActivities.filter(a => a.profit > 0).length
  const todayLosses = todayActivities.filter(a => a.profit < 0).length
  const todayNet = todayActivities.reduce((sum, a) => sum + a.profit, 0)

  return (
    <div className="p-6 space-y-6">
      {todayActivities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="tonal" color="success">
            <CardContent>
              <p className="text-sm text-gray-400">Wins Today</p>
              <p className="text-3xl font-bold text-success-500 mt-2">{todayWins}</p>
            </CardContent>
          </Card>
          <Card variant="tonal" color="error">
            <CardContent>
              <p className="text-sm text-gray-400">Losses Today</p>
              <p className="text-3xl font-bold text-error-500 mt-2">{todayLosses}</p>
            </CardContent>
          </Card>
          <Card variant="tonal" color={todayNet >= 0 ? 'success' : 'error'}>
            <CardContent>
              <p className="text-sm text-gray-400">Net Today</p>
              <p className={`text-3xl font-bold mt-2 ${todayNet >= 0 ? 'text-success-500' : 'text-error-500'}`}>
                {todayNet >= 0 ? '+' : ''}${todayNet.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardTitle>Activity Timeline</CardTitle>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activities.map((activity, i) => (
              <div key={i} className={`p-3 rounded-lg border-l-4 ${activity.profit >= 0 ? 'border-success-500 bg-success-900/20' : 'border-error-500 bg-error-900/20'}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Chip size="small" onClick={() => openCoinbase(activity.symbol)}>
                      {activity.symbol}
                    </Chip>
                    <span className={`font-bold ${activity.profit >= 0 ? 'text-success-500' : 'text-error-500'}`}>
                      {activity.profit >= 0 ? '+' : ''}${activity.profit.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{formatTimestamp(activity.timestamp)}</span>
                </div>
                <p className="text-sm text-gray-300">{activity.reason}</p>
              </div>
            ))}
            {activities.length === 0 && (
              <p className="text-center py-8 text-gray-500">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
