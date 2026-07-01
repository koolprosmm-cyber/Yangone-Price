import { AnalysisResponse } from '@/lib/types'
import DecisionPill from './DecisionPill'
import PdfDownload from './PdfDownload'

const sectionLabel: React.CSSProperties = {
  fontSize: '0.75rem',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  color: 'var(--muted)',
  fontWeight: 700,
  margin: '0 0 10px',
}

const card: React.CSSProperties = {
  background: 'var(--panel-raised)',
  border: '1px solid var(--line)',
  borderRadius: 10,
  padding: '16px 20px',
  marginBottom: 22,
}

const confidenceColors: Record<string, string> = {
  High: 'var(--good)',
  Medium: 'var(--gold)',
  Low: 'var(--bad)',
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p style={sectionLabel}>{children}</p>
}

function BulletList({ items, color = 'var(--gold)' }: { items: string[]; color?: string }) {
  const filtered = (items ?? []).filter(Boolean)
  if (!filtered.length) return null
  return (
    <div>
      {filtered.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderTop: i === 0 ? 'none' : '1px solid var(--line)', fontSize: '0.92rem' }}>
          <span style={{ color, flexShrink: 0 }}>●</span>
          <span className="my">{item}</span>
        </div>
      ))}
    </div>
  )
}

interface Props { result: AnalysisResponse }

