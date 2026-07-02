'use client'

import { useEffect, useState } from 'react'

interface DashboardData {
  totals: { comparables: number; analyses: number; market_data: number }
  priceByTownship: { township: string; avg: number; count: number }[]
  decisions: Record<string, number>
  analysesByDate: { date: string; count: number }[]
  dataTypes: Record<string, number>
}

const decisionColors: Record<string, string> = {
  BUY: 'var(--good)',
  WAIT: 'var(--gold)',
  AVOID: 'var(--bad)',
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: '20px 24px', flex: '1 1 140px' }}>
      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--gold)' }}>{value}</div>
      <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: 4 }}>{label}</div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', fontWeight: 700, margin: '0 0 14px' }}>{children}</p>
}

function HBar({ label, value, max, color = 'var(--gold)', suffix = '' }: { label: string; value: number; max: number; color?: string; suffix?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 5 }}>
        <span style={{ color: 'var(--ink)' }}>{label}</span>
        <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{typeof value === 'number' ? value.toFixed(value % 1 === 0 ? 0 : 2) : value}{suffix}</span>
      </div>
      <div style={{ background: 'var(--panel-raised)', borderRadius: 6, height: 7, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 6, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d) })
      .catch(() => setError('Network error.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px 80px' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ color: 'var(--gold)', fontWeight: 800, margin: '0 0 4px', fontSize: '1.4rem' }}>Market Trend Dashboard</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>Aggregated intelligence from your comparables and analysis history</p>
      </div>

      {error && <p style={{ color: 'var(--bad)' }}>{error}</p>}
      {loading && <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 60 }}>Loading…</p>}

      {data && (
        <>
          {/* Totals */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 36, flexWrap: 'wrap' }}>
            <StatCard label="Total Analyses Run" value={data.totals.analyses} />
            <StatCard label="Verified Comparables" value={data.totals.comparables} />
            <StatCard label="Market Data Records" value={data.totals.market_data} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

            {/* Price by Township */}
            <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: '22px 24px', gridColumn: '1 / -1' }}>
              <SectionLabel>Average Price per Sqft by Township (lakh)</SectionLabel>
              {data.priceByTownship.length === 0
                ? <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>No comparable data yet.</p>
                : data.priceByTownship.map(t => (
                  <HBar key={t.township} label={`${t.township} (${t.count})`} value={t.avg} max={data.priceByTownship[0].avg} suffix=" L/sqft" />
                ))
              }
            </div>

            {/* Decision Breakdown */}
            <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: '22px 24px' }}>
              <SectionLabel>Decision Breakdown</SectionLabel>
              {Object.entries(data.decisions).every(([, v]) => v === 0)
                ? <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>No analyses logged yet.</p>
                : Object.entries(data.decisions).map(([d, count]) => {
                  const total = Object.values(data.decisions).reduce((a, b) => a + b, 0)
                  return (
                    <div key={d} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: 5 }}>
                        <span style={{ color: decisionColors[d] ?? 'var(--muted)', fontWeight: 700 }}>{d}</span>
                        <span style={{ color: 'var(--muted)' }}>{count} ({total > 0 ? Math.round(count / total * 100) : 0}%)</span>
                      </div>
                      <div style={{ background: 'var(--panel-raised)', borderRadius: 6, height: 7 }}>
                        <div style={{ width: `${total > 0 ? count / total * 100 : 0}%`, height: '100%', background: decisionColors[d] ?? 'var(--muted)', borderRadius: 6 }} />
                      </div>
                    </div>
                  )
                })}
            </div>

            {/* Market Data Types */}
            <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: '22px 24px' }}>
              <SectionLabel>Ingested Data Types</SectionLabel>
              {Object.keys(data.dataTypes).length === 0
                ? <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>No market data ingested yet.</p>
                : (() => {
                  const max = Math.max(...Object.values(data.dataTypes))
                  return Object.entries(data.dataTypes).map(([type, count]) => (
                    <HBar key={type} label={type} value={count} max={max} color="rgba(217,162,75,0.7)" />
                  ))
                })()
              }
            </div>

            {/* Analyses over time */}
            {data.analysesByDate.length > 0 && (
              <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: '22px 24px', gridColumn: '1 / -1' }}>
                <SectionLabel>Analyses — Last 30 Days</SectionLabel>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
                  {data.analysesByDate.map(d => {
                    const maxCount = Math.max(...data.analysesByDate.map(x => x.count))
                    const pct = maxCount > 0 ? (d.count / maxCount) * 100 : 0
                    return (
                      <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }} title={`${d.date}: ${d.count}`}>
                        <div style={{ width: '100%', background: 'var(--gold)', borderRadius: '3px 3px 0 0', height: `${pct}%`, minHeight: 3 }} />
                        <span style={{ fontSize: '0.6rem', color: 'var(--muted)', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                          {d.date.slice(5)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

          </div>
        </>
      )}
    </div>
  )
}
