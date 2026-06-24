'use client'

import { useState } from 'react'

interface FormState {
  township: string
  property_type: string
  price_total_lakhs: string
  area_sqft: string
  notes: string
}

const field: React.CSSProperties = {
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

const label: React.CSSProperties = {
  fontSize: '0.8rem',
  color: 'var(--muted)',
  display: 'block',
  marginBottom: 4,
  fontWeight: 600,
}

export default function AdminPage() {
  const [form, setForm] = useState<FormState>({
    township: '',
    property_type: '',
    price_total_lakhs: '',
    area_sqft: '',
    notes: '',
  })
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null)
  const [loading, setLoading] = useState(false)

  function update(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus(null)
    setLoading(true)
    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          township: form.township,
          property_type: form.property_type,
          price_total_lakhs: parseFloat(form.price_total_lakhs),
          area_sqft: parseFloat(form.area_sqft),
          notes: form.notes || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus({ ok: false, msg: data.error ?? 'Upload failed' })
      } else {
        setStatus({ ok: true, msg: 'Listing added successfully.' })
        setForm({ township: '', property_type: '', price_total_lakhs: '', area_sqft: '', notes: '' })
      }
    } catch {
      setStatus({ ok: false, msg: 'Network error.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: '60px auto', padding: '0 24px' }}>
      <a href="/" style={{ color: 'var(--muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
        ← Back to app
      </a>
      <h2 style={{ color: 'var(--gold)', fontWeight: 800, margin: '20px 0 4px' }}>Admin — Upload Comparable</h2>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 28 }}>
        Add a verified comparable listing to the market dataset.
      </p>

      <div
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 14,
          padding: '28px 30px',
        }}
      >
        <form onSubmit={handleSubmit}>
          <label style={label}>Township</label>
          <input style={field} value={form.township} onChange={(e) => update('township', e.target.value)} required />

          <label style={label}>Property type</label>
          <input style={field} placeholder="e.g. apartment, house, land" value={form.property_type} onChange={(e) => update('property_type', e.target.value)} required />

          <label style={label}>Total price (lakhs)</label>
          <input style={field} type="number" min="0" step="0.01" value={form.price_total_lakhs} onChange={(e) => update('price_total_lakhs', e.target.value)} required />

          <label style={label}>Area (sqft)</label>
          <input style={field} type="number" min="1" step="0.01" value={form.area_sqft} onChange={(e) => update('area_sqft', e.target.value)} required />

          <label style={label}>Notes (optional)</label>
          <input style={field} value={form.notes} onChange={(e) => update('notes', e.target.value)} />

          {status && (
            <p
              style={{
                color: status.ok ? 'var(--good)' : 'var(--bad)',
                fontSize: '0.85rem',
                marginBottom: 12,
              }}
            >
              {status.msg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, var(--gold), #C8893A)',
              color: '#1A2420',
              border: 'none',
              borderRadius: 9,
              padding: '13px',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Uploading…' : 'Add Listing'}
          </button>
        </form>
      </div>
    </div>
  )
}
