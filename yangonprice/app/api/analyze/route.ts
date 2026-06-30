import { NextRequest, NextResponse } from 'next/server'
import { openaiClient, buildUserMessage } from '@/lib/openai'
import { supabase } from '@/lib/supabase'
import { SYSTEM_PROMPT } from '@/lib/systemPrompt'
import { SELLER_PROMPT } from '@/lib/sellerPrompt'
import { AnalysisResponse, ComparableRow, MarketDataRow } from '@/lib/types'
import { computePriceAnalysis, sanitizeAnalysis } from '@/lib/priceUtils'

export async function POST(req: NextRequest) {
  let listingText: string
  let mode: 'buyer' | 'seller' = 'buyer'
  try {
    const body = await req.json()
    listingText = (body.listing ?? '').trim()
    if (body.mode === 'seller') mode = 'seller'
  } catch {
    return NextResponse.json({ error: 'Unable to generate analysis. Please try again.' }, { status: 400 })
  }

  if (!listingText) {
    return NextResponse.json({ error: 'Please paste a property listing.' }, { status: 400 })
  }

  let comparables: ComparableRow[] = []
  let marketData: MarketDataRow[] = []
  try {
    const [compRes, marketRes] = await Promise.all([
      supabase.from('comparables').select('*').order('created_at', { ascending: false }),
      supabase.from('market_data').select('id,township,property_type,price_lakh,building_size_sqft,land_size,bedrooms,bathrooms,floors,extraction_notes,market_data_type').order('created_at', { ascending: false }).limit(50),
    ])
    if (!compRes.error && compRes.data) comparables = compRes.data as ComparableRow[]
    if (!marketRes.error && marketRes.data) marketData = marketRes.data as MarketDataRow[]
  } catch { }

  const systemPrompt = mode === 'seller' ? SELLER_PROMPT : SYSTEM_PROMPT

  let rawJson: string
  try {
    const completion = await openaiClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: buildUserMessage(listingText, comparables, marketData) },
      ],
      temperature: 0,
    })
    rawJson = completion.choices[0].message.content ?? '{}'
  } catch {
    return NextResponse.json({ error: 'Unable to generate analysis. Please try again.' }, { status: 502 })
  }

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(rawJson)
  } catch {
    return NextResponse.json({ error: 'Unable to generate analysis. Please try again.' }, { status: 502 })
  }

  const modelPA = parsed.price_analysis as Record<string, number | null> | undefined
  const userPerSqft = modelPA?.user_price_per_sqft_lakh ?? null
  const marketPerSqft = modelPA?.market_average_per_sqft_lakh ?? null
  const { position, delta_percent } = computePriceAnalysis(
    typeof userPerSqft === 'number' ? userPerSqft : null,
    typeof marketPerSqft === 'number' ? marketPerSqft : null,
  )
  parsed.price_analysis = { user_price_per_sqft_lakh: userPerSqft, market_average_per_sqft_lakh: marketPerSqft, position, delta_percent }
  parsed.mode = mode

  const response = sanitizeAnalysis(parsed as unknown as AnalysisResponse)

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
  } catch { }

  return NextResponse.json(response)
}

