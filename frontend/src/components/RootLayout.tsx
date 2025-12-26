'use client'

import { useRouter } from 'next/navigation'
import { useTrading } from '@/hooks/useTrading'
import Sidebar from '@/components/Sidebar'
import AppBar from '@/components/AppBar'
import UpdateDialog from '@/components/UpdateDialog'
import { ReactNode, useState, useEffect } from 'react'
import { Box, useTheme, useMediaQuery } from '@mui/material'

const DRAWER_WIDTH = 280

export default function RootLayout({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <AppBar />
        <Box sx={{ 
          flexGrow: 1, 
          p: { xs: 2, sm: 3, md: 4 },
          overflow: 'auto'
        }}>
          {children}
        </Box>
      </Box>
      <UpdateDialog />
    </Box>
  )
}
