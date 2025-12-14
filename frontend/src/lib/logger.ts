/**
 * Frontend Logger
 * Captures frontend events and errors for display
 */

export interface FrontendLog {
  timestamp: string
  message: string
  level: 'info' | 'warn' | 'error' | 'success'
}

/**
 * Format error object to string for logging
 */
export function formatError(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error'
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
      const message = event.message || ''
      
      // Filter out generic "Script error" messages that provide no useful information
      // These are typically from CORS issues with third-party scripts or browser extensions
      // Both variants (with and without period) are checked as browsers may vary
      if (message === 'Script error.' || message === 'Script error') {
        // Silently ignore these unhelpful errors
        return
      }

      // Filter out errors from browser extensions (e.g., MetaMask, crypto wallets)
      // These are not relevant to the application and clutter the logs
      const messageLower = message.toLowerCase()
      if (
        messageLower.includes('ethereum') ||
        messageLower.includes('metamask') ||
        messageLower.includes('chrome-extension://') ||
        messageLower.includes('moz-extension://')
      ) {
        // Silently ignore browser extension errors
        return
      }

      const filename = event.filename || 'unknown'
      const lineno = event.lineno || 0
      const colno = event.colno || 0
      this.log('error', `${message} at ${filename}:${lineno}:${colno}`)
    })

    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason instanceof Error 
        ? `${event.reason.message} ${event.reason.stack ? '| ' + event.reason.stack.split('\n').slice(0, 2).join(' ') : ''}` 
        : String(event.reason)
      this.log('error', `Unhandled Promise Rejection: ${reason}`)
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
