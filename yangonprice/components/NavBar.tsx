'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const links = [
  { href: '/', label: 'Analyze' },
  { href: '/comparables', label: 'Comparables' },
  { href: '/townships', label: 'Townships' },
  { href: '/dashboard', label: 'Dashboard' },
]

export default function NavBar() {
  const path = usePathname()
  return (
    <nav style={{ display: 'flex', justifyContent: 'center', gap: 4, padding: '10px 0', borderBottom: '1px solid var(--line)', flexWrap: 'wrap' }}>
      {links.map(l => {
        const active = path === l.href
        return (
          <Link key={l.href} href={l.href} style={{
            padding: '6px 18px', borderRadius: 8, fontSize: '0.88rem', fontWeight: active ? 700 : 500,
            color: active ? 'var(--gold)' : 'var(--muted)',
            background: active ? 'var(--gold-soft)' : 'transparent',
            border: `1px solid ${active ? 'rgba(217,162,75,0.35)' : 'transparent'}`,
            textDecoration: 'none', transition: 'all 0.15s',
          }}>
            {l.label}
          </Link>
        )
      })}
    </nav>
  )
}
