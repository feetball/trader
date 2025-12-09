'use client'

import { useTrading } from '@/hooks/useTrading'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Robot, Trophy, History, Bell, Terminal, HelpCircle, Settings, Menu, X } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/', icon: BarChart3, label: 'Overview' },
  { href: '/bot-status', icon: Robot, label: 'Bot Status' },
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

  return (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-primary-700 text-white rounded-lg"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside
        className={`fixed md:relative z-40 w-64 h-screen bg-surface-light border-r border-gray-700 transform transition-transform md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-primary-400">Trader</h1>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  )
}
