'use client'

import { useRouter } from 'next/navigation'
import { useTrading } from '@/hooks/useTrading'
import Sidebar from '@/components/Sidebar'
import AppBar from '@/components/AppBar'
import UpdateDialog from '@/components/UpdateDialog'
import { ReactNode, useState, useEffect } from 'react'

export default function RootLayout({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null)

  useEffect(() => {
    setMounted(true)

    // Performance monitoring
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const paint = performance.getEntriesByType('paint')

      setPerformanceMetrics({
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime,
        firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime,
      })
    }
  }, [])

  // Log performance metrics in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && performanceMetrics) {
      console.log('🚀 Performance Metrics:', performanceMetrics)
    }
  }, [performanceMetrics])

  if (!mounted) return null

  return (
    <div className="flex h-screen bg-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppBar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      <UpdateDialog />

      {/* Performance indicator (development only) */}
      {process.env.NODE_ENV === 'development' && performanceMetrics && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white text-xs p-2 rounded font-mono z-50">
          <div>FCP: {performanceMetrics.firstContentfulPaint?.toFixed(0)}ms</div>
          <div>DCL: {performanceMetrics.domContentLoaded?.toFixed(0)}ms</div>
        </div>
      )}
    </div>
  )
}
