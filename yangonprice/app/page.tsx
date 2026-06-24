'use client'

import { useState } from 'react'
import { UserButton } from '@clerk/nextjs'
import AnalysisForm from '@/components/AnalysisForm'
import AnalysisResult from '@/components/AnalysisResult'
import { AnalysisResponse } from '@/lib/types'

export default function HomePage() {
  const [result, setResult] = useState<AnalysisResponse | null>(null)
  const [loading, setLoading] = useState(false)

  return (
    <>
      <div
        style={{
          background: 'rgba(217,162,75,0.14)',
          borderBottom: '1px solid rgba(217,162,75,0.35)',
          color: '#E8C988',
          fontSize: '0.82rem',
          padding: '10px 24px',
          textAlign: 'center',
        }}
      >
        ⚠ <strong style={{ color: 'var(--gold)' }}>Demo</strong> — for review purposes. Analysis is AI-generated and not financial advice.
      </div>

      <header style={{ padding: '40px 0 30px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 28px', marginBottom: -30 }}>
          <UserButton afterSignOutUrl="/" />
        </div>
        <h1
          style={{
            margin: '0 0 6px',
            fontSize: '2.2rem',
            fontWeight: 800,
            letterSpacing: '-0.01em',
            color: 'var(--ink)',
          }}
        >
          Yangon<span style={{ color: 'var(--gold)' }}>Price</span>
        </h1>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '1rem' }}>
          Property Market Advisor
        </p>
      </header>

      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 28px 70px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'clamp(320px, 40%, 480px) 1fr',
            gap: 26,
            alignItems: 'start',
          }}
          className="two-col"
        >
          <AnalysisForm onResult={setResult} onLoading={setLoading} loading={loading} />

          {result ? (
            <AnalysisResult result={result} />
          ) : (
            <div
              style={{
                background: 'var(--panel)',
                border: '1px solid var(--line)',
                borderRadius: 14,
                padding: '28px 30px',
                minHeight: 420,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {loading ? (
                <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      border: '3px solid var(--line)',
                      borderTop: '3px solid var(--gold)',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      margin: '0 auto 16px',
                    }}
                  />
                  <p className="my" style={{ margin: 0, fontSize: '0.95rem' }}>
                    ခွဲခြမ်းစိတ်ဖြာနေသည်…
                  </p>
                </div>
              ) : (
                <p style={{ color: 'var(--muted)', textAlign: 'center', fontSize: '0.95rem' }}>
                  Paste a property listing on the left and click <strong>Get Advice</strong>.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <footer
        style={{
          textAlign: 'center',
          padding: '30px 0',
          color: 'var(--muted)',
          fontSize: '0.78rem',
          borderTop: '1px solid var(--line)',
        }}
      >
        YangonPrice · AI-generated analysis · not financial advice
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
