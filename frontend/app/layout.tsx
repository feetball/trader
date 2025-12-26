import type { Metadata } from 'next'
import '../src/styles/globals.css'
import { Roboto_Flex } from 'next/font/google'
import { TradingProvider } from '@/hooks/useTrading'
import RootLayout from '@/components/RootLayout'
import { MuiThemeProvider } from '@/theme/muiTheme'

const roboto = Roboto_Flex({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
})

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
    <html lang="en" className={`dark ${roboto.variable}`}>
      <body>
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
