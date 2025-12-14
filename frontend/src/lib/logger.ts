/**
 * Frontend Logger
 * Captures frontend events and errors for display
 */

export interface FrontendLog {
  timestamp: string
  message: string
  level: 'info' | 'warn' | 'error' | 'success'
}

class FrontendLogger {
  private logs: FrontendLog[] = []
  private maxLogs = 500
  private listeners: Set<(logs: FrontendLog[]) => void> = new Set()

  constructor() {
    // Capture console errors and warnings
    this.interceptConsole()
    // Capture unhandled errors
    this.captureErrors()
  }

  private interceptConsole() {
    const originalError = console.error
    const originalWarn = console.warn

    console.error = (...args: any[]) => {
      this.log('error', args.map(a => String(a)).join(' '))
      originalError.apply(console, args)
    }

    console.warn = (...args: any[]) => {
      this.log('warn', args.map(a => String(a)).join(' '))
      originalWarn.apply(console, args)
    }
  }

  private captureErrors() {
    if (typeof window === 'undefined') return

    window.addEventListener('error', (event) => {
      this.log('error', `${event.message} at ${event.filename}:${event.lineno}:${event.colno}`)
    })

    window.addEventListener('unhandledrejection', (event) => {
      this.log('error', `Unhandled Promise Rejection: ${event.reason}`)
    })
  }

  log(level: 'info' | 'warn' | 'error' | 'success', message: string) {
    const timestamp = new Date().toLocaleTimeString()
    const log: FrontendLog = { timestamp, message, level }
    
    this.logs.push(log)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // Notify listeners
    this.listeners.forEach(listener => listener([...this.logs]))
  }

  info(message: string) {
    this.log('info', message)
  }

  success(message: string) {
    this.log('success', message)
  }

  warn(message: string) {
    this.log('warn', message)
  }

  error(message: string) {
    this.log('error', message)
  }

  getLogs(): FrontendLog[] {
    return [...this.logs]
  }

  subscribe(callback: (logs: FrontendLog[]) => void): () => void {
    this.listeners.add(callback)
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback)
    }
  }

  clear() {
    this.logs = []
    this.listeners.forEach(listener => listener([]))
  }
}

// Create singleton instance
export const frontendLogger = new FrontendLogger()
