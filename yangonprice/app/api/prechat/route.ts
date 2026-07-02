import { NextRequest, NextResponse } from 'next/server'
import { getAIProvider } from '@/lib/ai-provider'

export const dynamic = 'force-dynamic'

const PRECHAT_SYSTEM = `သင်သည် ရန်ကုန်မြို့ အိမ်ခြံမြေကဏ္ဍကို ကျွမ်းကျင်သော မြန်မာ property consultant တစ်ဦးဖြစ်သည်။ user က listing တစ်ခု paste လုပ်ထားပြီး report မထုတ်မီ chat ဆွေးနွေးလိုသည်။

သင်၏ ဘာသာစကား စည်းမျဉ်းများ:
- မြန်မာဘာသာဖြင့်သာ ပြောဆိုပါ — သဘာဝကျကျ၊ ပြောစကားကဲ့သို့
- မြန်မာဘာသာနှင့် အင်္ဂလိပ်ဘာသာ ရောနှောမပြောပါနှင့် — "Yangon" ကို "ရန်ကုန်" ဟုသာ ဆိုပါ
- ကောင်းသောမြန်မာ ငြိမ်းချမ်းသောနှုတ်ဆက်ပုံ — "ဟုတ်ကဲ့၊", "ကောင်းပါတယ်၊", "ဒါဆိုရင်..." ကို သုံးပါ
- bullet point မသုံးပါနှင့် — ပြောစကားကဲ့သို့ ရေးပါ
- တိုတိုနှင့် ရှင်းရှင်း — ၂ မှ ၃ ကြောင်းသာ

သင်၏ အလုပ်:
- user မေးသည်ကို ဘာမဆို ဖြေပေးပါ — နေရာ၊ ဈေးနှုန်း၊ ဥပဒေ၊ ဘဏ်ချေး၊ ရောင်းဝယ်ခြင်း အကြောင်း
- user မမေးသေးလျှင် — listing တွင်빠진 အချက်တစ်ခုကို ဖော်ပြပါ (sqft သို့မဟုတ် ရေချိုးခန်းအရေအတွက်)
- report ထုတ်ဖို့ အဆင်သင့်ဖြစ်ပြီဟု ထင်ရင် "အစီရင်ခံစာ ထုတ်မည် ကိုနှိပ်ပါ" ဟု ပြောပါ`

export async function POST(req: NextRequest) {
  let listing: string
  let messages: { role: 'user' | 'assistant'; content: string }[]

  try {
    const body = await req.json()
    listing = (body.listing ?? '').trim().slice(0, 3000)
    messages = (body.messages ?? []).slice(-10)
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!listing) return NextResponse.json({ error: 'Listing required' }, { status: 400 })

  try {
    const provider = getAIProvider()
    const completion = await provider.client.chat.completions.create({
      model: provider.model,
      messages: [
        { role: 'system', content: PRECHAT_SYSTEM },
        { role: 'user', content: `=== PROPERTY LISTING ===\n${listing}` },
        { role: 'assistant', content: 'ကြော်ငြာစာသားကို ဖတ်ရှုပြီးပါပြီ။' },
        ...messages,
      ],
      temperature: 0.5,
      max_tokens: 350,
    })
    const reply = completion.choices[0].message.content ?? ''
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('[prechat] error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'ကျေးဇူးပြု၍ နောက်တစ်ကြိမ် ထပ်စမ်းကြည့်ပါ။' }, { status: 502 })
  }
}
