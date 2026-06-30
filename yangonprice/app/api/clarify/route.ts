import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI } from '@/lib/openai'

export const dynamic = 'force-dynamic'

const CLARIFY_PROMPT = `You are a property data assistant for the Yangon, Myanmar real estate market.

A user has pasted a property listing. Your job is to identify what key information is MISSING from the listing, then ask 2-3 short, friendly questions in Burmese to collect it.

Only ask about information that is truly missing AND important for analysis:
- Price (á€ˆá€±á€¸á€”á€¾á€¯á€”á€ºá€¸) â€” most important
- Building size in sqft (á€¡á€†á€±á€¬á€€á€ºá€¡á€¦á€¸ á€¡á€€á€»á€šá€ºá€¡á€á€”á€ºá€¸) â€” needed for per-sqft comparison
- Township / Location (á€™á€¼á€­á€¯á€·á€”á€šá€º) â€” needed for market context
- Property type (á€¡á€™á€»á€­á€¯á€¸á€¡á€…á€¬á€¸) â€” e.g. condo, landed house, apartment
- Bedrooms / Floors â€” helpful but lower priority

If the listing already has price, area, and township â€” return is_complete: true and an empty questions array.

RULES:
- Maximum 3 questions
- Questions must be in natural, friendly Burmese
- Do NOT ask about things already in the listing
- Do NOT ask about legal documents, title deeds, or negotiation â€” those are for the analysis
- Keep each question short (one sentence)

Return ONLY this JSON:
{
  "is_complete": true | false,
  "questions": ["(Burmese question 1)", "(Burmese question 2)"]
}`

export async function POST(req: NextRequest) {
  let listing: string
  try {
    const body = await req.json()
    listing = (body.listing ?? '').trim()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!listing) return NextResponse.json({ error: 'Listing text required' }, { status: 400 })

  try {
    const openai = getOpenAI()
    const completion = await openai.chat.completions.create({
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: CLARIFY_PROMPT },
        { role: 'user', content: listing },
      ],
      temperature: 0,
      max_tokens: 300,
    })
    const parsed = JSON.parse(completion.choices[0].message.content ?? '{}')
    return NextResponse.json({
      is_complete: parsed.is_complete === true,
      questions: Array.isArray(parsed.questions) ? parsed.questions.slice(0, 3) : [],
    })
  } catch (err) {
    console.error('[clarify] error:', err instanceof Error ? err.message : String(err))
    // On error, fall through to analysis directly
    return NextResponse.json({ is_complete: true, questions: [] })
  }
}

