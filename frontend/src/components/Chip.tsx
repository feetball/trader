'use client'

interface ChipProps {
  children: React.ReactNode
  color?: 'primary' | 'success' | 'error' | 'warning' | 'info' | 'grey'
  variant?: 'default' | 'tonal' | 'outlined'
  size?: 'small' | 'medium' | 'large'
  onClick?: () => void
  className?: string
}

export default function Chip({
  children,
  color = 'primary',
  variant = 'default',
  size = 'medium',
  onClick,
  className = '',
}: ChipProps) {
  const colorMap: { [key: string]: string } = {
    primary: 'bg-primary-700 text-white',
    success: 'bg-success-700 text-white',
    error: 'bg-error-700 text-white',
    warning: 'bg-warning-700 text-white',
    info: 'bg-info-700 text-white',
    grey: 'bg-gray-700 text-gray-300',
  }

  const sizeMap: { [key: string]: string } = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base',
  }

  let baseClass = `inline-flex items-center gap-1 rounded-full font-medium ${sizeMap[size]} cursor-pointer`

  if (variant === 'tonal') {
    baseClass += ' opacity-75'
  } else if (variant === 'outlined') {
    baseClass += ` border-2 border-current ${colorMap[color]}`
  } else {
    baseClass += ` ${colorMap[color]}`
  }

  return (
    <div
      onClick={onClick}
      className={`${baseClass} ${className}`}
    >
      {children}
    </div>
  )
}
