'use client'

import ChipMui from '@mui/material/Chip'
import React from 'react'

interface ChipProps {
  children: React.ReactNode
  color?: 'primary' | 'success' | 'error' | 'warning' | 'info' | 'default'
  variant?: 'filled' | 'outlined'
  size?: 'small' | 'medium'
  onClick?: () => void
  className?: string
}

export default function MuiChip({ children, color = 'primary', variant = 'filled', size = 'medium', onClick, className = '' }: ChipProps) {
  return (
    <ChipMui
      label={children as any}
      color={color as any}
      variant={variant as any}
      size={size}
      onClick={onClick}
      className={className}
    />
  )
}
