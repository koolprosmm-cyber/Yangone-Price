import { AnalysisResponse } from '@/lib/types'
import DecisionPill from './DecisionPill'
import ExtractedChips from './ExtractedChips'

const sectionLabel: React.CSSProperties = {
  fontSize: '0.82rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--muted)',
  margin: '0 0 10px',
  fontWeight: 700,
}

const dataCard: React.CSSProperties = {
  background: 'var(--panel-raised)',
  border: '1px solid var(--line)',
  borderRadius: 10,
  padding: '18px 20px',
  marginBottom: 26,
}

const positionColors: Record<string, string> = {
  ABOVE: 'var(--bad)',
  BELOW: 'var(--good)',
  AVERAGE: 'var(--gold)',
  UNKNOWN: 'var(--muted)',
}

const positionBg: Record<string, string> = {
  ABOVE: 'var(--bad-soft)',
  BELOW: 'var(--good-soft)',
  AVERAGE: 'var(--gold-soft)',
  UNKNOWN: 'rgba(140,151,181,0.12)',
}

const positionLabel: Record<string, string> = {
  ABOVE: 'Above average',
  BELOW: 'Below average',
  AVERAGE: 'At average',
  UNKNOWN: 'Unknown',
}

interface Props {
  result: AnalysisResponse
}

export default function AnalysisResult({ result }: Props) {
  const pos = result.price_analysis?.position ?? 'UNKNOWN'

  return (
    <div
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        padding: '28px 30px',
      }}
    >
      <p style={{ ...sectionLabel, marginBottom: 18 }}>Recommendation</p>

      {result.extracted_data && <ExtractedChips data={result.extracted_data} />}

      <DecisionPill decision={result.decision} />

      {result.property_summary && (
        <div style={{ marginBottom: 26 }}>
          <p className="my" style={{ margin: 0, fontSize: '0.96rem' }}>
            {result.property_summary}
          </p>
        </div>
      )}

      {result.price_analysis && (
        <>
          <p style={sectionLabel}>Price Comparison</p>
          <div style={dataCard}>
            {[
              { label: 'Asking price (total)', value: result.price_analysis.user_price_total },
              { label: 'Converted to per-sqft', value: result.price_analysis.user_price_per_sqft },
              { label: 'Township average', value: result.price_analysis.market_average_per_sqft },
            ].map((row) => (
              <div
                key={row.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '7px 0',
                  borderTop: '1px solid var(--line)',
                  fontSize: '0.9rem',
                }}
              >
                <span style={{ color: 'var(--muted)' }}>{row.label}</span>
                <span style={{ fontWeight: 700 }}>{row.value || '—'}</span>
              </div>
            ))}
            <span
              style={{
                display: 'inline-block',
                marginTop: 12,
                fontSize: '0.8rem',
                fontWeight: 700,
                padding: '5px 12px',
                borderRadius: 6,
                background: positionBg[pos],
                color: positionColors[pos],
              }}
            >
              {positionLabel[pos]}
            </span>
            {result.price_analysis.explanation && (
              <p className="my" style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '10px 0 0' }}>
                {result.price_analysis.explanation}
              </p>
            )}
          </div>
        </>
      )}

      {result.comparison && result.comparison.similar_properties_found > 0 && (
        <>
          <p style={sectionLabel}>Property Comparison</p>
          <div
            style={{
              display: 'flex',
              gap: 26,
              flexWrap: 'wrap',
              alignItems: 'center',
              background: 'var(--panel-raised)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              padding: '16px 20px',
              marginBottom: 26,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--gold)' }}>
                {result.comparison.similar_properties_found}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>similar listings</div>
            </div>
            {result.comparison.township_average_per_sqft && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--gold)' }}>
                  {result.comparison.township_average_per_sqft}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>avg lakhs/sqft</div>
              </div>
            )}
            {result.comparison.notes && (
              <p
                className="my"
                style={{ flex: 1, minWidth: 200, fontSize: '0.86rem', color: 'var(--muted)', margin: 0 }}
              >
                {result.comparison.notes}
              </p>
            )}
          </div>
        </>
      )}

      {result.considerations && (
        <div style={{ marginBottom: 26 }}>
          <p className="my" style={{ margin: 0, fontSize: '0.95rem' }}>
            {result.considerations}
          </p>
        </div>
      )}

      {result.risk_assessment && result.risk_assessment.filter(Boolean).length > 0 && (
        <>
          <p style={sectionLabel}>Risks</p>
          <div style={{ marginBottom: 26 }} className="my">
            {result.risk_assessment.filter(Boolean).map((risk, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 10,
                  padding: '10px 0',
                  borderTop: i === 0 ? 'none' : '1px solid var(--line)',
                  fontSize: '0.92rem',
                }}
              >
                <span style={{ color: 'var(--gold)', flexShrink: 0 }}>●</span>
                <span>{risk}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {result.recommendation && (
        <>
          <p style={sectionLabel}>Recommendation</p>
          <div
            className="my"
            style={{
              background: result.decision === 'BUY' ? 'var(--good-soft)' : result.decision === 'AVOID' ? 'var(--bad-soft)' : 'var(--gold-soft)',
              border: `1px solid ${result.decision === 'BUY' ? 'rgba(95,190,140,0.4)' : result.decision === 'AVOID' ? 'rgba(226,100,90,0.4)' : 'rgba(217,162,75,0.4)'}`,
              borderRadius: 10,
              padding: '18px 20px',
              fontSize: '0.95rem',
              marginBottom: 22,
            }}
          >
            {result.recommendation}
          </div>
        </>
      )}

      {result.method_note && (
        <p className="my" style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 16 }}>
          {result.method_note}
        </p>
      )}

      <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: 0 }}>
        Confidence —{' '}
        <strong style={{ color: 'var(--ink)' }}>{result.confidence} / 100</strong>
      </p>
    </div>
  )
}
