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
    <div className="relative h-screen h-[100dvh] lg-panel overflow-hidden">
      <Sidebar />
      <div className="flex h-full flex-col overflow-hidden md:pl-72">
        <AppBar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto min-h-0 overscroll-contain">
          {children}
        </main>
      </div>
      <UpdateDialog />
    </div>
  )
}
