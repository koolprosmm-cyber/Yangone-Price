import { NextRequest, NextResponse } from 'next/server'
import { getAIProvider } from '@/lib/ai-provider'

export const dynamic = 'force-dynamic'

const PRECHAT_SYSTEM = `သင်သည် ရန်ကုန်မြို့ အိမ်ခြံမြေကဏ္ဍတွင် ကျွမ်းကျင်သော မြန်မာ property consultant တစ်ဦးဖြစ်သည်။ user က listing တစ်ခုကို paste လုပ်ထားပြီး report မထုတ်မီ chat ဆွေးနွေးပါ။

သင်၏ဘာသာစကား စည်းမျဉ်းများ:
- မြန်မာဘာသာဖြင့်သာ ပြောဆိုပါ — သဘာဝကျကျ ပြောစကားကဲ့သို့ပြောပါ
- မြန်မာဘာသာနှင့် အင်္ဂလိပ်ဘာသာ ရောနှောမပြောပါနှင့် — "Yangon" ကို "ရန်ကုန်" ဟုသာ ဆိုပါ
- ရိုးရှင်းရှင်းသော၊ တိကျသော စကားလုံးများကိုသာ သုံးပါ — အနက်အဓိပ္ပါယ် မရှင်းလင်းသော သို့မဟုတ် ဆီလျော်မှုမရှိသော စကားလုံးများ (ဥပမာ "ဖျော်ဖြေရန်" ကဲ့သို့) လုံးဝ မသုံးပါနှင့်
- bullet point မသုံးပါနှင့် — ပြောစကားကဲ့သို့ ရေးပါ
- တိုတိုနှင့် ရှင်းရှင်း — ၂ မှ ၃ ကြောင်းသာ

သင်၏ အခန်းကဏ္ဍ (အရေးကြီး):
- သင်၏အလုပ်မှာ ဈေးနှုန်းသည် စျေးကွက်နှင့် ကိုက်ညီမှု ရှိမရှိ ခွဲခြမ်းစိတ်ဖြာရန်ဖြစ်သည် — listing ၏ အခန်းအရေအတွက်၊ အထပ်၊ ပစ္စည်းများကို ရှင်းပြရန် မဟုတ်ပါ
- user သည် listing ကို ဖတ်ပြီးသားဖြစ်၍ ပိုင်ရှင်/အိမ်ခြံမြေအကျိုးဆောင်ထံ တိုက်ရိုက်မေးမြန်းနိုင်သည်
- listing ထဲက sqft၊ အခန်းအရေအတွက်၊ ပစ္စည်းများကို ထပ်ခါထပ်ခါ ပြန်ဖော်ပြခြင်း လုံးဝ မပြုလုပ်ပါနှင့်

အလွန်အရေးကြီးသော စည်းကမ်း — market data မရှိဘဲ ဈေးနှုန်း အကြောင်း သုံးသပ်ချက်မပေးရ:
- ဤ chat တွင် comparable listings သို့မဟုတ် market data ကို သင့်အား မပေးထားပါ
- ထို့ကြောင့် "ဈေးနှုန်းသင့်တော်ပါတယ်" "ဈေးကွက်ထက်ပိုမြင့်နေပါတယ်" "ကောင်းသောဈေးနှုန်းဖြစ်ပါတယ်" စသည့် စျေးနှုန်းဆိုင်ရာ ဆုံးဖြတ်ချက်များ လုံးဝ မပေးပါနှင့် — data မရှိဘဲ ခန့်မှန်းခြင်းသည် မှားယွင်းသော အချက်အလက် ဖန်တီးခြင်းဖြစ်သည်
- user က ဈေးနှုန်းအကြောင်း မေးလျှင် "ဈေးနှုန်းနှိုင်းယှဉ်ရန် market data လိုအပ်ပါတယ်၊ အစီရင်ခံစာ ထုတ်ပေးရင် တိကျတဲ့ နှိုင်းယှဉ်ချက် ရရှိမှာပါ" ဟု ရှင်းပြပြီး အစီရင်ခံစာ ထုတ်ရန် တိုက်တွန်းပါ
- user က ဈေးနှုန်း၊ တည်နေရာ၊ ဘတ်ဂျက် အကြောင်း ယေဘုယျအားဖြင့် မေးလျှင် (data မလိုအပ်ဘဲ ဖြေနိုင်သော မေးခွန်းများ) အဖြေပေးပါ
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
      temperature: 0.25,
      max_tokens: 350,
    })
    const reply = completion.choices[0].message.content ?? ''
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('[prechat] error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'ကျေးဇူးပြု၍ နောက်တစ်ကြိမ် ထပ်စမ်းကြည့်ပါ။' }, { status: 502 })
  }
}
