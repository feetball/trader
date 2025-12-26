import type { Metadata } from 'next'
import '../src/styles/globals.css'
import { TradingProvider } from '@/hooks/useTrading'
import RootLayout from '@/components/RootLayout'
import { MuiThemeProvider } from '@/theme/muiTheme'

export const metadata: Metadata = {
  title: 'Big DK\'s Crypto Momentum Trader',
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
          <MuiThemeProvider>
            <RootLayout>
              {children}
            </RootLayout>
          </MuiThemeProvider>
        </TradingProvider>
      </body>
    </html>
  )
}
