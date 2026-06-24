import { NextRequest, NextResponse } from 'next/server'
import { openaiClient, buildUserMessage } from '@/lib/openai'
import { supabase } from '@/lib/supabase'
import { SYSTEM_PROMPT } from '@/lib/systemPrompt'
import { AnalysisResponse, ComparableRow } from '@/lib/types'

// Set to "true" in .env to require Clerk auth for the analysis form
const REQUIRE_AUTH_FOR_ANALYSIS = process.env.REQUIRE_AUTH_FOR_ANALYSIS === 'true'

export async function POST(req: NextRequest) {
  // Auth gate — currently off for demo; flip REQUIRE_AUTH_FOR_ANALYSIS=true to enable
  if (REQUIRE_AUTH_FOR_ANALYSIS) {
    const { auth } = await import('@clerk/nextjs/server')
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  let listingText: string
  try {
    const body = await req.json()
    listingText = (body.listing ?? '').trim()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!listingText) {
    return NextResponse.json({ error: 'Listing text is required' }, { status: 400 })
  }

  // Fetch comparables from Supabase
  let comparables: ComparableRow[] = []
  try {
    const { data, error } = await supabase
      .from('comparables')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) {
      comparables = data as ComparableRow[]
    }
  } catch {
    // Non-fatal: proceed with empty dataset; model will say comparison unavailable
  }

  // Call OpenAI
  let rawJson: string
  try {
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserMessage(listingText, comparables) },
      ],
      temperature: 0.2,
    })
    rawJson = completion.choices[0].message.content ?? '{}'
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'OpenAI call failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(rawJson)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON from model' }, { status: 502 })
  }

  // Apply decision override: if local_authority has red flags, force AVOID
  const internal = parsed._internal_actor_analysis as Record<string, Record<string, string>> | undefined
  if (internal?.local_authority) {
    const { rule_clarity, accountability } = internal.local_authority
    const redFlagTerms = ['red flag', 'disputed', 'enforcement failure', 'invalid', 'forged', 'မမှန်', 'အငြင်းပွားမှု']
    const hasRedFlag = redFlagTerms.some(
      (t) =>
        rule_clarity?.toLowerCase().includes(t) ||
        accountability?.toLowerCase().includes(t),
    )
    if (hasRedFlag) {
      parsed.decision = 'AVOID'
    }
  }

  // Strip internal actor analysis — never send to browser
  delete parsed._internal_actor_analysis

  // Clamp confidence to 0–100 integer
  if (typeof parsed.confidence === 'number') {
    // Handle 0–1 fraction from model
    if (parsed.confidence > 0 && parsed.confidence <= 1) {
      parsed.confidence = Math.round(parsed.confidence * 100)
    } else {
      parsed.confidence = Math.round(Math.min(100, Math.max(0, parsed.confidence)))
    }
  }

  const response = parsed as unknown as AnalysisResponse

  // Log to Supabase (non-fatal)
  try {
    await supabase.from('analyses').insert({
      raw_input: listingText,
      decision: response.decision,
      method_note: response.method_note,
      property_summary: response.property_summary,
      price_analysis: response.price_analysis,
      considerations: response.considerations,
      comparison: response.comparison,
      risk_assessment: response.risk_assessment,
      recommendation: response.recommendation,
      confidence: response.confidence,
      extracted_data: response.extracted_data,
    })
  } catch {
    // Non-fatal
  }

  return NextResponse.json(response)
}
