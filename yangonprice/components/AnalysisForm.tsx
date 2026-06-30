'use client'

import { useState, useEffect, useRef } from 'react'
import { AnalysisResponse } from '@/lib/types'

interface Props {
  onResult: (result: AnalysisResponse, listing?: string) => void
  onListing?: (listing: string) => void
  onLoading: (loading: boolean) => void
  loading: boolean
  defaultValue?: string
  defaultMode?: 'buyer' | 'seller'
}

const ANALYSIS_STEPS = [
  'Reading listing',
  'Collecting market data',
  'Applying PIG framework',
  'Generating recommendations',
]

type FlowStep = 'paste' | 'clarify' | 'done'

export default function AnalysisForm({ onResult, onListing, onLoading, loading, defaultValue, defaultMode }: Props) {
  const [listing, setListing] = useState(defaultValue ?? '')
  const [mode, setMode] = useState<'buyer' | 'seller'>(defaultMode ?? 'buyer')
  const [error, setError] = useState<string | null>(null)
  const [animStep, setAnimStep] = useState(-1)
  const [flowStep, setFlowStep] = useState<FlowStep>('paste')
  const [clarifyLoading, setClarifyLoading] = useState(false)
  const [questions, setQuestions] = useState<string[]>([])
  const [answers, setAnswers] = useState<string[]>([])
  const chatBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loading) { setAnimStep(-1); return }
    setAnimStep(0)
    const timers = [
      setTimeout(() => setAnimStep(1), 1500),
      setTimeout(() => setAnimStep(2), 3500),
      setTimeout(() => setAnimStep(3), 6000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [loading])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [questions, answers])

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault()
    if (!listing.trim()) return
    setError(null)
    setClarifyLoading(true)
    try {
      const res = await fetch('/api/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing }),
      })
      const data = await res.json()
      if (data.is_complete || !data.questions?.length) {
        // Listing is complete — go straight to analysis
        await runAnalysis(listing, [])
      } else {
        setQuestions(data.questions)
        setAnswers(data.questions.map(() => ''))
        setFlowStep('clarify')
      }
    } catch {
      await runAnalysis(listing, [])
    } finally {
      setClarifyLoading(false)
    }
  }

  async function handleAnalyze() {
    await runAnalysis(listing, answers)
  }

  async function runAnalysis(listingText: string, answerList: string[]) {
    setError(null)
    onLoading(true)
    setFlowStep('done')
    const fullListing = answerList.some(a => a.trim())
      ? `${listingText}\n\n--- Additional information provided by user ---\n${questions.map((q, i) => `Q: ${q}\nA: ${answerList[i] || 'မသိပါ'}`).join('\n\n')}`
      : listingText
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing: fullListing, mode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Unable to generate analysis. Please try again.')
        setFlowStep('paste')
        return
      }
      onListing?.(fullListing)
      onResult(data as AnalysisResponse, fullListing)
    } catch {
      setError('Unable to generate analysis. Please try again.')
      setFlowStep('paste')
    } finally {
      onLoading(false)
    }
  }

  function handleReset() {
    setFlowStep('paste')
    setQuestions([])
    setAnswers([])
    setError(null)
  }

  const isSeller = mode === 'seller'
  const busy = loading || clarifyLoading

  return (
    <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 14, padding: '24px 24px 28px' }}>

      {/* Buyer / Seller toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
        {(['buyer', 'seller'] as const).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            disabled={flowStep !== 'paste'}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 8,
              border: `1px solid ${mode === m ? (m === 'buyer' ? 'var(--good)' : 'var(--gold)') : 'var(--line)'}`,
              background: mode === m ? (m === 'buyer' ? 'var(--good-soft)' : 'var(--gold-soft)') : 'var(--panel-raised)',
              color: mode === m ? (m === 'buyer' ? 'var(--good)' : 'var(--gold)') : 'var(--muted)',
              fontWeight: mode === m ? 700 : 500,
              fontSize: '0.88rem',
              cursor: flowStep !== 'paste' ? 'default' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {m === 'buyer' ? '🏠 I want to Buy' : '💰 I want to Sell'}
          </button>
        ))}
      </div>

      {/* ── STEP 1: Paste listing ── */}
      {flowStep === 'paste' && (
        <form onSubmit={handleContinue}>
          {isSeller && (
            <div style={{ marginBottom: 16, padding: '12px 14px', background: 'var(--panel-raised)', borderRadius: 10, border: '1px solid rgba(217,162,75,0.25)' }}>
              <p className="my" style={{ fontSize: '0.72rem', color: 'var(--gold)', fontWeight: 700, margin: '0 0 8px', letterSpacing: '0.04em' }}>
                AI မှ ဤမေးခွန်းများကို ဖြေပေးမည် —
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[
                  '💰 ကျွန်ုပ်၏ ဈေးနှုန်း စျေးကွက်နှင့် ကိုက်ညီမှုရှိပါသလား?',
                  '📊 သင့်တင့်သော ဈေးနှုန်းအပိုင်းအခြား ဘယ်လောက်ဖြစ်သနည်း?',
                  '🔧 ရောင်းချမတင်မီ ဘာများ ပြင်ဆင်သင့်သနည်း?',
                  '⏱ ဤအိမ်သည် မည်မျှ မြန်မြန် ရောင်းထွက်နိုင်မည်နည်း?',
                ].map((q, i) => (
                  <div key={i} className="my" style={{ fontSize: '0.82rem', color: 'var(--ink)', lineHeight: 1.7 }}>{q}</div>
                ))}
              </div>
            </div>
          )}

          <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', margin: '0 0 14px', fontWeight: 700 }}>
            {isSeller ? 'Paste Your Property Listing' : 'Paste Property Listing'}
          </p>

          <textarea
            className="my"
            value={listing}
            onChange={(e) => setListing(e.target.value)}
            placeholder={isSeller
              ? `ဤနေရာတွင် သင်ရောင်းလိုသော အိမ်ခြံမြေကြော်ငြာကို ကူးထည့်ပါ။\n\nAI သည် သင့်ဈေးနှုန်းကို စျေးကွက်နှင့် နှိုင်းယှဉ်၍ အကောင်းဆုံး ရောင်းချနိုင်ရေး အကြံဉာဏ်ပေးမည်။`
              : `ဤနေရာတွင် အိမ်ခြံမြေကြော်ငြာစာသားကို ကူးထည့်ပါ။\n\nဥပမာ —\n📍 တည်နေရာ — မြို့နယ်၊ ရပ်ကွက်၊ လမ်း\n🏠 အိမ်အမျိုးအစား — RC အိမ်၊ တိုက်ခန်း၊ မြေကွက် စသည်\n💰 ဈေးနှုန်း — သိန်း / ကျပ် / ညှိနှိုင်းရမည်\n📐 မြေဧရိယာ — ပေ x ပေ\n🏗️ အဆောက်အဦးဧရိယာ — sqft\n🛏️ အိပ်ခန်း / ရေချိုးခန်း အရေအတွက်\n🏢 ထပ်ရေ\n✨ အထူးလုပ်ဆောင်ချက်များ\n\nFacebook မှ ကော်ပီကူးထည့်လျှင်လည်း ရပါသည်။`
            }
            rows={12}
            style={{
              width: '100%', minHeight: 280,
              background: 'var(--panel-raised)', border: '1px solid var(--line)',
              color: 'var(--ink)', borderRadius: 10, padding: '14px 16px',
              fontSize: '0.95rem', lineHeight: 1.8, outline: 'none',
            }}
          />

          <p className="my" style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 8, lineHeight: 1.7 }}>
            {isSeller
              ? 'AI သည် သင့်ဈေးနှုန်းကို စျေးကွက်နှင့် နှိုင်းယှဉ်၍ ရောင်းချရေး အကြံဉာဏ်ပေးမည်။'
              : 'Facebook မှ ကြော်ငြာစာသားကို တိုက်ရိုက်ကူးထည့်နိုင်သည်။ AI သည် တည်နေရာ၊ ဈေးနှုန်း၊ အမျိုးအစားနှင့် အခြားအချက်အလက်များကို အလိုအလျောက် ဖော်ထုတ်ပေးမည်။'
            }
          </p>

          {error && (
            <p style={{ color: 'var(--bad)', fontSize: '0.85rem', marginTop: 12, padding: '10px 14px', background: 'var(--bad-soft)', borderRadius: 8, border: '1px solid rgba(226,100,90,0.3)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !listing.trim()}
            style={{
              width: '100%', marginTop: 14,
              background: busy || !listing.trim() ? 'rgba(217,162,75,0.35)' : 'linear-gradient(135deg, var(--gold), #C8893A)',
              color: '#1A2420', border: 'none', borderRadius: 9, padding: '13px',
              fontWeight: 700, fontSize: '0.95rem',
              cursor: busy || !listing.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {clarifyLoading ? 'AI မေးခွန်းများ ဆန်းစစ်နေသည်…' : isSeller ? '💰 ဆက်လက်ဆောင်ရွက်မည်' : '🏠 ဆက်လက်ဆောင်ရွက်မည်'}
          </button>
        </form>
      )}

      {/* ── STEP 2: Chat clarification ── */}
      {flowStep === 'clarify' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <button onClick={handleReset} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}>
              ← ပြန်သွားမည်
            </button>
            <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', fontWeight: 700, margin: 0 }}>
              AI မေးခွန်းများ
            </p>
          </div>

          {/* Chat bubbles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 20 }}>
            {/* AI opening message */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, var(--gold), #C8893A)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 700, color: '#1A2420',
              }}>AI</div>
              <div style={{
                background: 'var(--panel-raised)', border: '1px solid var(--line)',
                borderRadius: '0 12px 12px 12px', padding: '10px 14px',
                fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--ink)',
                maxWidth: '85%',
              }} className="my">
                ကြော်ငြာစာသားကို ဖတ်ပြီးပါပြီ။ ပိုကောင်းသော ခွဲခြမ်းစိတ်ဖြာမှုအတွက် အောက်ပါ မေးခွန်းများကို ဖြေကြားပေးပါ —
              </div>
            </div>

            {/* Questions + answer inputs */}
            {questions.map((q, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* AI question bubble */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--gold), #C8893A)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', fontWeight: 700, color: '#1A2420',
                  }}>{i + 1}</div>
                  <div style={{
                    background: 'var(--panel-raised)', border: '1px solid var(--line)',
                    borderRadius: '0 12px 12px 12px', padding: '10px 14px',
                    fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--ink)',
                    maxWidth: '85%',
                  }} className="my">{q}</div>
                </div>

                {/* User answer bubble */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <textarea
                    className="my"
                    value={answers[i]}
                    onChange={e => {
                      const next = [...answers]
                      next[i] = e.target.value
                      setAnswers(next)
                    }}
                    placeholder="ဤနေရာတွင် ဖြေပါ…"
                    rows={2}
                    style={{
                      width: '85%', background: 'rgba(217,162,75,0.08)',
                      border: '1px solid rgba(217,162,75,0.35)',
                      borderRadius: '12px 0 12px 12px',
                      color: 'var(--ink)', padding: '10px 14px',
                      fontSize: '0.9rem', lineHeight: 1.7, outline: 'none', resize: 'none',
                    }}
                  />
                </div>
              </div>
            ))}

            <div ref={chatBottomRef} />
          </div>

          {error && (
            <p style={{ color: 'var(--bad)', fontSize: '0.85rem', marginBottom: 12, padding: '10px 14px', background: 'var(--bad-soft)', borderRadius: 8 }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => runAnalysis(listing, [])}
              disabled={busy}
              style={{
                flex: 1, padding: '11px', borderRadius: 9,
                border: '1px solid var(--line)', background: 'var(--panel-raised)',
                color: 'var(--muted)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
              }}
            >
              ကျော်၍ ဆက်သွားမည်
            </button>
            <button
              onClick={handleAnalyze}
              disabled={busy}
              style={{
                flex: 2, padding: '11px', borderRadius: 9, border: 'none',
                background: 'linear-gradient(135deg, var(--gold), #C8893A)',
                color: '#1A2420', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
              }}
            >
              {isSeller ? '💰 ခွဲခြမ်းစိတ်ဖြာမည်' : '🏠 ခွဲခြမ်းစိတ်ဖြာမည်'}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Analyzing ── */}
      {flowStep === 'done' && loading && (
        <div>
          <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', margin: '0 0 16px', fontWeight: 700 }}>
            ခွဲခြမ်းစိတ်ဖြာနေသည်…
          </p>
          <div style={{ padding: '12px 16px', background: 'var(--panel-raised)', borderRadius: 10, border: '1px solid var(--line)' }}>
            {ANALYSIS_STEPS.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', fontSize: '0.85rem' }}>
                <span style={{
                  width: 20, height: 20, borderRadius: '50%',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', flexShrink: 0,
                  background: i < animStep ? 'var(--good-soft)' : i === animStep ? 'var(--gold-soft)' : 'transparent',
                  border: i < animStep ? '1px solid var(--good)' : i === animStep ? '1px solid var(--gold)' : '1px solid var(--line)',
                  color: i < animStep ? 'var(--good)' : i === animStep ? 'var(--gold)' : 'var(--muted)',
                }}>
                  {i < animStep ? '✓' : i === animStep ? '⟳' : '·'}
                </span>
                <span style={{ color: i <= animStep ? 'var(--ink)' : 'var(--muted)' }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
