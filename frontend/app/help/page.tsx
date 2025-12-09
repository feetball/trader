'use client'

import { useTrading } from '@/hooks/useTrading'
import { Card, CardTitle, CardContent } from '@/components/Card'
import Chip from '@/components/Chip'
import Link from 'next/link'
import { BarChart3, Robot, Trophy, History, Bell, Terminal, Settings, HelpCircle } from 'lucide-react'

export default function HelpPage() {
  const { appVersion, settings } = useTrading()

  const pages = [
    { href: '/', icon: BarChart3, title: 'Overview', desc: 'Portfolio summary, positions, recent trades' },
    { href: '/bot-status', icon: Robot, title: 'Bot Status', desc: 'Control panel, live status' },
    { href: '/performance', icon: Trophy, title: 'Performance', desc: 'Profit/loss analytics by coin' },
    { href: '/trades', icon: History, title: 'Trade History', desc: 'Complete trade history' },
    { href: '/activity', icon: Bell, title: 'Activity', desc: 'Timeline of trading events' },
    { href: '/logs', icon: Terminal, title: 'Logs', desc: 'Full bot output' },
    { href: '/settings', icon: Settings, title: 'Settings', desc: 'Configuration controls' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Crypto Momentum Trader</h1>
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
    </div>
  )
}
