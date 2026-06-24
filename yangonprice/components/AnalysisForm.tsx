'use client'

import { useState } from 'react'
import { AnalysisResponse } from '@/lib/types'

interface Props {
  onResult: (result: AnalysisResponse) => void
  onLoading: (loading: boolean) => void
  loading: boolean
}

export default function AnalysisForm({ onResult, onLoading, loading }: Props) {
  const [listing, setListing] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!listing.trim()) return
    setError(null)
    onLoading(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Analysis failed. Please try again.')
        return
      }
      onResult(data as AnalysisResponse)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      onLoading(false)
    }
  }

  return (
    <div
      className="box"
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        padding: '28px 30px',
      }}
    >
      <p
        style={{
          fontSize: '0.78rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--muted)',
          margin: '0 0 18px',
          fontWeight: 700,
        }}
      >
        Paste Property Listing
      </p>

      <form onSubmit={handleSubmit}>
        <textarea
          className="my"
          value={listing}
          onChange={(e) => setListing(e.target.value)}
          placeholder="Paste the full property listing here — in Burmese or English. Include price, location, size, and any details from the original post."
          rows={14}
          style={{
            width: '100%',
            minHeight: 320,
            background: 'var(--panel-raised)',
            border: '1px solid var(--line)',
            color: 'var(--ink)',
            borderRadius: 10,
            padding: '16px 18px',
            fontSize: '0.98rem',
            lineHeight: 1.8,
            outline: 'none',
          }}
        />

        <p
          style={{
            fontSize: '0.8rem',
            color: 'var(--muted)',
            marginTop: 10,
            lineHeight: 1.6,
          }}
        >
          Paste the listing text exactly as you received it — prices, location, size, and any notes. The system will read the details directly from this text.
        </p>

        {error && (
          <p style={{ color: 'var(--bad)', fontSize: '0.85rem', marginTop: 10 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !listing.trim()}
          style={{
            width: '100%',
            marginTop: 16,
            background: loading || !listing.trim()
              ? 'rgba(217,162,75,0.4)'
              : 'linear-gradient(135deg, var(--gold), #C8893A)',
            color: '#1A2420',
            border: 'none',
            borderRadius: 9,
            padding: '14px',
            fontWeight: 700,
            fontSize: '0.98rem',
            cursor: loading || !listing.trim() ? 'not-allowed' : 'pointer',
            transition: 'opacity 0.2s',
          }}
        >
          {loading ? 'Analyzing…' : 'Get Advice'}
        </button>
      </form>
    </div>
  )
}
