'use client'

import { useState, useRef, useEffect } from 'react'
import { AnalysisResponse } from '@/lib/types'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  listing: string
  result: AnalysisResponse
}

const SUGGESTED = [
  'ဤအိမ်ဝယ်ရန် ဘေးကင်းပါသလား?',
  'ပိုင်ဆိုင်မှုလွှဲပြောင်းမှု မည်မျှကြာသနည်း?',
  'ဈေးနှုန်း ညှိနှိုင်းနိုင်ပါသလား?',
  'ဤမြို့နယ်တွင် တိုက်ခန်းဝယ်ရန် ဘဏ်ချေးငွေ ရနိုင်ပါသလား?',
]

function buildReportContext(result: AnalysisResponse): string {
  const lines: string[] = []
  if (result.extracted_data?.township) lines.push(`Township: ${result.extracted_data.township}`)
  if (result.extracted_data?.property_type) lines.push(`Type: ${result.extracted_data.property_type}`)
  if (result.extracted_data?.price_lakh) lines.push(`Price: ${result.extracted_data.price_lakh} lakhs`)
  if (result.decision) lines.push(`Decision: ${result.decision}`)
  if (result.investment_potential) lines.push(`Investment: ${result.investment_potential}`)
  if (result.confidence) lines.push(`Confidence: ${result.confidence}`)
  if (result.market_intelligence) lines.push(`Market: ${result.market_intelligence.slice(0, 300)}`)
  if (result.property_intelligence) lines.push(`Analysis: ${result.property_intelligence.slice(0, 300)}`)
  if (result.key_findings?.length) lines.push(`Key findings: ${result.key_findings.slice(0, 3).join(' | ')}`)
  if (result.potential_risks?.length) lines.push(`Risks: ${result.potential_risks.slice(0, 3).join(' | ')}`)
  return lines.join('\n')
}

export default function ChatBox({ listing, result }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  async function send(text: string) {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', content: text }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing: listing.slice(0, 2000),
          reportContext: buildReportContext(result),
          messages: next,
        }),
      })
      const data = await res.json()
      if (data.reply) {
        setMessages(m => [...m, { role: 'assistant', content: data.reply }])
      }
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'တစ်ခုခု မှားသွားပါသည်။ ထပ်မံကြိုးစားပါ။' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginTop: 24 }}>
      {/* Toggle button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            width: '100%', padding: '13px', borderRadius: 10,
            border: '1px solid rgba(217,162,75,0.4)',
            background: 'var(--panel-raised)',
            color: 'var(--gold)', fontWeight: 700, fontSize: '0.95rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>💬</span>
          AI နှင့် မေးမြန်းရန်
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div style={{
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 14,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px',
            background: 'var(--panel-raised)',
            borderBottom: '1px solid var(--line)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--gold), #C8893A)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700, color: '#1A2420',
              }}>AI</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Property Advisor</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--good)' }}>● Online</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}
            >✕</button>
          </div>

          {/* Messages */}
          <div style={{ padding: '16px 18px', minHeight: 200, maxHeight: 400, overflowY: 'auto' }}>
            {/* Welcome message */}
            {messages.length === 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--gold), #C8893A)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', fontWeight: 700, color: '#1A2420',
                  }}>AI</div>
                  <div style={{
                    background: 'var(--panel-raised)', border: '1px solid var(--line)',
                    borderRadius: '0 12px 12px 12px', padding: '10px 14px',
                    fontSize: '0.88rem', lineHeight: 1.7, maxWidth: '85%',
                  }} className="my">
                    ငါ့ကို မေးနိုင်ပါတယ်။ ဒီအိမ်အကြောင်း၊ ဈေးကွက်အကြောင်း၊ သို့မဟုတ် ဒီ report ထဲမှ မည်သည့်အကြောင်းကိုမဆို ရှင်းပြပေးနိုင်ပါတယ်။
                  </div>
                </div>
                {/* Suggested questions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 38 }}>
                  {SUGGESTED.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => send(q)}
                      style={{
                        textAlign: 'left', padding: '8px 12px',
                        background: 'var(--panel-raised)',
                        border: '1px solid rgba(217,162,75,0.3)',
                        borderRadius: 8, cursor: 'pointer',
                        fontSize: '0.82rem', color: 'var(--gold)', lineHeight: 1.5,
                      }} className="my"
                    >{q}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation */}
            {messages.map((m, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 14,
              }}>
                {m.role === 'assistant' && (
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginRight: 8,
                    background: 'linear-gradient(135deg, var(--gold), #C8893A)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', fontWeight: 700, color: '#1A2420',
                  }}>AI</div>
                )}
                <div style={{
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: m.role === 'user' ? '12px 0 12px 12px' : '0 12px 12px 12px',
                  background: m.role === 'user' ? 'rgba(217,162,75,0.15)' : 'var(--panel-raised)',
                  border: `1px solid ${m.role === 'user' ? 'rgba(217,162,75,0.35)' : 'var(--line)'}`,
                  fontSize: '0.88rem', lineHeight: 1.75,
                }} className="my">{m.content}</div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--gold), #C8893A)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: 700, color: '#1A2420',
                }}>AI</div>
                <div style={{
                  padding: '10px 16px', background: 'var(--panel-raised)',
                  border: '1px solid var(--line)', borderRadius: '0 12px 12px 12px',
                  fontSize: '1.2rem', letterSpacing: 3, color: 'var(--gold)',
                }}>···</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            display: 'flex', gap: 8, padding: '12px 14px',
            borderTop: '1px solid var(--line)',
            background: 'var(--panel-raised)',
          }}>
            <input
              ref={inputRef}
              className="my"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
              placeholder="မေးချင်သည်များ ရိုက်ပါ…"
              disabled={loading}
              style={{
                flex: 1, padding: '10px 14px',
                background: 'var(--panel)', border: '1px solid var(--line)',
                borderRadius: 8, color: 'var(--ink)', fontSize: '0.9rem', outline: 'none',
              }}
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              style={{
                padding: '10px 16px', borderRadius: 8, border: 'none',
                background: loading || !input.trim() ? 'rgba(217,162,75,0.3)' : 'linear-gradient(135deg, var(--gold), #C8893A)',
                color: '#1A2420', fontWeight: 700, fontSize: '0.88rem',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              }}
            > ပို့</button>
          </div>
        </div>
      )}
    </div>
  )
}
