'use client'

import { useState, useEffect } from 'react'
import { AnalysisResponse } from '@/lib/types'

interface Props {
  onResult: (result: AnalysisResponse) => void
  onLoading: (loading: boolean) => void
  loading: boolean
  defaultValue?: string
  defaultMode?: 'buyer' | 'seller'
}

const STEPS = [
  'Reading listing',
  'Extracting details',
  'Analyzing market',
  'Generating advice',
]

export default function AnalysisForm({ onResult, onLoading, loading, defaultValue, defaultMode }: Props) {
  const [listing, setListing] = useState(defaultValue ?? '')
  const [mode, setMode] = useState<'buyer' | 'seller'>(defaultMode ?? 'buyer')
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
        body: JSON.stringify({ listing, mode }),
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

  const isSeller = mode === 'seller'

  return (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid var(--line)',
      borderRadius: 14,
      padding: '24px 24px 28px',
    }}>
      {/* Buyer / Seller toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
        {(['buyer', 'seller'] as const).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            style={{
              flex: 1,
              padding: '9px 0',
              borderRadius: 8,
              border: `1px solid ${mode === m ? (m === 'buyer' ? 'var(--good)' : 'var(--gold)') : 'var(--line)'}`,
              background: mode === m ? (m === 'buyer' ? 'var(--good-soft)' : 'var(--gold-soft)') : 'var(--panel-raised)',
              color: mode === m ? (m === 'buyer' ? 'var(--good)' : 'var(--gold)') : 'var(--muted)',
              fontWeight: mode === m ? 700 : 500,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {m === 'buyer' ? '🏠 I want to Buy' : '💰 I want to Sell'}
          </button>
        ))}
      </div>

      {/* Seller mode — what you'll learn */}
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

      <form onSubmit={handleSubmit}>
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
            width: '100%',
            minHeight: 280,
            background: 'var(--panel-raised)',
            border: '1px solid var(--line)',
            color: 'var(--ink)',
            borderRadius: 10,
            padding: '14px 16px',
            fontSize: '0.95rem',
            lineHeight: 1.8,
            outline: 'none',
          }}
        />

        <p className="my" style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 8, lineHeight: 1.7 }}>
          {isSeller
            ? 'AI သည် သင့်ဈေးနှုန်းကို စျေးကွက်နှင့် နှိုင်းယှဉ်၍ ရောင်းချရေး အကြံဉာဏ်ပေးမည်။'
            : 'Facebook မှ ကြော်ငြာစာသားကို တိုက်ရိုက်ကူးထည့်နိုင်သည်။ AI သည် တည်နေရာ၊ ဈေးနှုန်း၊ အမျိုးအစားနှင့် အခြားအချက်အလက်များကို အလိုအလျောက် ဖော်ထုတ်ပေးမည်။'
          }
        </p>

        {loading && (
          <div style={{ marginTop: 14, padding: '12px 16px', background: 'var(--panel-raised)', borderRadius: 10, border: '1px solid var(--line)' }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', fontSize: '0.85rem' }}>
                <span style={{
                  width: 18, height: 18, borderRadius: '50%',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', flexShrink: 0,
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
            marginTop: 14,
            background: loading || !listing.trim()
              ? 'rgba(217,162,75,0.35)'
              : isSeller
                ? 'linear-gradient(135deg, #C8893A, #D9A24B)'
                : 'linear-gradient(135deg, var(--gold), #C8893A)',
            color: '#1A2420',
            border: 'none',
            borderRadius: 9,
            padding: '13px',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: loading || !listing.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {loading
            ? 'Analyzing…'
            : isSeller
              ? '💰 Analyze My Listing'
              : '🏠 Analyze Property'}
        </button>
      </form>
    </div>
  )
}
