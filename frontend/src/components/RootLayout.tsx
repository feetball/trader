'use client'

import { useRouter } from 'next/navigation'
import { useTrading } from '@/hooks/useTrading'
import Sidebar from '@/components/Sidebar'
import AppBar from '@/components/AppBar'
import UpdateDialog from '@/components/UpdateDialog'
import { ReactNode, useState, useEffect } from 'react'

export default function RootLayout({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="flex h-screen lg-panel">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppBar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      <UpdateDialog />
    </div>
  )
}
