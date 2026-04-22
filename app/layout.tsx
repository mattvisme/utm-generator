import type { Metadata } from 'next'
import { Montserrat, Lato } from 'next/font/google'
import './globals.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-montserrat',
  display: 'swap',
})

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-lato',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'UTM Generator — Visme',
  description: 'Internal tool for generating standardized UTM-tagged URLs across all Visme teams.',
  icons: { icon: 'https://www.visme.co/favicon-32x32.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${lato.variable}`}>
      <body style={{ fontFamily: 'var(--font-lato), Lato, sans-serif', background: 'var(--bg)' }}>
        {children}
      </body>
    </html>
  )
}
