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
      const imgW = pageW
      const imgH = (canvas.height * imgW) / canvas.width
      let heightLeft = imgH
      let position = 0

      pdf.addImage(canvas.toDataURL('image/jpeg', 0.85), 'JPEG', 0, position, imgW, imgH)
      heightLeft -= pageH

      while (heightLeft > 0) {
        position -= pageH
        pdf.addPage()
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.85), 'JPEG', 0, position, imgW, imgH)
        heightLeft -= pageH
      }

      const sig = result.extracted_signal
      const fileName = [sig?.township, sig?.property_type, 'YangonPrice'].filter(Boolean).join('-') + '.pdf'
      pdf.save(fileName)
      setStatus('done')
      setTimeout(() => setStatus('idle'), 4000)
    } catch (err) {
      console.error(err)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 4000)
    }
  }

  const sig = result.extracted_signal
  const pp = result.price_position
  const pig = result.pig_analysis
  const verdict = result.verdict ?? result.decision
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })

  const verdictColor: Record<string, string> = { BUY: '#fff', WAIT: '#1a2420', AVOID: '#fff' }
  const verdictBg: Record<string, string> = { BUY: '#16a34a', WAIT: '#D9A24B', AVOID: '#dc2626' }
  const positionLabel: Record<string, string> = { ABOVE: 'Above Market ↑', BELOW: 'Below Market ↓', AT_MARKET: 'At Market →', UNKNOWN: '—' }
  const positionColor: Record<string, string> = { ABOVE: '#dc2626', BELOW: '#16a34a', AT_MARKET: '#D9A24B', UNKNOWN: '#888' }
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

      {/* Hidden report captured by html2canvas */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
        <div ref={reportRef} style={{
          width: 794, background: '#fff', color: '#111',
          fontFamily: '"Helvetica Neue", Arial, sans-serif',
          boxSizing: 'border-box',
        }}>

          {/* Header */}
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
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #2E3B59' }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>
                {[sig?.township, sig?.property_type].filter(Boolean).join(' — ') || 'Property Analysis'}
              </div>
            </div>
          </div>

          {/* Verdict bar */}
          {verdict && (
            <div style={{
              background: verdictBg[verdict] ?? '#f3f4f6',
              padding: '14px 48px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.05em', color: verdictColor[verdict] ?? '#111' }}>
                  {verdict}
                </span>
                {result.investment_potential && (
                  <span style={{ fontSize: 12, color: verdictColor[verdict] ?? '#333', opacity: 0.8 }}>
                    · {result.investment_potential}
                  </span>
                )}
              </div>
              {pp?.position && pp.position !== 'UNKNOWN' && (
                <span style={{ fontSize: 12, fontWeight: 700, color: positionColor[pp.position] ?? '#333' }}>
                  {positionLabel[pp.position]}
                  {pp.delta_percent != null && ` ${pp.delta_percent > 0 ? '+' : ''}${pp.delta_percent}%`}
                </span>
              )}
            </div>
          )}

          <div style={{ padding: '32px 48px' }}>

            {/* Verdict reason */}
            {result.verdict_reason && (
              <div style={{ marginBottom: 24, padding: '14px 18px', background: '#FEFCE8', border: '1px solid #FDE68A', borderRadius: 6 }}>
                <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.8, margin: 0, color: '#1a2420' }}>{result.verdict_reason}</p>
              </div>
            )}

            {/* Price vs Market */}
            {pp && (pp.user_price_per_sqft_lakh != null || pp.market_avg_per_sqft_lakh != null) && (
              <Section title="Price vs Market">
                <div style={{ display: 'flex', gap: 16, marginBottom: pp.gap_narrative ? 12 : 0 }}>
                  {pp.user_price_per_sqft_lakh != null && (
                    <div style={{ flex: 1, background: '#f8f9fa', borderRadius: 6, padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#111' }}>{pp.user_price_per_sqft_lakh.toFixed(2)}</div>
                      <div style={{ fontSize: 10, color: '#888', marginTop: 3 }}>lakh/sqft (this property)</div>
                    </div>
                  )}
                  {pp.market_avg_per_sqft_lakh != null && (
                    <div style={{ flex: 1, background: '#f8f9fa', borderRadius: 6, padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#111' }}>{pp.market_avg_per_sqft_lakh.toFixed(2)}</div>
                      <div style={{ fontSize: 10, color: '#888', marginTop: 3 }}>lakh/sqft (market avg)</div>
                    </div>
                  )}
                  {pp.position && pp.position !== 'UNKNOWN' && (
                    <div style={{ flex: 1, background: pp.position === 'BELOW' ? '#dcfce7' : pp.position === 'ABOVE' ? '#fee2e2' : '#fef9c3', borderRadius: 6, padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: positionColor[pp.position] }}>
                        {pp.delta_percent != null ? `${pp.delta_percent > 0 ? '+' : ''}${pp.delta_percent}%` : '—'}
                      </div>
                      <div style={{ fontSize: 10, color: positionColor[pp.position], marginTop: 3 }}>{positionLabel[pp.position]}</div>
                    </div>
                  )}
                </div>
                {pp.gap_narrative && <p style={{ fontSize: 12, lineHeight: 1.8, margin: 0, color: '#222' }}>{pp.gap_narrative}</p>}
              </Section>
            )}

            {/* Market Summary */}
            {result.market_summary && (
              <Section title="Market Analysis">
                <p style={{ fontSize: 12, lineHeight: 1.9, margin: 0, color: '#222' }}>{result.market_summary}</p>
              </Section>
            )}

            {/* PIG³ */}
            {pig && (pig.policy || pig.institutions || pig.governance) && (
              <Section title="PIG³ Analysis">
                {[
                  { label: 'Policy', value: pig.policy },
                  { label: 'Institutions', value: pig.institutions },
                  { label: 'Governance', value: pig.governance },
                ].filter(r => r.value).map((row, i) => (
                  <div key={row.label} style={{ marginBottom: i < 2 ? 10 : 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: 4 }}>{row.label}</div>
                    <p style={{ fontSize: 12, lineHeight: 1.8, margin: 0, color: '#222' }}>{row.value}</p>
                  </div>
                ))}
              </Section>
            )}

            {/* Key Findings */}
            {result.key_findings?.filter(Boolean).length > 0 && (
              <Section title="Key Findings">
                {result.key_findings.slice(0, 5).map((f, i) => (
                  <div key={i} style={{ fontSize: 12, margin: '5px 0', lineHeight: 1.8, display: 'flex', gap: 8 }}>
                    <span style={{ color: '#D9A24B', flexShrink: 0 }}>●</span><span>{f}</span>
                  </div>
                ))}
              </Section>
            )}

            {/* Red Flags */}
            {result.red_flags?.filter(Boolean).length > 0 && (
              <Section title="Red Flags">
                {result.red_flags.slice(0, 4).map((r, i) => (
                  <div key={i} style={{ fontSize: 12, margin: '5px 0', lineHeight: 1.8, display: 'flex', gap: 8 }}>
                    <span style={{ color: '#dc2626', flexShrink: 0 }}>▲</span><span>{r}</span>
                  </div>
                ))}
              </Section>
            )}

            {/* Next Steps */}
            {(result.next_steps ?? result.suggested_next_steps)?.filter(Boolean).length > 0 && (
              <Section title="Next Steps">
                {(result.next_steps ?? result.suggested_next_steps ?? []).slice(0, 4).map((s, i) => (
                  <div key={i} style={{ fontSize: 12, margin: '5px 0', lineHeight: 1.8, display: 'flex', gap: 8 }}>
                    <span style={{ color: '#555', flexShrink: 0 }}>{i + 1}.</span><span>{s}</span>
                  </div>
                ))}
              </Section>
            )}

            {/* Listing Gaps footnote */}
            {result.listing_gaps && (
              <div style={{ marginTop: 8, padding: '10px 14px', background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: 4 }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: '#888', marginBottom: 4 }}>Note — Listing Gaps</div>
                <p style={{ fontSize: 11, color: '#666', lineHeight: 1.7, margin: 0 }}>{result.listing_gaps}</p>
              </div>
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
