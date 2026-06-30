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

  const decisionColor: Record<string, string> = { BUY: '#fff', WAIT: '#1a2420', AVOID: '#fff' }
  const decisionBg: Record<string, string> = { BUY: '#16a34a', WAIT: '#D9A24B', AVOID: '#dc2626' }
  const positionLabel: Record<string, string> = { ABOVE: 'Above Market ↑', BELOW: 'Below Market ↓', AVERAGE: 'At Market →', UNKNOWN: '—' }
  const positionColor: Record<string, string> = { ABOVE: '#dc2626', BELOW: '#16a34a', AVERAGE: '#D9A24B', UNKNOWN: '#888' }
  const confidenceBg: Record<string, string> = { High: '#dcfce7', Medium: '#fef9c3', Low: '#fee2e2' }
  const confidenceColor: Record<string, string> = { High: '#166534', Medium: '#92400e', Low: '#991b1b' }

  return (
    <>
      <button
        onClick={handleDownload}
        disabled={status === 'generating'}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          margin: '0 auto',
          background: status === 'generating' ? 'rgba(100,100,100,0.2)' : 'var(--panel-raised)',
          border: '1px solid var(--line)',
          color: status === 'done' ? 'var(--good)' : 'var(--ink)',
          borderRadius: 9, padding: '11px 24px',
          fontWeight: 600, fontSize: '0.9rem',
          cursor: status === 'generating' ? 'wait' : 'pointer',
        }}
      >
        {status === 'generating' ? '⏳ Generating PDF…'
          : status === 'done' ? '✅ Downloaded'
          : status === 'error' ? '❌ Failed — try again'
          : '📄 Download Report'}
      </button>

      {/* Hidden report — captured by html2canvas */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
        <div ref={reportRef} style={{
          width: 794, background: '#fff', color: '#111',
          fontFamily: '"Helvetica Neue", Arial, sans-serif',
          boxSizing: 'border-box',
        }}>

          {/* Header banner */}
          <div style={{ background: '#121A2B', padding: '32px 48px 28px', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: '#fff' }}>
                  Yangon<span style={{ color: '#D9A24B' }}>Price</span>
                </div>
                <div style={{ fontSize: 11, color: '#8C97B5', marginTop: 3, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Property Market Intelligence Report
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#8C97B5' }}>{today}</div>
                {result.confidence && (
                  <span style={{
                    display: 'inline-block', marginTop: 6,
                    fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                    background: confidenceBg[result.confidence] ?? '#f3f4f6',
                    color: confidenceColor[result.confidence] ?? '#333',
                  }}>
                    {result.confidence} Confidence
                  </span>
                )}
              </div>
            </div>

            {/* Property title */}
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #2E3B59' }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>
                {[ex?.township, ex?.property_type].filter(Boolean).join(' — ') || 'Property Analysis'}
              </div>
              {ex?.location && <div style={{ fontSize: 12, color: '#8C97B5', marginTop: 4 }}>{ex.location}</div>}
            </div>
          </div>

          {/* Decision bar */}
          {result.decision && (
            <div style={{
              background: decisionBg[result.decision] ?? '#f3f4f6',
              padding: '14px 48px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  fontSize: 16, fontWeight: 800, letterSpacing: '0.05em',
                  color: decisionColor[result.decision] ?? '#111',
                }}>
                  {result.decision}
                </span>
                {result.investment_potential && (
                  <span style={{ fontSize: 12, color: decisionColor[result.decision] ?? '#333', opacity: 0.8 }}>
                    · {result.investment_potential}
                  </span>
                )}
              </div>
              {pa?.position && pa.position !== 'UNKNOWN' && (
                <span style={{ fontSize: 12, fontWeight: 700, color: positionColor[pa.position] ?? '#333' }}>
                  {positionLabel[pa.position]}
                  {pa.delta_percent != null && ` ${pa.delta_percent > 0 ? '+' : ''}${pa.delta_percent}%`}
                </span>
              )}
            </div>
          )}

          <div style={{ padding: '32px 48px' }}>

            {/* Property details */}
            <Section title="Property Details">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px' }}>
                {[
                  ['Township', ex?.township],
                  ['Type', ex?.property_type],
                  ['Price', ex?.price_lakh != null ? `${ex.price_lakh.toLocaleString()} Lakh` : null],
                  ['Land Size', ex?.land_size],
                  ['Building', ex?.building_size_sqft != null ? `${ex.building_size_sqft.toLocaleString()} sqft` : null],
                  ['Bedrooms', ex?.bedrooms?.toString()],
                  ['Bathrooms', ex?.bathrooms?.toString()],
                  ['Floors', ex?.floors?.toString()],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label as string} style={{ fontSize: 12, padding: '5px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <span style={{ color: '#888' }}>{label}  </span>
                    <strong style={{ color: '#111' }}>{value}</strong>
                  </div>
                ))}
              </div>
              {ex?.amenities?.length > 0 && (
                <div style={{ marginTop: 10, fontSize: 12 }}>
                  <span style={{ color: '#888' }}>Amenities  </span>
                  <span style={{ color: '#111' }}>{ex.amenities.join(', ')}</span>
                </div>
              )}
            </Section>

            {/* Price analysis */}
            {pa && (pa.user_price_per_sqft_lakh != null || pa.market_average_per_sqft_lakh != null) && (
              <Section title="Price Analysis">
                <div style={{ display: 'flex', gap: 16 }}>
                  {pa.user_price_per_sqft_lakh != null && (
                    <div style={{ flex: 1, background: '#f8f9fa', borderRadius: 6, padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#111' }}>{pa.user_price_per_sqft_lakh.toFixed(2)}</div>
                      <div style={{ fontSize: 10, color: '#888', marginTop: 3 }}>lakh / sqft (listing)</div>
                    </div>
                  )}
                  {pa.market_average_per_sqft_lakh != null && (
                    <div style={{ flex: 1, background: '#f8f9fa', borderRadius: 6, padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#111' }}>{pa.market_average_per_sqft_lakh.toFixed(2)}</div>
                      <div style={{ fontSize: 10, color: '#888', marginTop: 3 }}>lakh / sqft (market avg)</div>
                    </div>
                  )}
                  {pa.position && pa.position !== 'UNKNOWN' && (
                    <div style={{ flex: 1, background: pa.position === 'BELOW' ? '#dcfce7' : pa.position === 'ABOVE' ? '#fee2e2' : '#fef9c3', borderRadius: 6, padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: positionColor[pa.position] }}>
                        {pa.delta_percent != null ? `${pa.delta_percent > 0 ? '+' : ''}${pa.delta_percent}%` : '—'}
                      </div>
                      <div style={{ fontSize: 10, color: positionColor[pa.position], marginTop: 3 }}>{positionLabel[pa.position]}</div>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Investment reasoning */}
            {result.investment_potential_reasoning && (
              <Section title="Investment Assessment">
                <p style={{ fontSize: 12, lineHeight: 1.9, margin: 0, color: '#222' }}>
                  {result.investment_potential_reasoning}
                </p>
              </Section>
            )}

            {/* Two-column: strengths + risks */}
            {(result.potential_strengths?.filter(Boolean).length > 0 || result.potential_risks?.filter(Boolean).length > 0) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                {result.potential_strengths?.filter(Boolean).length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#16a34a', marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid #dcfce7' }}>
                      Strengths
                    </div>
                    {result.potential_strengths.slice(0, 4).map((s, i) => (
                      <div key={i} style={{ fontSize: 11, margin: '4px 0', lineHeight: 1.7, paddingLeft: 10, position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 0, color: '#16a34a' }}>▸</span>{s}
                      </div>
                    ))}
                  </div>
                )}
                {result.potential_risks?.filter(Boolean).length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#dc2626', marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid #fee2e2' }}>
                      Risks
                    </div>
                    {result.potential_risks.slice(0, 4).map((r, i) => (
                      <div key={i} style={{ fontSize: 11, margin: '4px 0', lineHeight: 1.7, paddingLeft: 10, position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 0, color: '#dc2626' }}>▸</span>{r}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Key findings */}
            {result.key_findings?.filter(Boolean).length > 0 && (
              <Section title="Key Findings">
                {result.key_findings.slice(0, 5).map((f, i) => (
                  <div key={i} style={{ fontSize: 12, margin: '5px 0', lineHeight: 1.8, display: 'flex', gap: 8 }}>
                    <span style={{ color: '#D9A24B', flexShrink: 0 }}>●</span><span>{f}</span>
                  </div>
                ))}
              </Section>
            )}

            {/* Next steps */}
            {result.suggested_next_steps?.filter(Boolean).length > 0 && (
              <Section title="Suggested Next Steps">
                {result.suggested_next_steps.slice(0, 4).map((s, i) => (
                  <div key={i} style={{ fontSize: 12, margin: '5px 0', lineHeight: 1.8, display: 'flex', gap: 8 }}>
                    <span style={{ color: '#555', flexShrink: 0 }}>{i + 1}.</span><span>{s}</span>
                  </div>
                ))}
              </Section>
            )}

            {/* Disclaimer */}
            <div style={{ marginTop: 16, padding: '12px 16px', background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: 4 }}>
              <p style={{ fontSize: 10, color: '#777', lineHeight: 1.8, margin: 0 }}>
                This report is AI-generated using information provided by the user. It does not constitute financial, legal, or investment advice. Users should independently verify ownership, legal status, physical condition, and all financial matters before making any property decisions. YangonPrice is not liable for decisions made based on this report.
              </p>
            </div>

          </div>

          {/* Footer */}
          <div style={{ background: '#121A2B', padding: '14px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#D9A24B' }}>YangonPrice</div>
            <div style={{ fontSize: 10, color: '#8C97B5' }}>AI-Generated · For informational purposes only · {today}</div>
          </div>
        </div>
      </div>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888', marginBottom: 10, paddingBottom: 5, borderBottom: '1px solid #e5e7eb' }}>
        {title}
      </div>
      {children}
    </div>
  )
}
