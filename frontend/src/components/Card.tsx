'use client'

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'tonal' | 'outlined' | 'glass'
  color?: string
  hover?: boolean
  glow?: boolean
}

export function Card({ children, className = '', variant = 'default', color = '', hover = false, glow = false }: CardProps) {
  const glowColors: { [key: string]: string } = {
    success: 'hover:shadow-glow-success',
    error: 'hover:shadow-glow-error',
    warning: 'hover:shadow-glow-warning',
    primary: 'hover:shadow-glow-sm',
    info: 'hover:shadow-glow-sm',
  }

  let baseClass = 'glass rounded-2xl transition-all duration-300'
  
  if (variant === 'tonal' && color) {
    const colorMap: { [key: string]: string } = {
      success: 'bg-gradient-to-br from-success-500/20 to-success-500/5 border-success-500/30',
      error: 'bg-gradient-to-br from-error-500/20 to-error-500/5 border-error-500/30',
      warning: 'bg-gradient-to-br from-warning-500/20 to-warning-500/5 border-warning-500/30',
      info: 'bg-gradient-to-br from-info-500/20 to-info-500/5 border-info-500/30',
      primary: 'bg-gradient-to-br from-primary-500/20 to-primary-500/5 border-primary-500/30',
    }
    baseClass = `rounded-2xl ${colorMap[color] || baseClass} transition-all duration-300`
  } else if (variant === 'outlined') {
    baseClass = 'bg-transparent rounded-2xl border-2 border-white/20 transition-all duration-300'
  } else if (variant === 'glass') {
    baseClass = 'glass rounded-2xl transition-all duration-300'
  }

  if (hover) {
    baseClass += ' hover:-translate-y-0.5'
  }

  if (glow && color) {
    baseClass += ` ${glowColors[color] || 'hover:shadow-glow-sm'}`
  }

  return (
    <div className={`${baseClass} ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '', icon }: { children: React.ReactNode; className?: string; icon?: React.ReactNode }) {
  return (
    <div className={`px-6 py-4 border-b border-white/10 ${className}`}>
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
