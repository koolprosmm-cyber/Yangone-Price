'use client'

import { useEffect, useState } from 'react'

interface TownshipStat {
  township: string
  count: number
  avg_price_per_sqft: number
  min_price_per_sqft: number
  max_price_per_sqft: number
  avg_total_lakhs: number
  property_types: string[]
  latest: string
}

export default function TownshipsPage() {
  const [townships, setTownships] = useState<TownshipStat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/townships')
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setTownships(d.townships) })
      .catch(() => setError('Network error.'))
      .finally(() => setLoading(false))
  }, [])

  const maxAvg = Math.max(...townships.map(t => t.avg_price_per_sqft), 0.01)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 80px' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ color: 'var(--gold)', fontWeight: 800, margin: '0 0 4px', fontSize: '1.4rem' }}>Township Insights</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>Average price per sqft by township, derived from verified comparables</p>
      </div>

      {error && <p style={{ color: 'var(--bad)' }}>{error}</p>}

      {loading ? (
        <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 60 }}>Loading…</p>
      ) : townships.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12, opacity: 0.3 }}>🗺</div>
          <p style={{ margin: 0 }}>No township data yet. Add verified comparables in the Admin Panel to populate this view.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {townships.map(t => {
            const barPct = (t.avg_price_per_sqft / maxAvg) * 100
            return (
              <div key={t.township} style={{
                background: 'var(--panel)',
                border: '1px solid var(--line)',
                borderRadius: 12,
                padding: '18px 22px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ink)' }}>{t.township}</span>
                    <span style={{ color: 'var(--muted)', fontSize: '0.78rem', marginLeft: 10 }}>
                      {t.count} comparable{t.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--gold)' }}>
                    {t.avg_price_per_sqft.toFixed(2)} <span style={{ fontWeight: 400, fontSize: '0.78rem', color: 'var(--muted)' }}>lakh/sqft avg</span>
                  </span>
                </div>

                {/* Bar chart */}
                <div style={{ background: 'var(--panel-raised)', borderRadius: 6, height: 8, overflow: 'hidden', marginBottom: 12 }}>
                  <div style={{
                    width: `${barPct}%`, height: '100%',
                    background: 'linear-gradient(90deg, var(--gold), #C8893A)',
                    borderRadius: 6,
                    transition: 'width 0.5s ease',
                  }} />
                </div>

                <div style={{ display: 'flex', gap: 20, fontSize: '0.82rem', color: 'var(--muted)', flexWrap: 'wrap' }}>
                  <span>Min: <strong style={{ color: 'var(--ink)' }}>{t.min_price_per_sqft.toFixed(2)}</strong></span>
                  <span>Max: <strong style={{ color: 'var(--ink)' }}>{t.max_price_per_sqft.toFixed(2)}</strong></span>
                  <span>Avg total: <strong style={{ color: 'var(--ink)' }}>{t.avg_total_lakhs.toLocaleString()} L</strong></span>
                  <span style={{ marginLeft: 'auto' }}>{t.property_types.slice(0, 3).join(', ')}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
