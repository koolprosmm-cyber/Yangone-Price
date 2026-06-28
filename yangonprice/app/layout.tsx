import type { Metadata } from 'next'
import NavBar from '@/components/NavBar'
import './globals.css'

export const metadata: Metadata = {
  title: 'YangonPrice — Property Market Advisor',
  description: 'Yangon real estate analysis in Burmese',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="my">
      <body>
        <header style={{ padding: '20px 0 0', textAlign: 'center' }}>
          <h1 style={{ margin: '0 0 2px', fontSize: '1.7rem', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--ink)' }}>
            <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              Yangon<span style={{ color: 'var(--gold)' }}>Price</span>
            </a>
          </h1>
          <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontSize: '0.8rem' }}>Property Market Advisor</p>
          <NavBar />
        </header>
        {children}
      </body>
    </html>
  )
}
