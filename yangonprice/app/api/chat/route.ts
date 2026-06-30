import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI, FAST_MODEL } from '@/lib/openai'

export const dynamic = 'force-dynamic'

const CHAT_SYSTEM = `You are Property Market Advisor â€” an AI property analyst for the Yangon, Myanmar real estate market.

The user has already received a Property Intelligence Report for a specific listing. They are now asking follow-up questions about that property or the report.

You have been given:
- The original property listing text
- The key findings from the intelligence report

Your role:
- Answer follow-up questions clearly and helpfully
- Reference specific details from the listing or report when relevant
- Apply your knowledge of the Yangon property market, PIG framework (Policy, Institutions, Governance), and general real estate concepts
- Keep answers concise â€” 2-5 sentences for simple questions, more detail for complex ones
- Always answer in natural, fluent Burmese
- Never provide legal advice or financial advice â€” always say "á€€á€»á€½á€™á€ºá€¸á€€á€»á€„á€ºá€žá€°á€”á€¾á€„á€·á€º á€á€­á€¯á€„á€ºá€•á€„á€ºá€›á€”á€º á€¡á€€á€¼á€¶á€•á€¼á€¯á€žá€Šá€º" when appropriate
- If you don't know something specific, say so clearly rather than guessing`

export async function POST(req: NextRequest) {
  let listing: string
  let reportContext: string
  let messages: { role: 'user' | 'assistant'; content: string }[]

  try {
    const body = await req.json()
    listing = (body.listing ?? '').slice(0, 2000)
    reportContext = (body.reportContext ?? '').slice(0, 1500)
    messages = (body.messages ?? []).slice(-10) // last 10 turns max
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!messages.length) return NextResponse.json({ error: 'No messages' }, { status: 400 })

  const contextBlock = `=== PROPERTY LISTING ===
${listing}

=== REPORT SUMMARY ===
${reportContext}`

  try {
    const openai = getOpenAI()
    const completion = await openai.chat.completions.create({
      model: FAST_MODEL,
      messages: [
        { role: 'system', content: CHAT_SYSTEM },
        { role: 'user', content: contextBlock },
        { role: 'assistant', content: 'á€”á€¬á€¸á€œá€Šá€ºá€•á€«á€•á€¼á€®á‹ á€¡á€á€»á€€á€ºá€¡á€œá€€á€ºá€™á€»á€¬á€¸á€€á€­á€¯ á€œá€±á€·á€œá€¬á€•á€¼á€®á€¸á€•á€«á€•á€¼á€®á‹ á€™á€±á€¸á€œá€­á€¯á€žá€Šá€ºá€™á€»á€¬á€¸ á€™á€±á€¸á€”á€­á€¯á€„á€ºá€•á€«á€žá€Šá€ºá‹' },
        ...messages,
      ],
      temperature: 0.3,
      max_tokens: 600,
    })
    const reply = completion.choices[0].message.content ?? ''
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('[chat] error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Unable to respond. Please try again.' }, { status: 502 })
  }
}


