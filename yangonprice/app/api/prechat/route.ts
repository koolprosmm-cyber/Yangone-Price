import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI, FAST_MODEL } from '@/lib/openai'

export const dynamic = 'force-dynamic'

const PRECHAT_SYSTEM = `You are a friendly Yangon property market assistant. A user has pasted a property listing and you need to help clarify missing information before generating a full analysis report.

Your job:
1. Read the listing carefully
2. Identify what is MISSING that is important for analysis (price, township, sqft, property type, bedrooms)
3. Ask short, friendly questions in natural Burmese — one or two at a time, conversationally
4. When the user answers, acknowledge briefly and ask the next missing thing if needed
5. If you have enough info (price + location + type), say you're ready and suggest they click the analyze button

RULES:
- Always respond in natural, friendly Burmese
- Keep messages SHORT — 1-3 sentences max
- Ask only the most important missing thing first
- Do NOT ask about title deeds, legal documents, or negotiation — those are for the report
- Do NOT repeat what's already in the listing
- Be warm and conversational, not robotic
- Never produce a list with bullet points — talk naturally like a helpful friend`

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
      temperature: 0.4,
      max_tokens: 200,
    })
    const reply = completion.choices[0].message.content ?? ''
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('[prechat] error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'ကျေးဇူးပြု၍ နောက်တစ်ကြိမ် ထပ်စမ်းကြည့်ပါ။' }, { status: 502 })
  }
}
