import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'YangonPrice — Property Market Advisor',
  description: 'Yangon real estate analysis in Burmese',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="my">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
