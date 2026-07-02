'use client'

import { useState } from 'react'
import AnalysisForm from '@/components/AnalysisForm'
import AnalysisResult from '@/components/AnalysisResult'
import { AnalysisResponse } from '@/lib/types'

export default function HomePage() {
  const [result, setResult] = useState<AnalysisResponse | null>(null)
  const [loading, setLoading] = useState(false)

  return (
    <>
      <div style={{ textAlign: 'center', padding: '18px 0 8px' }}>
        <p style={{ margin: '0 0 2px', color: 'var(--ink)', fontSize: '0.9rem', fontWeight: 600 }}>AI-Generated Property Analysis &amp; Market Insights</p>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 28px 70px' }}>
        <div className="two-col" style={{
          display: 'grid',
          gridTemplateColumns: 'clamp(320px, 38%, 460px) 1fr',
          gap: 26,
          alignItems: 'start',
        }}>
          <AnalysisForm onResult={setResult} onLoading={setLoading} loading={loading} />

          {result ? (
            <div>
              <AnalysisResult result={result} />
              <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 16, textAlign: 'center' }}>
                AI-Generated Analysis — Not Financial, Legal, or Investment Advice
              </p>
            </div>
          ) : (
            <div style={{
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 14,
              padding: '28px 30px',
              minHeight: 460,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
            }}>
              {loading ? (
                <>
                  <div style={{
                    width: 40, height: 40,
                    border: '3px solid var(--line)',
                    borderTop: '3px solid var(--gold)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  <p className="my" style={{ margin: 0, color: 'var(--muted)', fontSize: '0.95rem' }}>
                    ခွဲခြမ်းစိတ်ဖြာနေသည်…
                  </p>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '2rem', opacity: 0.3 }}>🏢</div>
                  <p style={{ color: 'var(--muted)', textAlign: 'center', fontSize: '0.95rem', margin: 0, maxWidth: 280 }}>
                    Paste a property listing on the left and click <strong style={{ color: 'var(--ink)' }}>Analyze Property</strong> to get a full market intelligence report.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <footer style={{
        textAlign: 'center',
        padding: '24px 28px',
        color: 'var(--muted)',
        fontSize: '0.78rem',
        borderTop: '1px solid var(--line)',
        lineHeight: 1.7,
        maxWidth: 700,
        margin: '0 auto',
      }}>
        Property Market Advisor provides AI-generated property intelligence based on information supplied by users. Users should independently verify all information and consult qualified professionals before making financial, legal, or investment decisions.
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 880px) {
          .two-col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}
