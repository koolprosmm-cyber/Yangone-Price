import { NextRequest, NextResponse } from 'next/server'
import { openaiClient, buildUserMessage } from '@/lib/openai'
import { supabase } from '@/lib/supabase'
import { SYSTEM_PROMPT } from '@/lib/systemPrompt'
import { AnalysisResponse, ComparableRow } from '@/lib/types'
import { computePriceAnalysis } from '@/lib/priceUtils'

export async function POST(req: NextRequest) {
  let listingText: string
  try {
    const body = await req.json()
    listingText = (body.listing ?? '').trim()
  } catch {
    return NextResponse.json({ error: 'Unable to generate analysis. Please try again.' }, { status: 400 })
  }

  if (!listingText) {
    return NextResponse.json({ error: 'Please paste a property listing.' }, { status: 400 })
  }

  // Fetch comparables
  let comparables: ComparableRow[] = []
  try {
    const { data, error } = await supabase
      .from('comparables')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) comparables = data as ComparableRow[]
  } catch {
    // Non-fatal
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
  } catch {
    return NextResponse.json(
      { error: 'Unable to generate analysis. Please try again.' },
      { status: 502 }
    )
  }

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(rawJson)
  } catch {
    return NextResponse.json(
      { error: 'Unable to generate analysis. Please try again.' },
      { status: 502 }
    )
  }

  // Compute position and delta_percent server-side from normalized per-sqft values
  const modelPriceAnalysis = parsed.price_analysis as Record<string, number | null> | undefined
  const userPerSqft = modelPriceAnalysis?.user_price_per_sqft_lakh ?? null
  const marketPerSqft = modelPriceAnalysis?.market_average_per_sqft_lakh ?? null
  const { position, delta_percent } = computePriceAnalysis(
    typeof userPerSqft === 'number' ? userPerSqft : null,
    typeof marketPerSqft === 'number' ? marketPerSqft : null,
  )

  parsed.price_analysis = {
    user_price_per_sqft_lakh: userPerSqft,
    market_average_per_sqft_lakh: marketPerSqft,
    position,
    delta_percent,
  }

  const response = parsed as unknown as AnalysisResponse

  // Log to Supabase (non-fatal)
  try {
    await supabase.from('analyses').insert({
      raw_input: listingText,
      decision: response.decision,
      property_summary: response.market_observations,
      considerations: response.investment_potential_reasoning,
      risk_assessment: response.potential_risks,
      recommendation: response.suggested_next_steps,
      confidence: response.confidence,
      extracted_data: response.extracted_data,
      price_analysis: response.price_analysis,
    })
  } catch {
    // Non-fatal
  }

  return NextResponse.json(response)
}
