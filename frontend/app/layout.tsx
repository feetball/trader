import type { Metadata } from 'next'
import '../src/styles/globals.css'
import { TradingProvider } from '@/hooks/useTrading'
import RootLayout from '@/components/RootLayout'

export const metadata: Metadata = {
  title: 'Crypto Momentum Trader',
  description: 'Automated momentum trading bot for cryptocurrencies',
}

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-surface text-white">
        <TradingProvider>
          <RootLayout>
            {children}
          </RootLayout>
        </TradingProvider>
      </body>
    </html>
  )
}
