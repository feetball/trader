'use client'

import CardMui from '@mui/material/Card'
import CardContentMui from '@mui/material/CardContent'
import CardHeaderMui from '@mui/material/CardHeader'
import Box from '@mui/material/Box'

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'tonal' | 'outlined' | 'glass'
  color?: string
  hover?: boolean
  glow?: boolean
  title?: React.ReactNode
  subheader?: React.ReactNode
}

export function Card({ children, className = '', variant = 'default', color = '', hover = false, glow = false, title, subheader }: CardProps) {
  // Use MUI Card and let styles be applied via sx and utility classes
  return (
    <CardMui
      elevation={variant === 'tonal' ? 3 : 1}
      sx={{
        borderRadius: 2,
        overflow: 'visible',
      }}
      className={`${className}`}
    >
      {title && <CardHeaderMui title={title as any} subheader={subheader as any} />}
      <CardContentMui>
        {children}
      </CardContentMui>
    </CardMui>
  )
}

export function CardTitle({ children, className = '', icon }: { children: React.ReactNode; className?: string; icon?: React.ReactNode }) {
  return (
    <Box className={`px-6 py-4 border-b border-white/10 ${className}`}> 
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary-500/20 to-info-500/20">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          {children}
        </h3>
      </div>
    </Box>
  )
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <CardContentMui className={className}>
      {children}
    </CardContentMui>
  )
}
