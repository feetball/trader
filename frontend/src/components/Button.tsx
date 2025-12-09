'use client'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'success' | 'error' | 'warning' | 'info' | 'secondary' | 'grey'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'medium',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const variantMap: { [key: string]: string } = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    success: 'bg-success-600 hover:bg-success-700 text-white',
    error: 'bg-error-600 hover:bg-error-700 text-white',
    warning: 'bg-warning-600 hover:bg-warning-700 text-white',
    info: 'bg-info-600 hover:bg-info-700 text-white',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white',
    grey: 'bg-gray-600 hover:bg-gray-500 text-white',
  }

  const sizeMap: { [key: string]: string } = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  }

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center gap-2 rounded-lg font-medium transition-colors ${sizeMap[size]} ${variantMap[variant]} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? <span className="animate-spin">⟳</span> : icon}
      {children}
    </button>
  )
}