export default function AnalysisResult({ result }: Props) {
  const sig = result.extracted_signal
  const pp = result.price_position
  const pig = result.pig_analysis
  const verdict = result.verdict ?? (result.decision as string | undefined)

  return (
    <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 14, padding: '28px 30px' }}>

      {/* ── Verdict ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 22 }}>
        {verdict && <DecisionPill decision={verdict} />}
        {result.investment_potential && <DecisionPill potential={result.investment_potential} />}
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 4 }}>Confidence</div>
          <span style={{
            fontWeight: 700, fontSize: '0.88rem', padding: '4px 14px', borderRadius: 20,
            color: confidenceColors[result.confidence] ?? 'var(--muted)',
            background: result.confidence === 'High' ? 'var(--good-soft)' : result.confidence === 'Low' ? 'var(--bad-soft)' : 'var(--gold-soft)',
            border: `1px solid ${confidenceColors[result.confidence] ?? 'var(--line)'}`,
          }}>
            {result.confidence}
          </span>
        </div>
      </div>

      {/* ── Verdict Reason ── */}
      {result.verdict_reason && (
        <div style={{ ...card, background: 'var(--gold-soft)', border: '1px solid rgba(217,162,75,0.35)', marginBottom: 22 }}>
          <p className="my" style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.8 }}>
            {result.verdict_reason}
          </p>
        </div>
      )}

      {/* ── Price Position ── */}
      {pp && (pp.user_price_per_sqft_lakh != null || pp.market_avg_per_sqft_lakh != null) && (
        <>
          <SectionLabel>Price vs Market</SectionLabel>
          <div style={card}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', marginBottom: 12 }}>
              {pp.user_price_per_sqft_lakh != null && (
                <div style={{ fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--muted)' }}>This property: </span>
                  <strong>{pp.user_price_per_sqft_lakh.toFixed(2)} lakh/sqft</strong>
                </div>
              )}
              {pp.market_avg_per_sqft_lakh != null && (
                <div style={{ fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--muted)' }}>Market avg: </span>
                  <strong>{pp.market_avg_per_sqft_lakh.toFixed(2)} lakh/sqft</strong>
                </div>
              )}
            </div>
            {pp.position && pp.position !== 'UNKNOWN' && (
              <span style={{
                fontSize: '0.82rem', fontWeight: 700, padding: '5px 14px', borderRadius: 8,
                background: pp.position === 'ABOVE' ? 'var(--bad-soft)' : pp.position === 'BELOW' ? 'var(--good-soft)' : 'var(--gold-soft)',
                color: pp.position === 'ABOVE' ? 'var(--bad)' : pp.position === 'BELOW' ? 'var(--good)' : 'var(--gold)',
              }}>
                {pp.position === 'ABOVE' ? 'Above market' : pp.position === 'BELOW' ? 'Below market' : 'At market'}
                {pp.delta_percent != null && ` · ${pp.delta_percent > 0 ? '+' : ''}${pp.delta_percent}%`}
              </span>
            )}
            {pp.gap_narrative && (
              <p className="my" style={{ margin: '10px 0 0', fontSize: '0.88rem', lineHeight: 1.8, color: 'var(--ink)' }}>
                {pp.gap_narrative}
              </p>
            )}
          </div>
        </>
      )}

      {/* ── Market Summary ── */}
      {result.market_summary && (
        <div style={{ marginBottom: 22 }}>
          <SectionLabel>Market Analysis</SectionLabel>
          <div className="my" style={{ ...card, fontSize: '0.95rem', lineHeight: 1.9, marginBottom: 0 }}>
            {result.market_summary}
          </div>
        </div>
      )}

      {/* ── PIG³ Analysis ── */}
      {pig && (pig.policy || pig.institutions || pig.governance) && (
        <>
          <SectionLabel>PIG³ Analysis</SectionLabel>
          <div style={card}>
            {[
              { label: 'Policy', value: pig.policy, color: 'var(--gold)' },
              { label: 'Institutions', value: pig.institutions, color: 'var(--good)' },
              { label: 'Governance', value: pig.governance, color: 'var(--bad)' },
            ].filter(r => r.value).map((row, i) => (
              <div key={row.label} style={{ padding: '10px 0', borderTop: i === 0 ? 'none' : '1px solid var(--line)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: row.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  {row.label}
                </div>
                <p className="my" style={{ margin: 0, fontSize: '0.9rem', color: 'var(--ink)', lineHeight: 1.8 }}>{row.value}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Key Findings ── */}
      {result.key_findings?.filter(Boolean).length > 0 && (
        <>
          <SectionLabel>Key Findings</SectionLabel>
          <div style={{ ...card, paddingTop: 10, paddingBottom: 10 }}>
            <BulletList items={result.key_findings} color="var(--gold)" />
          </div>
        </>
      )}

      {/* ── Red Flags ── */}
      {result.red_flags?.filter(Boolean).length > 0 && (
        <>
          <SectionLabel>Red Flags</SectionLabel>
          <div style={{ ...card, paddingTop: 10, paddingBottom: 10, border: '1px solid rgba(226,100,90,0.3)' }}>
            <BulletList items={result.red_flags} color="var(--bad)" />
          </div>
        </>
      )}

      {/* ── Next Steps ── */}
      {(result.next_steps ?? result.suggested_next_steps)?.filter(Boolean).length > 0 && (
        <>
          <SectionLabel>Next Steps</SectionLabel>
          <div style={{ ...card, paddingTop: 10, paddingBottom: 10 }}>
            <BulletList items={result.next_steps ?? result.suggested_next_steps ?? []} color="var(--good)" />
          </div>
        </>
      )}

      {/* ── Listing Gaps (footnote) ── */}
      {result.listing_gaps && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--panel-raised)', borderRadius: 8, border: '1px solid var(--line)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Note — Listing Gaps
          </div>
          <p className="my" style={{ margin: 0, fontSize: '0.83rem', color: 'var(--muted)', lineHeight: 1.7 }}>{result.listing_gaps}</p>
        </div>
      )}

      {/* ── Confidence ── */}
      {(result.confidence_reason ?? result.confidence_explanation) && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--panel-raised)', borderRadius: 8, border: '1px solid var(--line)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Confidence
          </div>
          <p className="my" style={{ margin: 0, fontSize: '0.83rem', color: 'var(--ink)', lineHeight: 1.7 }}>
            {result.confidence_reason ?? result.confidence_explanation}
          </p>
        </div>
      )}

      {/* ── Signal bar (township / type / price) ── */}
      {sig && (sig.township || sig.property_type || sig.price_lakh) && (
        <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: '6px 16px', fontSize: '0.78rem', color: 'var(--muted)' }}>
          {sig.township && <span>📍 {sig.township}</span>}
          {sig.property_type && <span>🏠 {sig.property_type}</span>}
          {sig.price_lakh && <span>💰 {sig.price_lakh} သိန်း</span>}
          {sig.size_sqft && <span>📐 {sig.size_sqft} sqft</span>}
        </div>
      )}

      {/* ── Trust Metadata Bar ── */}
      {result.trust_metadata && (
        <div style={{
          marginTop: 8, padding: '10px 14px',
          background: 'rgba(217,162,75,0.06)', borderRadius: 8,
          border: '1px solid rgba(217,162,75,0.2)',
          display: 'flex', flexWrap: 'wrap', gap: '6px 20px',
        }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', width: '100%' }}>
            Report Intelligence
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>🤖 {result.trust_metadata.aiModel}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>📚 KB v{result.trust_metadata.knowledgeBaseVersion}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>📊 {result.trust_metadata.dataFreshnessSummary}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>🕐 {new Date(result.trust_metadata.generatedAt).toLocaleString()}</span>
        </div>
      )}

      {/* ── PDF Download ── */}
      <div style={{ borderTop: '1px solid var(--line)', marginTop: 24, paddingTop: 20, textAlign: 'center' }}>
        <PdfDownload result={result} />
      </div>
    </div>
  )
}
