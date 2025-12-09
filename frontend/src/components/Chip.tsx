'use client'

interface ChipProps {
  children: React.ReactNode
  color?: 'primary' | 'success' | 'error' | 'warning' | 'info' | 'grey'
  variant?: 'default' | 'tonal' | 'outlined' | 'glow'
  size?: 'small' | 'medium' | 'large'
  onClick?: () => void
  className?: string
  pulse?: boolean
}

export default function Chip({
  children,
  color = 'primary',
  variant = 'default',
  size = 'medium',
  onClick,
  className = '',
  pulse = false,
}: ChipProps) {
  const colorMap: { [key: string]: string } = {
    primary: 'bg-gradient-to-r from-primary-600 to-primary-500 text-white',
    success: 'bg-gradient-to-r from-success-600 to-success-500 text-white',
    error: 'bg-gradient-to-r from-error-600 to-error-500 text-white',
    warning: 'bg-gradient-to-r from-warning-600 to-warning-500 text-white',
    info: 'bg-gradient-to-r from-info-600 to-info-500 text-white',
    grey: 'bg-gradient-to-r from-gray-700 to-gray-600 text-gray-300',
  }

  const tonalMap: { [key: string]: string } = {
    primary: 'bg-primary-500/20 text-primary-400 border border-primary-500/30',
    success: 'bg-success-500/20 text-success-400 border border-success-500/30',
    error: 'bg-error-500/20 text-error-400 border border-error-500/30',
    warning: 'bg-warning-500/20 text-warning-400 border border-warning-500/30',
    info: 'bg-info-500/20 text-info-400 border border-info-500/30',
    grey: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
  }

  const glowMap: { [key: string]: string } = {
    primary: 'bg-primary-500/20 text-primary-400 shadow-glow-sm',
    success: 'bg-success-500/20 text-success-400 shadow-glow-success',
    error: 'bg-error-500/20 text-error-400 shadow-glow-error',
    warning: 'bg-warning-500/20 text-warning-400 shadow-glow-warning',
    info: 'bg-info-500/20 text-info-400 shadow-glow-sm',
    grey: 'bg-gray-500/20 text-gray-400',
  }

  const sizeMap: { [key: string]: string } = {
    small: 'px-2.5 py-1 text-xs',
    medium: 'px-3.5 py-1.5 text-sm',
    large: 'px-5 py-2.5 text-base',
  }

  let baseClass = `inline-flex items-center gap-1.5 rounded-full font-medium ${sizeMap[size]} transition-all duration-300`

  if (variant === 'tonal') {
    baseClass += ` ${tonalMap[color]}`
  } else if (variant === 'outlined') {
    baseClass += ` border-2 bg-transparent ${tonalMap[color]}`
  } else if (variant === 'glow') {
    baseClass += ` ${glowMap[color]}`
  } else {
    baseClass += ` ${colorMap[color]}`
  }

  if (onClick) {
    baseClass += ' cursor-pointer hover:scale-105 active:scale-95'
  }

  if (pulse) {
    baseClass += ' animate-pulse'
  }

  return (
    <span
      onClick={onClick}
      className={`${baseClass} ${className}`}
      role={onClick ? 'button' : undefined}
    >
      {children}
    </span>
  )
}
