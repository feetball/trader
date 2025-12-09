'use client'

import { useTrading } from '@/hooks/useTrading'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Cpu, Trophy, History, Bell, Terminal, HelpCircle, Settings, Menu, X, Zap, RefreshCw } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/', icon: BarChart3, label: 'Overview' },
  { href: '/bot-status', icon: Cpu, label: 'Bot Status' },
  { href: '/performance', icon: Trophy, label: 'Performance' },
  { href: '/trades', icon: History, label: 'Trade History' },
  { href: '/activity', icon: Bell, label: 'Activity' },
  { href: '/logs', icon: Terminal, label: 'Logs' },
  { href: '/settings', icon: Settings, label: 'Settings' },
  { href: '/help', icon: HelpCircle, label: 'Help' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [checking, setChecking] = useState(false)
  const [toast, setToast] = useState<{ type: 'info' | 'success' | 'error'; message: string } | null>(null)

  const showToast = (type: 'info' | 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const handleCheckUpdates = async () => {
    setChecking(true)
    try {
      const response = await fetch('/api/updates/check', { method: 'POST' })
      const data = await response.json()
      
      if (data.updateAvailable) {
        showToast('info', `Update available: v${data.newVersion}. Check the update dialog to proceed.`)
      } else {
        showToast('success', 'You are running the latest version!')
      }
    } catch (error) {
      console.error('Failed to check for updates:', error)
      showToast('error', 'Failed to check for updates')
    } finally {
      setChecking(false)
    }
  }

  return (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-3 glass rounded-xl shadow-glow-sm hover:shadow-glow-md transition-all duration-300"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} className="text-white" /> : <Menu size={20} className="text-white" />}
      </button>

      <aside
        className={`fixed md:relative z-40 w-72 h-screen glass border-r border-white/10 transform transition-all duration-500 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-info-500 flex items-center justify-center shadow-glow-sm">
                <Zap size={22} className="text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-success-500 border-2 border-background animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 via-info-400 to-primary-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer">
                Trader
              </h1>
              <p className="text-xs text-gray-500">Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item, idx) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-500/20 to-info-500/20 text-white shadow-glow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                style={{ animationDelay: `${idx * 50}ms` }}
                title={`${item.label} - ${item.href === '/' ? 'Main dashboard overview' : item.href === '/bot-status' ? 'Control and monitor the trading bot' : item.href === '/performance' ? 'View trading performance analytics' : item.href === '/trades' ? 'Browse complete trade history' : item.href === '/activity' ? 'See recent trading activity' : item.href === '/logs' ? 'View detailed bot logs' : item.href === '/settings' ? 'Configure trading parameters' : 'Get help and documentation'}`}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b from-primary-400 to-info-400 shadow-glow-sm" />
                )}
                
                <div className={`p-2 rounded-lg transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-br from-primary-500/30 to-info-500/30' 
                    : 'bg-white/5 group-hover:bg-white/10'
                }`}>
                  <Icon size={18} className={isActive ? 'text-primary-400' : 'text-gray-400 group-hover:text-white transition-colors'} />
                </div>
                
                <span className="font-medium">{item.label}</span>
                
                {/* Hover glow effect */}
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/0 via-primary-500/5 to-info-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${isActive ? 'opacity-100' : ''}`} />
              </Link>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5 space-y-3">
          <button
            onClick={handleCheckUpdates}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600/20 to-info-600/20 border border-primary-500/30 hover:from-primary-600/30 hover:to-info-600/30 text-primary-300 hover:text-primary-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium text-sm"
            title="Check for available updates"
          >
            <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
            {checking ? 'Checking...' : 'Check Updates'}
          </button>
          
          <div className="glass-light rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse"></div>
              <span className="text-xs text-gray-400">System Status</span>
            </div>
            <p className="text-xs text-gray-500">All systems operational</p>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm md:hidden z-30 transition-opacity duration-300"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-sm z-50 animate-in slide-in-from-bottom-4">
          <div className={`p-4 rounded-lg border backdrop-blur-sm ${
            toast.type === 'success' 
              ? 'bg-success-500/20 border-success-500/50 text-success-300'
              : toast.type === 'error'
              ? 'bg-danger-500/20 border-danger-500/50 text-danger-300'
              : 'bg-info-500/20 border-info-500/50 text-info-300'
          }`}>
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}
    </>
  )
}
