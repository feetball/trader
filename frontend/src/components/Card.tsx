'use client'

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'tonal' | 'outlined'
  color?: string
}

export function Card({ children, className = '', variant = 'default', color = '' }: CardProps) {
  let baseClass = 'bg-surface-light border border-gray-700 rounded-lg'
  
  if (variant === 'tonal' && color) {
    const colorMap: { [key: string]: string } = {
      success: 'bg-success-900 border-success-700',
      error: 'bg-error-900 border-error-700',
      warning: 'bg-warning-900 border-warning-700',
      info: 'bg-info-900 border-info-700',
      primary: 'bg-primary-900 border-primary-700',
    }
    baseClass = `rounded-lg ${colorMap[color] || baseClass}`
  }

  return (
    <div className={`${baseClass} ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-6 py-4 border-b border-gray-700 ${className}`}>
      <h3 className="text-lg font-semibold">{children}</h3>
    </div>
  )
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  )
}
