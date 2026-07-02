'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import AnalysisForm from '@/components/AnalysisForm'
import AnalysisResult from '@/components/AnalysisResult'
import DecisionPill from '@/components/DecisionPill'
import { AnalysisResponse } from '@/lib/types'

interface PropertyRecord {
  id: string
  township: string | null
  property_type: string | null
  location: string | null
  price_lakh: number | null
  land_size: string | null
  building_size_sqft: number | null
  bedrooms: number | null
  bathrooms: number | null
  floors: number | null
  raw_content: string
  analysis_json: AnalysisResponse | null
  executive_summary_mm: string | null
  analysis_decision: string | null
  analysis_generated_at: string | null
  created_at: string
}

const areaStyle = (raised: boolean): React.CSSProperties => ({
  background: raised ? 'var(--panel-raised)' : 'var(--panel)',
  border: '1px solid var(--line)',
  borderRadius: 14,
  padding: '24px 28px',
  marginBottom: 28,
})

const sectionLabel: React.CSSProperties = {
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--muted)',
  fontWeight: 700,
  margin: '0 0 12px',
}

const disclaimer = (
  <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: '14px 0 0', lineHeight: 1.7 }}>
    AI-Generated Analysis — Not Financial, Legal, or Investment Advice
  </p>
)

export default function PropertyDetailPage() {
  const params = useParams()
  const id = params?.id as string

  const [property, setProperty] = useState<PropertyRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userResult, setUserResult] = useState<AnalysisResponse | null>(null)
  const [userLoading, setUserLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/properties/${id}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setProperty(d.property) })
      .catch(() => setError('Failed to load property.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--muted)' }}>Loading…</div>
  if (error || !property) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--bad)' }}>{error ?? 'Property not found.'}</div>

  const cachedAnalysis = property.analysis_json

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px 80px' }}>
      {/* Property header */}
      <div style={{ marginBottom: 24 }}>
        <a href="/comparables" style={{ color: 'var(--muted)', fontSize: '0.82rem', textDecoration: 'none' }}>← Back</a>
        <h2 style={{ color: 'var(--gold)', fontWeight: 800, margin: '10px 0 2px', fontSize: '1.4rem' }}>
          {property.township ?? 'Property'}{property.property_type ? ` — ${property.property_type}` : ''}
        </h2>
        {property.location && <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>{property.location}</p>}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--muted)', marginTop: 8 }}>
          {property.price_lakh != null && <span>💰 {property.price_lakh.toLocaleString()} Lakh</span>}
          {property.building_size_sqft != null && <span>📐 {property.building_size_sqft.toLocaleString()} sqft</span>}
          {property.bedrooms != null && <span>🛏 {property.bedrooms} bed</span>}
          {property.bathrooms != null && <span>🚿 {property.bathrooms} bath</span>}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          AREA 1 — Pre-computed Property Analysis
      ══════════════════════════════════════════ */}
      <div style={areaStyle(true)}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <p style={{ ...sectionLabel, margin: 0 }}>Property Analysis</p>
            <p style={{ color: 'var(--muted)', fontSize: '0.78rem', margin: '4px 0 0' }}>
              AI analysis prepared by YangonPrice — same result shown to all visitors
            </p>
          </div>
          {property.analysis_decision
            ? <DecisionPill decision={property.analysis_decision as 'BUY' | 'WAIT' | 'AVOID'} />
            : <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>⏳ Analysis Pending</span>
          }
        </div>

        {cachedAnalysis ? (
          <>
            <AnalysisResult result={cachedAnalysis} />
            <p style={{ fontSize: '0.73rem', color: 'var(--muted)', margin: '12px 0 0' }}>
              Analysis generated: {new Date(property.analysis_generated_at!).toLocaleString()}
            </p>
          </>
        ) : (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--muted)', fontSize: '0.9rem' }}>
            ⏳ Analysis is being generated — check back shortly.
          </div>
        )}
        {disclaimer}
      </div>

      {/* ══════════════════════════════════════════
          AREA 2 — Run Your Own Analysis
      ══════════════════════════════════════════ */}
      <div style={areaStyle(false)}>
        <p style={{ ...sectionLabel, marginBottom: 4 }}>Run Your Own Analysis</p>
        <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: '0 0 18px', lineHeight: 1.6 }}>
          Paste this listing (or any variation) to run your own fresh analysis. Results here are private to your session.
        </p>

        <AnalysisForm
          onResult={setUserResult}
          onLoading={setUserLoading}
          loading={userLoading}
          defaultValue={property.raw_content}
        />

        {userResult && (
          <div style={{ marginTop: 22 }}>
            <AnalysisResult result={userResult} />
          </div>
        )}
        {disclaimer}
      </div>
    </div>
  )
}
