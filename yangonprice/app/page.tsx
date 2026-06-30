'use client'

import { useState, useEffect } from 'react'
import AnalysisForm from '@/components/AnalysisForm'
import AnalysisResult from '@/components/AnalysisResult'
import { AnalysisResponse } from '@/lib/types'

const HISTORY_KEY = 'yp_history'
const MAX_HISTORY = 5

interface HistoryEntry {
  id: string
  ts: number
  township: string
  property_type: string
  price_lakh: number | null
  result: AnalysisResponse
}

function loadHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') } catch { return [] }
}

function deleteFromHistory(id: string) {
  const prev = loadHistory().filter(h => h.id !== id)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(prev))
}

function saveToHistory(result: AnalysisResponse) {
  const ex = result.extracted_data
  const entry: HistoryEntry = {
    id: Date.now().toString(),
    ts: Date.now(),
    township: ex?.township ?? '',
    property_type: ex?.property_type ?? '',
    price_lakh: ex?.price_lakh ?? null,
    result,
  }
  const prev = loadHistory().filter(h => h.id !== entry.id)
  localStorage.setItem(HISTORY_KEY, JSON.stringify([entry, ...prev].slice(0, MAX_HISTORY)))
}

const decisionColor: Record<string, string> = { BUY: 'var(--good)', WAIT: 'var(--gold)', AVOID: 'var(--bad)' }

export default function HomePage() {
  const [result, setResult] = useState<AnalysisResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])

  useEffect(() => { setHistory(loadHistory()) }, [])

  function handleDelete(id: string) {
    deleteFromHistory(id)
    setHistory(loadHistory())
  }

  const [formKey, setFormKey] = useState(0)

  function handleResult(r: AnalysisResponse) {
    setResult(r)
    saveToHistory(r)
    setHistory(loadHistory())
  }

  function handleNewAnalysis() {
    setResult(null)
    setFormKey(k => k + 1)
  }

  return (
    <>
      <div style={{ textAlign: 'center', padding: '14px 16px 6px' }}>
        <p style={{ margin: 0, color: 'var(--ink)', fontSize: '0.88rem', fontWeight: 600 }}>
          AI-Generated Property Analysis &amp; Market Insights
        </p>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 16px 70px' }}>
        <div className="main-grid">
          {/* Left col */}
          <div>
            <AnalysisForm key={formKey} onResult={handleResult} onLoading={setLoading} loading={loading} />

            {/* History */}
            {history.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', fontWeight: 700, margin: '0 0 10px' }}>
                  Recent Analyses
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {history.map(h => (
                    <button
                      key={h.id}
                      onClick={() => setResult(h.result)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: result === h.result ? 'var(--gold-soft)' : 'var(--panel)',
                        border: `1px solid ${result === h.result ? 'rgba(217,162,75,0.4)' : 'var(--line)'}`,
                        borderRadius: 8, padding: '9px 14px', cursor: 'pointer', textAlign: 'left', gap: 10,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)' }}>
                          {[h.township, h.property_type].filter(Boolean).join(' · ') || 'Property'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 1 }}>
                          {h.price_lakh != null ? `${h.price_lakh.toLocaleString()} Lakh · ` : ''}
                          {new Date(h.ts).toLocaleDateString()}
                        </div>
                      </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        {h.result.decision && (
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: decisionColor[h.result.decision] ?? 'var(--muted)' }}>
                            {h.result.decision}
                          </span>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(h.id) }}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--muted)', fontSize: '0.85rem', padding: '2px 4px',
                            lineHeight: 1, borderRadius: 4,
                          }}
                          title="Delete"
                        >✕</button>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right col */}
          <div>
            {result ? (
              <div>
                <button
                  onClick={handleNewAnalysis}
                  style={{
                    width: '100%', marginBottom: 12, padding: '10px',
                    background: 'var(--panel-raised)', border: '1px solid var(--line)',
                    borderRadius: 9, color: 'var(--muted)', fontWeight: 600,
                    fontSize: '0.88rem', cursor: 'pointer',
                  }}
                >
                  ← အိမ်ခြံမြေသစ် ဆန်းစစ်မည်
                </button>
                <AnalysisResult result={result} />
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 14, textAlign: 'center' }}>
                  AI-Generated Analysis — Not Financial, Legal, or Investment Advice
                </p>
              </div>
            ) : (
              <div style={{
                background: 'var(--panel)',
                border: '1px solid var(--line)',
                borderRadius: 14,
                padding: '28px 24px',
                minHeight: 400,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
              }}>
                  <>
                    <div style={{ fontSize: '2rem', opacity: 0.25 }}>🏢</div>
                    <p style={{ color: 'var(--muted)', textAlign: 'center', fontSize: '0.88rem', margin: 0, maxWidth: 260, lineHeight: 1.7 }}>
                      Paste a property listing on the left and click <strong style={{ color: 'var(--ink)' }}>ဆက်လက်ဆောင်ရွက်မည်</strong> to get a full market report.
                    </p>
                  </>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer style={{
        textAlign: 'center',
        padding: '20px 24px',
        color: 'var(--muted)',
        fontSize: '0.75rem',
        borderTop: '1px solid var(--line)',
        lineHeight: 1.7,
        maxWidth: 680,
        margin: '0 auto',
      }}>
        AI-generated property intelligence. Independently verify all information and consult qualified professionals before making financial, legal, or investment decisions.
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .main-grid {
          display: grid;
          grid-template-columns: clamp(300px, 36%, 440px) 1fr;
          gap: 22px;
          align-items: start;
        }
        @media (max-width: 820px) {
          .main-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}
