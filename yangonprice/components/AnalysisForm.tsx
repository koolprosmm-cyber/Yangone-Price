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

type FlowStep = 'paste' | 'chat' | 'done'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function AnalysisForm({ onResult, onListing, onLoading, loading, defaultValue, defaultMode }: Props) {
  const [listing, setListing] = useState(defaultValue ?? '')
  const [mode, setMode] = useState<'buyer' | 'seller'>(defaultMode ?? 'buyer')
  const [error, setError] = useState<string | null>(null)
  const [animStep, setAnimStep] = useState(-1)
  const [flowStep, setFlowStep] = useState<FlowStep>('paste')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

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
  }, [chatMessages, chatLoading])

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault()
    if (!listing.trim()) return
    setError(null)
    setFlowStep('chat')
    setChatMessages([])
    setChatLoading(true)
    try {
      const res = await fetch('/api/prechat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing, messages: [] }),
      })
      const data = await res.json()
      if (data.reply) {
        setChatMessages([{ role: 'assistant', content: data.reply }])
      }
    } catch {
      setChatMessages([{ role: 'assistant', content: 'ကြော်ငြာစာသားကို ဖတ်ရှုပြီးပါပြီ။ ဆန်းစစ်မည် ကို နှိပ်ပါ။' }])
    } finally {
      setChatLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  async function handleSendMessage() {
    const text = chatInput.trim()
    if (!text || chatLoading) return
    setChatInput('')
    const newMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: text }]
    setChatMessages(newMessages)
    setChatLoading(true)
    try {
      const res = await fetch('/api/prechat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing, messages: newMessages }),
      })
      const data = await res.json()
      if (data.reply) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      }
    } catch {
      // silent — user can still click analyze
    } finally {
      setChatLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  async function runAnalysis() {
    setError(null)
    onLoading(true)
    setFlowStep('done')

    // Build full context: listing + conversation
    const convo = chatMessages.length
      ? '\n\n--- ဆွေးနွေးမှုမှ ရရှိသော အချက်အလက်အပိုများ ---\n' +
        chatMessages.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n')
      : ''
    const fullListing = listing + convo

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing: fullListing, mode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Unable to generate analysis. Please try again.')
        setFlowStep('chat')
        return
      }
      onListing?.(fullListing)
      onResult(data as AnalysisResponse, fullListing)
    } catch {
      setError('Unable to generate analysis. Please try again.')
      setFlowStep('chat')
    } finally {
      onLoading(false)
    }
  }

  function handleReset() {
    setFlowStep('paste')
    setChatMessages([])
    setChatInput('')
    setError(null)
  }

  const isSeller = mode === 'seller'
  const busy = loading || chatLoading

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
            disabled={!listing.trim()}
            style={{
              width: '100%', marginTop: 14,
              background: !listing.trim() ? 'rgba(217,162,75,0.35)' : 'linear-gradient(135deg, var(--gold), #C8893A)',
              color: '#1A2420', border: 'none', borderRadius: 9, padding: '13px',
              fontWeight: 700, fontSize: '0.95rem',
              cursor: !listing.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {isSeller ? '💰 ဆက်လက်ဆောင်ရွက်မည်' : '🏠 ဆက်လက်ဆောင်ရွက်မည်'}
          </button>
        </form>
      )}

      {/* ── STEP 2: Conversational chat before analysis ── */}
      {flowStep === 'chat' && (
        <div>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <button onClick={handleReset} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}>
              ← ပြန်သွားမည်
            </button>
            <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', fontWeight: 700, margin: 0 }}>
              AI နှင့် မေးမြန်းမှု
            </p>
          </div>

          {/* Chat messages */}
          <div style={{
            minHeight: 180, maxHeight: 340, overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: 12,
            marginBottom: 14, paddingRight: 4,
          }}>
            {chatMessages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                gap: 8, alignItems: 'flex-end',
              }}>
                {msg.role === 'assistant' && (
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--gold), #C8893A)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 700, color: '#1A2420',
                  }}>AI</div>
                )}
                <div className="my" style={{
                  maxWidth: '80%', padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '12px 12px 0 12px' : '0 12px 12px 12px',
                  background: msg.role === 'user' ? 'rgba(217,162,75,0.15)' : 'var(--panel-raised)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(217,162,75,0.35)' : 'var(--line)'}`,
                  fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--ink)',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {chatLoading && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--gold), #C8893A)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 700, color: '#1A2420',
                }}>AI</div>
                <div style={{
                  padding: '10px 16px', borderRadius: '0 12px 12px 12px',
                  background: 'var(--panel-raised)', border: '1px solid var(--line)',
                  color: 'var(--muted)', fontSize: '1.2rem', letterSpacing: 4,
                }}>···</div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {error && (
            <p style={{ color: 'var(--bad)', fontSize: '0.85rem', marginBottom: 12, padding: '10px 14px', background: 'var(--bad-soft)', borderRadius: 8 }}>
              {error}
            </p>
          )}

          {/* Input */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <textarea
              ref={inputRef}
              className="my"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ဖြေကြားရန် ဤနေရာတွင် ရိုက်ထည့်ပါ… (Enter နှိပ်၍ ပို့ပါ)"
              rows={2}
              disabled={chatLoading}
              style={{
                flex: 1, background: 'var(--panel-raised)',
                border: '1px solid var(--line)', borderRadius: 9,
                color: 'var(--ink)', padding: '10px 14px',
                fontSize: '0.9rem', lineHeight: 1.7, outline: 'none', resize: 'none',
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!chatInput.trim() || chatLoading}
              style={{
                padding: '0 16px', borderRadius: 9, border: 'none',
                background: !chatInput.trim() || chatLoading ? 'var(--panel-raised)' : 'var(--gold)',
                color: !chatInput.trim() || chatLoading ? 'var(--muted)' : '#1A2420',
                fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', flexShrink: 0,
              }}
            >
              ↑
            </button>
          </div>

          {/* Analyze button */}
          <button
            onClick={runAnalysis}
            disabled={busy}
            style={{
              width: '100%', padding: '13px', borderRadius: 9, border: 'none',
              background: busy ? 'rgba(217,162,75,0.35)' : 'linear-gradient(135deg, var(--gold), #C8893A)',
              color: '#1A2420', fontWeight: 700, fontSize: '0.95rem',
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
          >
            {isSeller ? '💰 အစီရင်ခံစာ ထုတ်မည်' : '🏠 အစီရင်ခံစာ ထုတ်မည်'}
          </button>
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
