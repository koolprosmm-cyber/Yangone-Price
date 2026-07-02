'use client'

import { useState, useEffect, useCallback } from 'react'

interface Comparable {
  id: string
  township: string
  property_type: string
  price_total_lakhs: number
  area_sqft: number
  price_per_sqft_lakhs: number
  notes: string | null
  created_at: string
}

const inputStyle: React.CSSProperties = {
  background: 'var(--panel-raised)',
  border: '1px solid var(--line)',
  color: 'var(--ink)',
  borderRadius: 8,
  padding: '9px 14px',
  fontSize: '0.9rem',
  outline: 'none',
  width: '100%',
}

export default function ComparablesPage() {
  const [township, setTownship] = useState('')
  const [type, setType] = useState('')
  const [results, setResults] = useState<Comparable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (township) params.set('township', township)
      if (type) params.set('type', type)
      const res = await fetch(`/api/comparables?${params}`)
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to load'); return }
      setResults(data.results)
    } catch {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }, [township, type])

  useEffect(() => { search() }, [])

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 80px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: 'var(--gold)', fontWeight: 800, margin: '0 0 4px', fontSize: '1.4rem' }}>Comparable Properties</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>Search verified comparable sales used for market benchmarking</p>
      </div>

      {/* Search bar */}
      <form onSubmit={e => { e.preventDefault(); search() }} style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>
          <input style={inputStyle} placeholder="Township (e.g. Kamayut)" value={township} onChange={e => setTownship(e.target.value)} />
        </div>
        <div style={{ flex: '1 1 180px' }}>
          <input style={inputStyle} placeholder="Property type (e.g. Apartment)" value={type} onChange={e => setType(e.target.value)} />
        </div>
        <button type="submit" style={{
          background: 'linear-gradient(135deg, var(--gold), #C8893A)',
          color: '#1A2420', border: 'none', borderRadius: 8,
          padding: '9px 24px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
        }}>
          Search
        </button>
      </form>

      {error && <p style={{ color: 'var(--bad)', fontSize: '0.9rem' }}>{error}</p>}

      {loading ? (
        <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 60 }}>Loading…</p>
      ) : results.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12, opacity: 0.3 }}>🏘</div>
          <p style={{ margin: 0 }}>No comparables found. Admins can add verified comparables in the Admin Panel.</p>
        </div>
      ) : (
        <>
          <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: 16 }}>{results.length} result{results.length !== 1 ? 's' : ''}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {results.map(c => (
              <div key={c.id} style={{
                background: 'var(--panel)',
                border: '1px solid var(--line)',
                borderRadius: 12,
                padding: '18px 20px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink)' }}>{c.township}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{c.property_type}</div>
                  </div>
                  <span style={{
                    background: 'var(--gold-soft)', color: 'var(--gold)',
                    border: '1px solid rgba(217,162,75,0.35)',
                    borderRadius: 6, padding: '3px 10px', fontSize: '0.78rem', fontWeight: 700,
                  }}>
                    {c.price_per_sqft_lakhs.toFixed(2)} L/sqft
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: '0.85rem' }}>
                  <div><span style={{ color: 'var(--muted)' }}>Total: </span><strong>{c.price_total_lakhs.toLocaleString()} L</strong></div>
                  <div><span style={{ color: 'var(--muted)' }}>Area: </span><strong>{c.area_sqft.toLocaleString()} sqft</strong></div>
                </div>
                {c.notes && <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '10px 0 0', lineHeight: 1.5 }}>{c.notes}</p>}
                <p style={{ color: 'var(--muted)', fontSize: '0.73rem', margin: '10px 0 0' }}>
                  Added {new Date(c.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
