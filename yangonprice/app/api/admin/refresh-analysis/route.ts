import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getOpenAI, buildUserMessage } from '@/lib/openai'
import { SYSTEM_PROMPT } from '@/lib/systemPrompt'
import { AnalysisResponse, ComparableRow, MarketDataRow } from '@/lib/types'
import { computePriceAnalysis, sanitizeAnalysis } from '@/lib/priceUtils'
import { checkAdminAuth } from '@/lib/adminAuth'

export async function POST(req: NextRequest) {
  const { authorized, error } = checkAdminAuth()
  if (!authorized) return error!

  let recordId: string
  try {
    const body = await req.json()
    recordId = body.id
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { data: record, error: fetchError } = await supabase.from('market_data').select('raw_content').eq('id', recordId).single()
  if (fetchError || !record) return NextResponse.json({ error: 'Record not found' }, { status: 404 })

  const openai = getOpenAI()
  let comparables: ComparableRow[] = []
  let marketData: MarketDataRow[] = []
  try {
    const [compRes, marketRes] = await Promise.all([
      supabase.from('comparables').select('*').order('created_at', { ascending: false }),
      supabase.from('market_data').select('id,township,property_type,price_lakh,building_size_sqft,land_size,bedrooms,bathrooms,floors,extraction_notes,market_data_type').order('created_at', { ascending: false }).limit(20),
    ])
    if (compRes.data) comparables = compRes.data as ComparableRow[]
    if (marketRes.data) marketData = marketRes.data as MarketDataRow[]
  } catch { }

  let parsed: Record<string, unknown>
  try {
    const completion = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserMessage(record.raw_content, comparables, marketData) },
      ],
      temperature: 0,
    })
    parsed = JSON.parse(completion.choices[0].message.content ?? '{}')
  } catch {
    return NextResponse.json({ error: 'AI analysis failed.' }, { status: 502 })
  }

  const modelPA = parsed.price_analysis as Record<string, number | null> | undefined
  const userPerSqft = typeof modelPA?.user_price_per_sqft_lakh === 'number' ? modelPA.user_price_per_sqft_lakh : null
  const marketPerSqft = typeof modelPA?.market_average_per_sqft_lakh === 'number' ? modelPA.market_average_per_sqft_lakh : null
  const { position, delta_percent } = computePriceAnalysis(userPerSqft, marketPerSqft)
  parsed.price_analysis = { user_price_per_sqft_lakh: userPerSqft, market_average_per_sqft_lakh: marketPerSqft, position, delta_percent }

  const result = sanitizeAnalysis(parsed as unknown as AnalysisResponse)

  await supabase.from('market_data').update({
    analysis_json: result,
    executive_summary_mm: result.investment_potential_reasoning ?? '',
    analysis_decision: result.decision ?? null,
    analysis_generated_at: new Date().toISOString(),
  }).eq('id', recordId)

  return NextResponse.json({ success: true, analysis: result })
}



