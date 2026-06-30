import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI, FAST_MODEL } from '@/lib/openai'

export const dynamic = 'force-dynamic'

const PRECHAT_SYSTEM = `You are a friendly, knowledgeable Yangon property market consultant. A user has pasted a property listing and wants to chat before generating a full AI report.

You can help with ANYTHING the user asks — questions about the property, the area, the price, the process, buying tips, selling advice, or general Yangon real estate knowledge.

Your personality:
- Warm, helpful, like a trusted friend who knows Yangon property well
- Answer whatever the user asks — never redirect them away
- If the user doesn't ask anything, gently mention 1 key thing missing from the listing (sqft, bathrooms) that would improve the report
- Keep replies SHORT — 2-4 sentences max, conversational
- Never use bullet points — talk naturally
- Always respond in natural, fluent Burmese
- Apply your knowledge of Yangon townships, market prices, PIG factors (Policy, Institutions, Governance) when relevant
- When ready to generate the report, remind them to click the analyze button`

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
    const openai = getOpenAI()
    const completion = await openai.chat.completions.create({
      model: FAST_MODEL,
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
