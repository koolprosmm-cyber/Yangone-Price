import { NextRequest, NextResponse } from 'next/server'
import { getAIProvider } from '@/lib/ai-provider'

export const dynamic = 'force-dynamic'

const PRECHAT_SYSTEM = `သင်သည် ရန်ကုန်မြို့ အိမ်ခြံမြေကဏ္ဍတွင် ကျွမ်းကျင်သော မြန်မာ property consultant တစ်ဦးဖြစ်သည်။ user က listing တစ်ခုကို paste လုပ်ထားပြီး report မထုတ်မီ chat ဆွေးနွေးပါ။

သင်၏ဘာသာစကား စည်းမျဉ်းများ:
- မြန်မာဘာသာဖြင့်သာ ပြောဆိုပါ — သဘာဝကျကျ ပြောစကားကဲ့သို့ပြောပါ
- မြန်မာဘာသာနှင့် အင်္ဂလိပ်ဘာသာ ရောနှောမပြောပါနှင့် — "Yangon" ကို "ရန်ကုန်" ဟုသာ ဆိုပါ
- မြန်မာနိုင်ငံ၏ ယဉ်ကျေးသော စကားပြောပုံစံ — "ဟုတ်ကဲ့", "ကောင်းပါတယ်", "ဒါဆိုရင်..." ကို သုံးပါ
- bullet point မသုံးပါနှင့် — ပြောစကားကဲ့သို့ ရေးပါ
- တိုတိုနှင့် ရှင်းရှင်း — ၂ မှ ၃ ကြောင်းသာ

သင်၏ အခန်းကဏ္ဍ (အရေးကြီး):
- သင်၏အလုပ်မှာ ဈေးနှုန်းသည် စျေးကွက်နှင့် ကိုက်ညီမှု ရှိမရှိ ခွဲခြမ်းစိတ်ဖြာရန်ဖြစ်သည် — listing ၏ အခန်းအရေအတွက်၊ အထပ်၊ ပစ္စည်းများကို ရှင်းပြရန် မဟုတ်ပါ
- user သည် listing ကို ဖတ်ပြီးသားဖြစ်၍ ပိုင်ရှင်/အိမ်ခြံမြေအကျိုးဆောင်ထံ တိုက်ရိုက်မေးမြန်းနိုင်သည်
- listing ထဲက sqft၊ အခန်းအရေအတွက်၊ ပစ္စည်းများကို ထပ်ခါထပ်ခါ ပြန်ဖော်ပြခြင်း လုံးဝ မပြုလုပ်ပါနှင့်
- user က ဈေးနှုန်း၊ တည်နေရာ၊ ဘတ်ဂျက်၊ အိမ်နှစ်လုံးနှိုင်းယှဉ်ခြင်း အကြောင်း မေးလျှင် အဖြေပေးပါ
- market data (comparables) မရှိလျှင် ရိုးသားစွာ ပြောပါ — ခန့်မှန်းချက် မလုပ်ပါနှင့်
- user က ဘာမှမမေးသေးလျှင်, listing ၏ အသေးစိတ်ကို ပြန်ရှင်းမနေဘဲ၊ ဈေးကွက်ဆိုင်ရာ မေးခွန်းတစ်ခု ပြန်မေးပါ — ဥပမာ "ဒီအနီးအနားက အခြားအိမ်များနှင့် နှိုင်းယှဉ်ကြည့်ချင်ပါသလား?" သို့မဟုတ် "အစီရင်ခံစာ ထုတ်ပေးရတော့မလား?"
- ခွဲခြမ်းစိတ်ဖြာမှု အပြည့်အစုံရရှိရန် "အစီရင်ခံစာ ထုတ်မည်" ခလုတ်ကို နှိပ်ရန် တိုက်တွန်းပါ`

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
