'use client'

import { useState, useRef } from 'react'
import { AnalysisResponse } from '@/lib/types'

interface Props { result: AnalysisResponse }

export default function PdfDownload({ result }: Props) {
  const [status, setStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle')
  const reportRef = useRef<HTMLDivElement>(null)

  async function handleDownload() {
    if (!reportRef.current) return
    setStatus('generating')
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ])

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const margin = 12
      const imgW = pageW - margin * 2
      const imgH = (canvas.height / canvas.width) * imgW

      let yOffset = 0
      let page = 0
      while (yOffset < imgH) {
        if (page > 0) pdf.addPage()
        const srcY = (yOffset / imgH) * canvas.height
        const sliceH = Math.min((pageH - margin * 2) / imgW * canvas.width, canvas.height - srcY)

        const sliceCanvas = document.createElement('canvas')
        sliceCanvas.width = canvas.width
        sliceCanvas.height = sliceH
        const ctx = sliceCanvas.getContext('2d')!
        ctx.drawImage(canvas, 0, srcY, canvas.width, sliceH, 0, 0, canvas.width, sliceH)

        pdf.addImage(sliceCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, margin, imgW, (sliceH / canvas.width) * imgW)
        yOffset += pageH - margin * 2
        page++
      }

      const date = new Date().toISOString().slice(0, 10)
      pdf.save(`YangonPrice_Report_${date}.pdf`)
      setStatus('done')
      setTimeout(() => setStatus('idle'), 4000)
    } catch (err) {
      console.error(err)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 4000)
    }
  }

  const ex = result.extracted_data
  const pa = result.price_analysis
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })

  const positionLabel: Record<string, string> = { ABOVE: 'Above Market', BELOW: 'Below Market', AVERAGE: 'At Market', UNKNOWN: '—' }
  const decisionColor: Record<string, string> = { BUY: '#166534', WAIT: '#92400e', AVOID: '#991b1b' }
  const decisionBg: Record<string, string> = { BUY: '#dcfce7', WAIT: '#fef9c3', AVOID: '#fee2e2' }

  return (
    <>
      {/* Download button */}
      <button
        onClick={handleDownload}
        disabled={status === 'generating'}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          margin: '18px auto 0',
          background: status === 'generating' ? 'rgba(100,100,100,0.2)' : 'var(--panel-raised)',
          border: '1px solid var(--line)',
          color: status === 'done' ? 'var(--good)' : 'var(--ink)',
          borderRadius: 9, padding: '11px 24px',
          fontWeight: 600, fontSize: '0.9rem',
          cursor: status === 'generating' ? 'wait' : 'pointer',
        }}
      >
        {status === 'generating' ? '⏳ Generating PDF…'
          : status === 'done' ? '✅ Report downloaded successfully'
          : status === 'error' ? '❌ Failed — try again'
          : '📄 Download Report'}
      </button>

      {/* Hidden report template — captured by html2canvas */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
        <div ref={reportRef} style={{
          width: 794, background: '#fff', color: '#111',
          fontFamily: 'Georgia, "Times New Roman", serif',
          padding: '52px 60px', boxSizing: 'border-box',
        }}>
          {/* Header */}
          <div style={{ borderBottom: '2px solid #111', paddingBottom: 16, marginBottom: 28 }}>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>YangonPrice</div>
            <div style={{ fontSize: 13, color: '#555', marginTop: 3 }}>Property Market Advice Report</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>Generated: {today}</div>
          </div>

          {/* 1. Property Summary */}
          <Section title="1. Property Summary">
            <Grid rows={[
              ['Township', ex?.township],
              ['Property Type', ex?.property_type],
              ['Location', ex?.location],
              ['Price', ex?.price_lakh != null ? `${ex.price_lakh.toLocaleString()} Lakh` : null],
              ['Land Size', ex?.land_size],
              ['Building Size', ex?.building_size_sqft != null ? `${ex.building_size_sqft.toLocaleString()} sqft` : null],
              ['Bedrooms', ex?.bedrooms?.toString()],
              ['Bathrooms', ex?.bathrooms?.toString()],
              ['Floors', ex?.floors?.toString()],
            ]} />
          </Section>

          {/* 2. Recommendation */}
          <Section title="2. Recommendation">
            {result.decision && (
              <span style={{
                display: 'inline-block', fontWeight: 800, fontSize: 15,
                padding: '5px 18px', borderRadius: 4, marginBottom: 12,
                background: decisionBg[result.decision] ?? '#f3f4f6',
                color: decisionColor[result.decision] ?? '#111',
              }}>
                {result.decision}
              </span>
            )}
            {result.investment_potential_reasoning && (
              <p style={{ fontSize: 12, lineHeight: 1.9, margin: '8px 0 0', color: '#222' }}>
                {result.investment_potential_reasoning}
              </p>
            )}
          </Section>

          {/* 3. Price Comparison */}
          <Section title="3. Price Comparison">
            <Grid rows={[
              ['Your Price (per sqft)', pa?.user_price_per_sqft_lakh != null ? `${pa.user_price_per_sqft_lakh.toFixed(2)} lakh/sqft` : null],
              ['Market Average (per sqft)', pa?.market_average_per_sqft_lakh != null ? `${pa.market_average_per_sqft_lakh.toFixed(2)} lakh/sqft` : null],
              ['Market Position', pa?.position ? positionLabel[pa.position] : null],
              ['Delta', pa?.delta_percent != null ? `${pa.delta_percent > 0 ? '+' : ''}${pa.delta_percent}%` : null],
            ]} />
          </Section>

          {/* 4. Key Risks */}
          {result.potential_risks?.filter(Boolean).length > 0 && (
            <Section title="4. Key Risks">
              {result.potential_risks.slice(0, 3).map((r, i) => (
                <p key={i} style={{ fontSize: 12, margin: '4px 0', lineHeight: 1.7 }}>• {r}</p>
              ))}
            </Section>
          )}

          {/* 5. Key Findings */}
          {result.key_findings?.filter(Boolean).length > 0 && (
            <Section title="5. Key Findings">
              {result.key_findings.slice(0, 4).map((f, i) => (
                <p key={i} style={{ fontSize: 12, margin: '4px 0', lineHeight: 1.7 }}>• {f}</p>
              ))}
            </Section>
          )}

          {/* Final Note */}
          <div style={{ marginTop: 32, padding: '14px 18px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 4 }}>
            <p style={{ fontSize: 10.5, color: '#555', lineHeight: 1.8, margin: 0 }}>
              This report is generated using publicly available property information and AI-assisted analysis. Users should independently verify ownership, legal status, engineering condition, and financial matters before making decisions.
            </p>
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid #ddd', marginTop: 32, paddingTop: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700 }}>YangonPrice</div>
            <div style={{ fontSize: 10, color: '#888', marginTop: 3 }}>Property Market Advice System — For informational purposes only.</div>
          </div>
        </div>
      </div>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#555', marginBottom: 10, borderBottom: '1px solid #e5e7eb', paddingBottom: 6 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Grid({ rows }: { rows: [string, string | null | undefined][] }) {
  const filtered = rows.filter(([, v]) => v)
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <tbody>
        {filtered.map(([label, value]) => (
          <tr key={label}>
            <td style={{ color: '#666', padding: '4px 0', width: '40%', verticalAlign: 'top' }}>{label}</td>
            <td style={{ color: '#111', fontWeight: 600, padding: '4px 0', verticalAlign: 'top' }}>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
