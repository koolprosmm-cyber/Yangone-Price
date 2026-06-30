'use client'

import { useState } from 'react'

function CopyLinkButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    const url = `${window.location.origin}/properties/${id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }
  return (
    <button onClick={copy} style={{
      padding: '9px 20px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600,
      background: copied ? 'var(--good-soft)' : 'var(--panel-raised)',
      border: `1px solid ${copied ? 'var(--good)' : 'var(--line)'}`,
      color: copied ? 'var(--good)' : 'var(--ink)', cursor: 'pointer',
    }}>
      {copied ? '✅ Copied!' : '📋 Copy Link'}
    </button>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--panel-raised)',
  border: '1px solid var(--line)',
  color: 'var(--ink)',
  borderRadius: 8,
  padding: '10px 14px',
  fontSize: '0.95rem',
  marginBottom: 14,
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: 'var(--muted)',
  display: 'block',
  marginBottom: 4,
  fontWeight: 600,
}

const sectionLabel: React.CSSProperties = {
  fontSize: '0.75rem',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  color: 'var(--muted)',
  fontWeight: 700,
  margin: '0 0 12px',
}

const card: React.CSSProperties = {
  background: 'var(--panel)',
  border: '1px solid var(--line)',
  borderRadius: 14,
  padding: '28px 30px',
  marginBottom: 24,
}

const confidenceColors: Record<string, string> = {
  High: 'var(--good)',
  Medium: 'var(--gold)',
  Low: 'var(--bad)',
}

interface IngestResult {
  market_data_type: string
  property_type: string
  township: string
  location: string
  price_lakh: number | null
  land_size: string
  building_size_sqft: number | null
  bedrooms: number | null
  bathrooms: number | null
  floors: number | null
  listing_date: string | null
  confidence_score: string
  extraction_notes: string
}

interface IngestRecord {
  id: string
  extracted: IngestResult
  analysisReady: boolean
  refreshing: boolean
}

export default function AdminPage() {
  const [tab, setTab] = useState<'ingest' | 'comparables'>('ingest')

  // Ingestion state
  const [rawContent, setRawContent] = useState('')
  const [ingestLoading, setIngestLoading] = useState(false)
  const [ingestRecord, setIngestRecord] = useState<IngestRecord | null>(null)
  const [ingestError, setIngestError] = useState<string | null>(null)

  // Comparables state — paste + extract + review flow
  const [compRaw, setCompRaw] = useState('')
  const [compExtracting, setCompExtracting] = useState(false)
  const [compExtracted, setCompExtracted] = useState<{
    township: string; property_type: string; price_total_lakhs: number | null; area_sqft: number | null; notes: string; confidence_score: string | null
  } | null>(null)
  const [compSaving, setCompSaving] = useState(false)
  const [compError, setCompError] = useState<string | null>(null)
  const [compStatus, setCompStatus] = useState<{ ok: boolean; msg: string } | null>(null)

  async function handleIngest(e: React.FormEvent) {
    e.preventDefault()
    if (!rawContent.trim()) return
    setIngestError(null)
    setIngestRecord(null)
    setIngestLoading(true)
    try {
      const res = await fetch('/api/admin/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_content: rawContent }),
      })
      const data = await res.json()
      if (!res.ok) { setIngestError(data.error ?? 'Ingestion failed'); return }
      setIngestRecord({ id: data.record.id, extracted: data.extracted as IngestResult, analysisReady: false, refreshing: false })
      setRawContent('')

      // Poll for analysis completion (up to 60s)
      const id = data.record.id
      let attempts = 0
      const poll = setInterval(async () => {
        attempts++
        const r = await fetch(`/api/properties/${id}`)
        const d = await r.json()
        if (d.property?.analysis_generated_at) {
          setIngestRecord(prev => prev ? { ...prev, analysisReady: true } : prev)
          clearInterval(poll)
        }
        if (attempts >= 12) clearInterval(poll)
      }, 5000)
    } catch {
      setIngestError('Network error. Please try again.')
    } finally {
      setIngestLoading(false)
    }
  }

  async function handleRefresh(id: string) {
    setIngestRecord(prev => prev ? { ...prev, refreshing: true } : prev)
    try {
      const res = await fetch('/api/admin/refresh-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        setIngestRecord(prev => prev ? { ...prev, analysisReady: true, refreshing: false } : prev)
      }
    } catch { /* non-fatal */ }
    setIngestRecord(prev => prev ? { ...prev, refreshing: false } : prev)
  }

  async function handleCompExtract(e: React.FormEvent) {
    e.preventDefault()
    if (!compRaw.trim()) return
    setCompError(null)
    setCompExtracted(null)
    setCompStatus(null)
    setCompExtracting(true)
    try {
      const res = await fetch('/api/admin/extract-comparable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_content: compRaw }),
      })
      const data = await res.json()
      if (!res.ok) { setCompError(data.error ?? 'AI extraction failed. Please try again.'); return }
      setCompExtracted(data)
    } catch {
      setCompError('Network error. Please try again.')
    } finally {
      setCompExtracting(false)
    }
  }

  async function handleCompSave() {
    if (!compExtracted) return
    setCompStatus(null)
    setCompSaving(true)
    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          township: compExtracted.township,
          property_type: compExtracted.property_type,
          price_total_lakhs: compExtracted.price_total_lakhs,
          area_sqft: compExtracted.area_sqft,
          notes: compExtracted.notes || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setCompStatus({ ok: false, msg: data.error ?? 'Save failed' }); return }
      setCompStatus({ ok: true, msg: 'Comparable saved successfully.' })
      setCompRaw('')
      setCompExtracted(null)
    } catch {
      setCompStatus({ ok: false, msg: 'Network error.' })
    } finally {
      setCompSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>
      <a href="/" style={{ color: 'var(--muted)', fontSize: '0.85rem', textDecoration: 'none' }}>← Back to app</a>

      <div style={{ marginTop: 20, marginBottom: 28 }}>
        <h2 style={{ color: 'var(--gold)', fontWeight: 800, margin: '0 0 4px', fontSize: '1.5rem' }}>Admin Panel</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>Market data management for Property Market Advisor</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['ingest', 'comparables'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 20px', borderRadius: 8, border: '1px solid var(--line)',
            background: tab === t ? 'var(--gold-soft)' : 'var(--panel)',
            color: tab === t ? 'var(--gold)' : 'var(--muted)',
            fontWeight: tab === t ? 700 : 500,
            fontSize: '0.88rem', cursor: 'pointer',
          }}>
            {t === 'ingest' ? 'Market Data Ingestion' : 'Add Comparable'}
          </button>
        ))}
      </div>

      {/* ── INGESTION TAB ── */}
      {tab === 'ingest' && (
        <>
          <div style={card}>
            <p style={sectionLabel}>Paste Raw Content</p>
            <p style={{ color: 'var(--muted)', fontSize: '0.83rem', marginTop: 0, marginBottom: 16 }}>
              Paste any property listing, market report, township observation, or rental data. The AI will extract, structure, and auto-analyze it.
            </p>
            <form onSubmit={handleIngest}>
              <textarea
                value={rawContent}
                onChange={e => setRawContent(e.target.value)}
                placeholder="Paste Facebook listing, market report, rental data, township notes, or any property-related content here..."
                rows={10}
                style={{ ...inputStyle, minHeight: 220, resize: 'vertical', lineHeight: 1.7, marginBottom: 0 }}
              />
              {ingestError && (
                <p style={{ color: 'var(--bad)', fontSize: '0.85rem', margin: '10px 0' }}>{ingestError}</p>
              )}
              <button type="submit" disabled={ingestLoading || !rawContent.trim()} style={{
                width: '100%', marginTop: 14,
                background: ingestLoading || !rawContent.trim() ? 'rgba(217,162,75,0.35)' : 'linear-gradient(135deg, var(--gold), #C8893A)',
                color: '#1A2420', border: 'none', borderRadius: 9, padding: '13px',
                fontWeight: 700, fontSize: '0.95rem',
                cursor: ingestLoading || !rawContent.trim() ? 'not-allowed' : 'pointer',
              }}>
                {ingestLoading ? 'Extracting & Analyzing…' : 'Extract & Store'}
              </button>
            </form>
          </div>

          {/* Extraction + analysis result */}
          {ingestRecord && (
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                <p style={{ ...sectionLabel, margin: 0 }}>Extracted Record</p>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Analysis status */}
                  <span style={{
                    fontSize: '0.78rem', fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                    color: ingestRecord.analysisReady ? 'var(--good)' : 'var(--gold)',
                    background: ingestRecord.analysisReady ? 'var(--good-soft)' : 'var(--gold-soft)',
                    border: `1px solid ${ingestRecord.analysisReady ? 'var(--good)' : 'var(--gold)'}`,
                  }}>
                    {ingestRecord.analysisReady ? '✅ Analysis Ready' : '⏳ Analysis Pending'}
                  </span>
                  {/* Confidence */}
                  <span style={{
                    fontSize: '0.78rem', fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                    color: confidenceColors[ingestRecord.extracted.confidence_score] ?? 'var(--muted)',
                    background: ingestRecord.extracted.confidence_score === 'High' ? 'var(--good-soft)' : ingestRecord.extracted.confidence_score === 'Low' ? 'var(--bad-soft)' : 'var(--gold-soft)',
                    border: `1px solid ${confidenceColors[ingestRecord.extracted.confidence_score] ?? 'var(--line)'}`,
                  }}>
                    {ingestRecord.extracted.confidence_score} Confidence
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
                {[
                  { label: 'Data Type', value: ingestRecord.extracted.market_data_type },
                  { label: 'Property Type', value: ingestRecord.extracted.property_type },
                  { label: 'Township', value: ingestRecord.extracted.township },
                  { label: 'Location', value: ingestRecord.extracted.location },
                  { label: 'Price (Lakh)', value: ingestRecord.extracted.price_lakh?.toString() },
                  { label: 'Land Size', value: ingestRecord.extracted.land_size },
                  { label: 'Building (sqft)', value: ingestRecord.extracted.building_size_sqft?.toString() },
                  { label: 'Bedrooms', value: ingestRecord.extracted.bedrooms?.toString() },
                  { label: 'Bathrooms', value: ingestRecord.extracted.bathrooms?.toString() },
                  { label: 'Floors', value: ingestRecord.extracted.floors?.toString() },
                  { label: 'Listing Date', value: ingestRecord.extracted.listing_date },
                ].filter(r => r.value).map(row => (
                  <div key={row.label} style={{ fontSize: '0.88rem', padding: '4px 0' }}>
                    <span style={{ color: 'var(--muted)' }}>{row.label}: </span>
                    <strong style={{ color: 'var(--ink)' }}>{row.value}</strong>
                  </div>
                ))}
              </div>

              {ingestRecord.extracted.extraction_notes && (
                <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--gold-soft)', border: '1px solid rgba(217,162,75,0.3)', borderRadius: 8, fontSize: '0.83rem', color: '#E8C988' }}>
                  ⚠ {ingestRecord.extracted.extraction_notes}
                </div>
              )}

              <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {/* View property page */}
                <a href={`/properties/${ingestRecord.id}`} target="_blank" style={{
                  padding: '9px 20px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600,
                  background: 'var(--panel-raised)', border: '1px solid var(--line)',
                  color: 'var(--ink)', textDecoration: 'none',
                }}>
                  🔗 View Property Page
                </a>

                {/* Copy shareable link */}
                <CopyLinkButton id={ingestRecord.id} />

                {/* Refresh analysis */}
                <button onClick={() => handleRefresh(ingestRecord.id)} disabled={ingestRecord.refreshing} style={{
                  padding: '9px 20px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600,
                  background: ingestRecord.refreshing ? 'rgba(217,162,75,0.2)' : 'var(--gold-soft)',
                  border: '1px solid rgba(217,162,75,0.4)',
                  color: 'var(--gold)', cursor: ingestRecord.refreshing ? 'wait' : 'pointer',
                }}>
                  {ingestRecord.refreshing ? '⏳ Refreshing…' : '🔄 Refresh Analysis'}
                </button>
              </div>

              <p style={{ color: 'var(--good)', fontSize: '0.83rem', marginTop: 14, marginBottom: 0 }}>
                ✓ Saved to market intelligence database.
              </p>
            </div>
          )}
        </>
      )}

      {/* ── COMPARABLES TAB ── */}
      {tab === 'comparables' && (
        <>
          {/* Step 1 — Paste */}
          <div style={card}>
            <p style={sectionLabel}>Add Verified Comparable</p>
            <p style={{ color: 'var(--muted)', fontSize: '0.83rem', marginTop: 0, marginBottom: 16 }}>
              Paste a raw property listing. AI will extract the comparable fields — you review before saving.
            </p>
            <form onSubmit={handleCompExtract}>
              <textarea
                value={compRaw}
                onChange={e => { setCompRaw(e.target.value); setCompExtracted(null); setCompStatus(null) }}
                placeholder="Paste a property listing here — township, price, area, property type will be extracted automatically..."
                rows={8}
                style={{ ...inputStyle, minHeight: 180, resize: 'vertical', lineHeight: 1.7, marginBottom: 0 }}
              />
              {compError && (
                <p style={{ color: 'var(--bad)', fontSize: '0.85rem', margin: '10px 0 0', padding: '10px 14px', background: 'var(--bad-soft)', borderRadius: 8, border: '1px solid rgba(226,100,90,0.3)' }}>
                  {compError}
                </p>
              )}
              <button type="submit" disabled={compExtracting || !compRaw.trim()} style={{
                width: '100%', marginTop: 14,
                background: compExtracting || !compRaw.trim() ? 'rgba(217,162,75,0.35)' : 'linear-gradient(135deg, var(--gold), #C8893A)',
                color: '#1A2420', border: 'none', borderRadius: 9, padding: '13px',
                fontWeight: 700, fontSize: '0.95rem',
                cursor: compExtracting || !compRaw.trim() ? 'not-allowed' : 'pointer',
              }}>
                {compExtracting ? 'Extracting…' : 'Extract Fields'}
              </button>
            </form>
          </div>

          {/* Step 2 — Review extracted fields */}
          {compExtracted && (
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                <p style={{ ...sectionLabel, margin: 0 }}>Review Extracted Fields</p>
                {compExtracted.confidence_score && (
                  <span style={{
                    fontSize: '0.78rem', fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                    color: confidenceColors[compExtracted.confidence_score] ?? 'var(--muted)',
                    background: compExtracted.confidence_score === 'High' ? 'var(--good-soft)' : compExtracted.confidence_score === 'Low' ? 'var(--bad-soft)' : 'var(--gold-soft)',
                    border: `1px solid ${confidenceColors[compExtracted.confidence_score] ?? 'var(--line)'}`,
                  }}>
                    {compExtracted.confidence_score} Confidence
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px', marginBottom: 18 }}>
                {[
                  { label: 'Township', value: compExtracted.township || '—' },
                  { label: 'Property Type', value: compExtracted.property_type || '—' },
                  { label: 'Total Price (lakhs)', value: compExtracted.price_total_lakhs != null ? `${compExtracted.price_total_lakhs}` : '—' },
                  { label: 'Area (sqft)', value: compExtracted.area_sqft != null ? `${compExtracted.area_sqft}` : '—' },
                ].map(row => (
                  <div key={row.label} style={{ fontSize: '0.9rem', padding: '10px 14px', background: 'var(--panel-raised)', borderRadius: 8, border: '1px solid var(--line)' }}>
                    <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginBottom: 4 }}>{row.label}</div>
                    <div style={{ color: 'var(--ink)', fontWeight: 700 }}>{row.value}</div>
                  </div>
                ))}
              </div>

              {compExtracted.notes && (
                <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 16, padding: '8px 14px', background: 'var(--panel-raised)', borderRadius: 8, border: '1px solid var(--line)' }}>
                  <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Notes: </span>{compExtracted.notes}
                </div>
              )}

              {(!compExtracted.township || !compExtracted.property_type || compExtracted.price_total_lakhs == null) && (
                <div style={{ marginBottom: 14, padding: '10px 14px', background: 'var(--bad-soft)', border: '1px solid rgba(226,100,90,0.3)', borderRadius: 8, fontSize: '0.83rem', color: 'var(--bad)' }}>
                  ⚠ Township, property type, and price are required. Go back and check the listing text.
                </div>
              )}
              {compExtracted.area_sqft == null && compExtracted.township && compExtracted.property_type && compExtracted.price_total_lakhs != null && (
                <div style={{ marginBottom: 14, padding: '10px 14px', background: 'rgba(217,162,75,0.1)', border: '1px solid rgba(217,162,75,0.3)', borderRadius: 8, fontSize: '0.83rem', color: 'var(--gold)' }}>
                  ℹ Area (sqft) not found — per-sqft rate will not be calculated. You can still save this comparable.
                </div>
              )}

              {compStatus && (
                <p style={{ color: compStatus.ok ? 'var(--good)' : 'var(--bad)', fontSize: '0.85rem', marginBottom: 12 }}>
                  {compStatus.msg}
                </p>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setCompExtracted(null); setCompStatus(null) }} style={{
                  flex: 1, padding: '12px', borderRadius: 9, border: '1px solid var(--line)',
                  background: 'var(--panel-raised)', color: 'var(--muted)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                }}>
                  ← Go Back
                </button>
                <button
                  onClick={handleCompSave}
                  disabled={compSaving || !compExtracted.township || !compExtracted.property_type || compExtracted.price_total_lakhs == null}
                  style={{
                    flex: 2, padding: '12px', borderRadius: 9, border: 'none',
                    background: compSaving ? 'rgba(217,162,75,0.35)' : 'linear-gradient(135deg, var(--gold), #C8893A)',
                    color: '#1A2420', fontWeight: 700, fontSize: '0.95rem',
                    cursor: compSaving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {compSaving ? 'Saving…' : '✓ Confirm & Save Comparable'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
