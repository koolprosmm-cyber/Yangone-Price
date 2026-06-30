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
    <div className="my">
      {filtered.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderTop: i === 0 ? 'none' : '1px solid var(--line)', fontSize: '0.92rem' }}>
          <span style={{ color, flexShrink: 0 }}>●</span>
          <span>{item}</span>
        </div>
      ))}
    </div>
  )
}

function Stars({ value, color }: { value: number; color: string }) {
  const v = Math.max(1, Math.min(5, Math.round(value ?? 0)))
  return (
    <span style={{ fontSize: '1rem', letterSpacing: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < v ? color : 'var(--line)' }}>★</span>
      ))}
    </span>
  )
}

interface Props { result: AnalysisResponse }

export default function AnalysisResult({ result }: Props) {
  const ex = result.extracted_data
  const isSeller = result.mode === 'seller'
  const ps = result.pig_score
  const eu = result.evidence_used

  return (
    <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 14, padding: '28px 30px' }}>

      {/* ── Property Snapshot ── */}
      <SectionLabel>Property Snapshot</SectionLabel>
      <div style={{ ...card, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px' }}>
        {[
          { k: 'Township', v: ex?.township },
          { k: 'Location', v: ex?.location },
          { k: 'Type', v: ex?.property_type },
          { k: 'Price', v: ex?.price_lakh ? `${ex.price_lakh} Lakh` : undefined },
          { k: 'Land Size', v: ex?.land_size },
          { k: 'Building', v: ex?.building_size_sqft ? `${ex.building_size_sqft} sqft` : undefined },
          { k: 'Bedrooms', v: ex?.bedrooms },
          { k: 'Bathrooms', v: ex?.bathrooms },
          { k: 'Floors', v: ex?.floors },
        ].filter(r => r.v).map(row => (
          <div key={row.k} style={{ fontSize: '0.88rem' }}>
            <span style={{ color: 'var(--muted)' }}>{row.k}: </span>
            <strong style={{ color: 'var(--ink)' }}>{row.v}</strong>
          </div>
        ))}
        {ex?.amenities?.length > 0 && (
          <div style={{ gridColumn: '1 / -1', fontSize: '0.85rem', marginTop: 4 }}>
            <span style={{ color: 'var(--muted)' }}>Amenities: </span>
            <span style={{ color: 'var(--ink)' }}>{ex.amenities.join(', ')}</span>
          </div>
        )}
        {ex?.special_features?.length > 0 && (
          <div style={{ gridColumn: '1 / -1', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--muted)' }}>Features: </span>
            <span style={{ color: 'var(--ink)' }}>{ex.special_features.join(', ')}</span>
          </div>
        )}
        {ex?.missing_fields_note && (
          <div style={{ gridColumn: '1 / -1', fontSize: '0.8rem', color: 'var(--bad)', marginTop: 4 }}>
            ⚠ {ex.missing_fields_note}
          </div>
        )}
      </div>

      {/* ── Decision + Confidence ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 22 }}>
        {result.decision && <DecisionPill decision={result.decision} />}
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

      {/* ── Price Analysis ── */}
      {result.price_analysis && (result.price_analysis.user_price_per_sqft_lakh != null || result.price_analysis.market_average_per_sqft_lakh != null) && (
        <>
          <SectionLabel>Price Analysis</SectionLabel>
          <div style={card}>
            {[
              { label: 'Your price (per sqft)', value: result.price_analysis.user_price_per_sqft_lakh != null ? `${result.price_analysis.user_price_per_sqft_lakh.toFixed(2)} lakh/sqft` : null },
              { label: 'Market average (per sqft)', value: result.price_analysis.market_average_per_sqft_lakh != null ? `${result.price_analysis.market_average_per_sqft_lakh.toFixed(2)} lakh/sqft` : null },
            ].filter(r => r.value).map((row, i) => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderTop: i === 0 ? 'none' : '1px solid var(--line)', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--muted)' }}>{row.label}</span>
                <span style={{ fontWeight: 700 }}>{row.value}</span>
              </div>
            ))}
            {result.price_analysis.position && result.price_analysis.position !== 'UNKNOWN' && (
              <div style={{ marginTop: 12 }}>
                <span style={{
                  fontSize: '0.82rem', fontWeight: 700, padding: '5px 14px', borderRadius: 8,
                  background: result.price_analysis.position === 'ABOVE' ? 'var(--bad-soft)' : result.price_analysis.position === 'BELOW' ? 'var(--good-soft)' : 'var(--gold-soft)',
                  color: result.price_analysis.position === 'ABOVE' ? 'var(--bad)' : result.price_analysis.position === 'BELOW' ? 'var(--good)' : 'var(--gold)',
                }}>
                  {result.price_analysis.position === 'ABOVE' ? 'Above market' : result.price_analysis.position === 'BELOW' ? 'Below market' : 'At market'}
                  {result.price_analysis.delta_percent != null && ` · ${result.price_analysis.delta_percent > 0 ? '+' : ''}${result.price_analysis.delta_percent}%`}
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Market Intelligence ── */}
      {result.market_intelligence && (
        <div style={{ marginBottom: 22 }}>
          <SectionLabel>Market Intelligence</SectionLabel>
          <div className="my" style={{ ...card, fontSize: '0.95rem', lineHeight: 1.9, marginBottom: 0 }}>
            {result.market_intelligence}
          </div>
        </div>
      )}

      {/* ── Property Intelligence ── */}
      {result.property_intelligence && (
        <div style={{ marginBottom: 22 }}>
          <SectionLabel>Property Intelligence</SectionLabel>
          <div className="my" style={{ ...card, fontSize: '0.95rem', lineHeight: 1.9, marginBottom: 0 }}>
            {result.property_intelligence}
          </div>
        </div>
      )}

      {/* ── PIG Score ── */}
      {ps && (
        <>
          <SectionLabel>PIG Score</SectionLabel>
          <div style={{ ...card }}>
            {[
              { label: 'Property Completeness', value: ps.property_completeness, reason: ps.property_completeness_reason, color: 'var(--gold)' },
              { label: 'Market Confidence', value: ps.market_confidence, reason: ps.market_confidence_reason, color: 'var(--good)' },
              { label: 'Investment Potential', value: ps.investment_potential_score, reason: ps.investment_potential_reason, color: 'var(--good)' },
              { label: 'Risk Level', value: ps.risk_level, reason: ps.risk_level_reason, color: 'var(--bad)' },
            ].map((row, i) => (
              <div key={row.label} style={{ padding: '10px 0', borderTop: i === 0 ? 'none' : '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>{row.label}</span>
                  <Stars value={row.value} color={row.color} />
                </div>
                {row.reason && (
                  <p className="my" style={{ margin: 0, fontSize: '0.82rem', color: 'var(--ink)', lineHeight: 1.7 }}>{row.reason}</p>
                )}
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

      {/* ── Strengths & Risks ── */}
      {result.potential_strengths?.filter(Boolean).length > 0 && (
        <>
          <SectionLabel>{isSeller ? 'Selling Points' : 'Strengths'}</SectionLabel>
          <div style={{ ...card, paddingTop: 10, paddingBottom: 10 }}>
            <BulletList items={result.potential_strengths} color="var(--good)" />
          </div>
        </>
      )}

      {result.potential_risks?.filter(Boolean).length > 0 && (
        <>
          <SectionLabel>{isSeller ? 'Buyer Objections / Deal Risks' : 'Risks & Considerations'}</SectionLabel>
          <div style={{ ...card, paddingTop: 10, paddingBottom: 10 }}>
            <BulletList items={result.potential_risks} color="var(--bad)" />
          </div>
        </>
      )}

      {/* ── Investment / Sale Potential ── */}
      {result.investment_potential_reasoning && (
        <div style={{ marginBottom: 22 }}>
          <SectionLabel>{isSeller ? 'Sale Potential Assessment' : 'Investment Potential'}</SectionLabel>
          <div className="my" style={{
            background: result.investment_potential === 'Strong Potential' ? 'var(--good-soft)' : result.investment_potential === 'Limited Potential' ? 'var(--bad-soft)' : 'var(--gold-soft)',
            border: `1px solid ${result.investment_potential === 'Strong Potential' ? 'rgba(95,190,140,0.4)' : result.investment_potential === 'Limited Potential' ? 'rgba(226,100,90,0.4)' : 'rgba(217,162,75,0.4)'}`,
            borderRadius: 10, padding: '16px 20px', fontSize: '0.95rem', lineHeight: 1.9,
          }}>
            {result.investment_potential_reasoning}
          </div>
        </div>
      )}

      {/* ── Evidence Used ── */}
      {eu && (
        <>
          <SectionLabel>Evidence Used</SectionLabel>
          <div style={card}>
            {[
              { label: '✓ User Listing', items: eu.from_listing, color: 'var(--good)' },
              { label: '✓ Market Database', items: eu.from_market_database, color: 'var(--gold)' },
              { label: '✓ General Property Knowledge', items: eu.from_general_knowledge, color: 'var(--muted)' },
              { label: '✓ AI Analysis', items: eu.from_ai_reasoning, color: 'var(--muted)' },
            ].filter(s => s.items?.filter(Boolean).length > 0).map((source, si) => (
              <div key={source.label} style={{ marginBottom: si < 3 ? 14 : 0 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: source.color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {source.label}
                </div>
                {source.items.filter(Boolean).map((item, i) => (
                  <p key={i} className="my" style={{ margin: '0 0 4px', fontSize: '0.85rem', color: 'var(--ink)', lineHeight: 1.7 }}>
                    • {item}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Missing Info + Questions ── */}
      {result.missing_information?.filter(Boolean).length > 0 && (
        <>
          <SectionLabel>Missing Information</SectionLabel>
          <div style={{ ...card, paddingTop: 10, paddingBottom: 10 }}>
            <BulletList items={result.missing_information} color="var(--muted)" />
          </div>
        </>
      )}

      {result.questions_to_verify?.filter(Boolean).length > 0 && (
        <>
          <SectionLabel>Questions Requiring Verification</SectionLabel>
          <div style={{ ...card, paddingTop: 10, paddingBottom: 10 }}>
            <BulletList items={result.questions_to_verify} color="var(--gold)" />
          </div>
        </>
      )}

      {/* ── Suggested Next Steps ── */}
      {result.suggested_next_steps?.filter(Boolean).length > 0 && (
        <>
          <SectionLabel>Suggested Next Steps</SectionLabel>
          <div style={{ ...card, paddingTop: 10, paddingBottom: 10 }}>
            <BulletList items={result.suggested_next_steps} color="var(--good)" />
          </div>
        </>
      )}

      {/* ── Confidence Statement ── */}
      {result.confidence_explanation && (
        <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--panel-raised)', borderRadius: 10, border: '1px solid var(--line)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Confidence Statement
          </div>
          <p className="my" style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink)', lineHeight: 1.7 }}>{result.confidence_explanation}</p>
        </div>
      )}

      {result.method_note && (
        <p className="my" style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: '0 0 16px', lineHeight: 1.7 }}>
          {result.method_note}
        </p>
      )}

      {/* ── PDF Download ── */}
      <div style={{ borderTop: '1px solid var(--line)', marginTop: 24, paddingTop: 20, textAlign: 'center' }}>
        <PdfDownload result={result} />
      </div>
    </div>
  )
}
