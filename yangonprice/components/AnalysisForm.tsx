'use client'

import { useState, useEffect } from 'react'
import { AnalysisResponse } from '@/lib/types'

interface Props {
  onResult: (result: AnalysisResponse) => void
  onLoading: (loading: boolean) => void
  loading: boolean
  defaultValue?: string
}

const STEPS = [
  'Reading listing',
  'Extracting details',
  'Analyzing market',
  'Generating advice',
]

export default function AnalysisForm({ onResult, onLoading, loading, defaultValue }: Props) {
  const [listing, setListing] = useState(defaultValue ?? '')
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(-1)

  useEffect(() => {
    if (!loading) { setStep(-1); return }
    setStep(0)
    const timers = [
      setTimeout(() => setStep(1), 1200),
      setTimeout(() => setStep(2), 2800),
      setTimeout(() => setStep(3), 5000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [loading])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!listing.trim()) return
    setError(null)
    onLoading(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Unable to generate analysis. Please try again.')
        return
      }
      onResult(data as AnalysisResponse)
    } catch {
      setError('Unable to generate analysis. Please try again.')
    } finally {
      onLoading(false)
    }
  }

  return (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid var(--line)',
      borderRadius: 14,
      padding: '28px 30px',
    }}>
      <p style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', margin: '0 0 18px', fontWeight: 700 }}>
        Paste Property Listing
      </p>

      <form onSubmit={handleSubmit}>
        <textarea
          className="my"
          value={listing}
          onChange={(e) => setListing(e.target.value)}
          placeholder="ဤနေရာတွင် အိမ်ခြံမြေကြော်ငြာစာသားကို ကူးထည့်ပါ။

ဥပမာ —
📍 တည်နေရာ — မြို့နယ်၊ ရပ်ကွက်၊ လမ်း
🏠 အိမ်အမျိုးအစား — RC အိမ်၊ တိုက်ခန်း၊ မြေကွက် စသည်
💰 ဈေးနှုန်း — သိန်း / ကျပ် / ညှိနှိုင်းရမည်
📐 မြေဧရိယာ — ပေ x ပေ (စာရွက်နှင့် အမှန်ကွာဟပါက နှစ်ခုလုံးဖော်ပြပါ)
🏗️ အဆောက်အဦးဧရိယာ — sqft
🛏️ အိပ်ခန်း / ရေချိုးခန်း အရေအတွက်
🏢 ထပ်ရေ
✨ အထူးလုပ်ဆောင်ချက်များ — ကားပါကင်၊ လိပ်တ်၊ ဂျင်နရေတာ စသည်

Facebook မှ ကော်ပီကူးထည့်လျှင်လည်း ရပါသည်။"
          rows={14}
          style={{
            width: '100%',
            minHeight: 320,
            background: 'var(--panel-raised)',
            border: '1px solid var(--line)',
            color: 'var(--ink)',
            borderRadius: 10,
            padding: '16px 18px',
            fontSize: '0.98rem',
            lineHeight: 1.8,
            outline: 'none',
          }}
        />

        <p className="my" style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 10, lineHeight: 1.8 }}>
          Facebook မှ ကြော်ငြာစာသားကို တိုက်ရိုက်ကူးထည့်နိုင်သည်။ AI သည် တည်နေရာ၊ ဈေးနှုန်း၊ အမျိုးအစားနှင့် အခြားအချက်အလက်များကို အလိုအလျောက် ဖော်ထုတ်ပေးမည်။
        </p>

        {loading && (
          <div style={{ marginTop: 14, padding: '14px 16px', background: 'var(--panel-raised)', borderRadius: 10, border: '1px solid var(--line)' }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', fontSize: '0.85rem' }}>
                <span style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  flexShrink: 0,
                  background: i < step ? 'var(--good-soft)' : i === step ? 'var(--gold-soft)' : 'transparent',
                  border: i < step ? '1px solid var(--good)' : i === step ? '1px solid var(--gold)' : '1px solid var(--line)',
                  color: i < step ? 'var(--good)' : i === step ? 'var(--gold)' : 'var(--muted)',
                }}>
                  {i < step ? '✓' : i === step ? '⟳' : '·'}
                </span>
                <span style={{ color: i <= step ? 'var(--ink)' : 'var(--muted)' }}>{s}</span>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p style={{ color: 'var(--bad)', fontSize: '0.85rem', marginTop: 12, padding: '10px 14px', background: 'var(--bad-soft)', borderRadius: 8, border: '1px solid rgba(226,100,90,0.3)' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !listing.trim()}
          style={{
            width: '100%',
            marginTop: 16,
            background: loading || !listing.trim() ? 'rgba(217,162,75,0.35)' : 'linear-gradient(135deg, var(--gold), #C8893A)',
            color: '#1A2420',
            border: 'none',
            borderRadius: 9,
            padding: '14px',
            fontWeight: 700,
            fontSize: '0.98rem',
            cursor: loading || !listing.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Analyzing…' : 'Analyze Property'}
        </button>
      </form>
    </div>
  )
}
