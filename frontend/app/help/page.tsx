'use client'

import { useTrading } from '@/hooks/useTrading'
import { Card, CardTitle, CardContent } from '@/components/Card'
import Chip from '@/components/Chip'
import Link from 'next/link'
import { BarChart3, Cpu, Trophy, History, Bell, Terminal, Settings, HelpCircle } from 'lucide-react'

export default function HelpPage() {
  const { appVersion, settings } = useTrading()

  const pages = [
    { href: '/', icon: BarChart3, title: 'Overview', desc: 'Portfolio summary, positions, recent trades' },
    { href: '/bot-status', icon: Cpu, title: 'Bot Status', desc: 'Control panel, live status' },
    { href: '/performance', icon: Trophy, title: 'Performance', desc: 'Profit/loss analytics by coin' },
    { href: '/trades', icon: History, title: 'Trade History', desc: 'Complete trade history' },
    { href: '/activity', icon: Bell, title: 'Activity', desc: 'Timeline of trading events' },
    { href: '/logs', icon: Terminal, title: 'Logs', desc: 'Full bot output' },
    { href: '/settings', icon: Settings, title: 'Settings', desc: 'Configuration controls' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Big DK's Crypto Momentum Trader</h1>
        <p className="text-xl text-gray-400">v{appVersion}</p>
        <p className="text-gray-300 mt-2">Automated momentum trading bot for sub-$1 cryptocurrencies</p>
      </div>

      <Card>
        <CardTitle>About</CardTitle>
        <CardContent className="space-y-4 text-sm">
          <p>This trading bot automatically scans the Coinbase market for low-priced cryptocurrencies showing momentum. It uses technical indicators like RSI and volume surge detection to identify high-quality trade setups.</p>
          <p>The bot supports paper trading mode for safe testing without real money. When enabled, all trades are simulated using a virtual $10,000 portfolio.</p>
        </CardContent>
      </Card>

      <Card>
        <CardTitle>Key Features</CardTitle>
        <CardContent>
          <ul className="space-y-2 text-sm list-disc list-inside">
            <li>Real-time market scanning via Coinbase WebSocket</li>
            <li>RSI filter to avoid overbought coins</li>
            <li>Volume surge detection for momentum confirmation</li>
            <li>Trailing profit to let winners ride</li>
            <li>Configurable stop loss protection</li>
            <li>Paper trading mode for safe testing</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardTitle>Dashboard Pages</CardTitle>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pages.map((page) => {
              const Icon = page.icon
              return (
                <Link key={page.href} href={page.href}>
                  <div className="p-4 bg-surface rounded-lg hover:bg-surface-light transition-colors cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={20} className="text-primary-500" />
                      <h4 className="font-semibold">{page.title}</h4>
                    </div>
                    <p className="text-sm text-gray-400">{page.desc}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardTitle>Current Settings</CardTitle>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {[
              { label: 'Paper Trading', value: settings.PAPER_TRADING ? 'ON' : 'OFF' },
              { label: 'Max Price', value: '$' + settings.MAX_PRICE },
              { label: 'Profit Target', value: settings.PROFIT_TARGET + '%' },
              { label: 'Stop Loss', value: settings.STOP_LOSS + '%' },
              { label: 'Position Size', value: '$' + settings.POSITION_SIZE },
              { label: 'Max Positions', value: settings.MAX_POSITIONS },
            ].map((item, i) => (
              <div key={i} className="bg-surface p-2 rounded">
                <p className="text-gray-400 text-xs">{item.label}</p>
                <p className="font-bold mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardTitle>Architecture</CardTitle>
        <CardContent className="space-y-4">
          {/* ASCII Diagram */}
          <div className="bg-gradient-to-r from-surface to-surface-light p-4 rounded-lg border border-primary-500/20">
            <div className="font-mono text-xs text-primary-300 whitespace-pre space-y-1">
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <div className="text-primary-400 font-bold">Frontend</div>
                  <div className="text-xs text-gray-400">Next.js + React</div>
                </div>
                <div className="px-3 text-primary-300">◄──►</div>
                <div className="text-center flex-1">
                  <div className="text-primary-400 font-bold">Backend</div>
                  <div className="text-xs text-gray-400">Express + WebSocket</div>
                </div>
                <div className="px-3 text-primary-300">◄──►</div>
                <div className="text-center flex-1">
                  <div className="text-primary-400 font-bold">Exchange</div>
                  <div className="text-xs text-gray-400">Exchange API</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tech Stack Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-surface border border-primary-500/10 p-3 rounded-lg hover:border-primary-500/30 transition">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Frontend</p>
              <p className="text-sm font-semibold text-primary-300">Next.js 14</p>
              <p className="text-xs text-gray-500 mt-1">React 18 + Tailwind</p>
            </div>
            <div className="bg-surface border border-success-500/10 p-3 rounded-lg hover:border-success-500/30 transition">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Backend</p>
              <p className="text-sm font-semibold text-success-400">Node.js</p>
              <p className="text-xs text-gray-500 mt-1">Express + WS</p>
            </div>
            <div className="bg-surface border border-warning-500/10 p-3 rounded-lg hover:border-warning-500/30 transition">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Trading</p>
              <p className="text-sm font-semibold text-warning-400">Exchange</p>
              <p className="text-xs text-gray-500 mt-1">Configured exchange (Coinbase or Kraken)</p>
            </div>
            <div className="bg-surface border border-info-500/10 p-3 rounded-lg hover:border-info-500/30 transition">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Deploy</p>
              <p className="text-sm font-semibold text-info-400">Docker</p>
              <p className="text-xs text-gray-500 mt-1">Containerized</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardTitle>How to Use</CardTitle>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-semibold text-primary-400">1. Start the Bot</p>
            <p className="text-gray-300">Click the Start button on Bot Status to begin scanning markets</p>
          </div>
          <div>
            <p className="font-semibold text-primary-400">2. Configure Settings</p>
            <p className="text-gray-300">Adjust profit targets, stop loss, and other parameters in Settings</p>
          </div>
          <div>
            <p className="font-semibold text-primary-400">3. Monitor Activity</p>
            <p className="text-gray-300">Watch trades in real-time on Overview and Activity pages</p>
          </div>
          <div>
            <p className="font-semibold text-primary-400">4. Review Performance</p>
            <p className="text-gray-300">Check Performance and Trade History for detailed analytics</p>
          </div>
        </CardContent>
      </Card>

      {/* Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span>Version v{appVersion}</span>
            <span>•</span>
            <span>Paper Trading: <span className={settings.PAPER_TRADING ? 'text-success-400' : 'text-error-400'}>{settings.PAPER_TRADING ? 'ON' : 'OFF'}</span></span>
            <span>•</span>
            <span>Max Positions: {settings.MAX_POSITIONS}</span>
          </div>
          <div className="text-right text-gray-500">
            Built with Next.js + React + Tailwind CSS
          </div>
        </div>
      </div>

      {/* Add padding to prevent content being hidden by status bar */}
      <div className="h-12"></div>
    </div>
  )
}
