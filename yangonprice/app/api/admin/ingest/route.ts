import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getOpenAI, buildUserMessage } from '@/lib/openai'
import { ADMIN_INGESTION_PROMPT } from '@/lib/adminIngestionPrompt'
import { SYSTEM_PROMPT } from '@/lib/systemPrompt'
import { AnalysisResponse, ComparableRow, MarketDataRow } from '@/lib/types'
import { computePriceAnalysis, sanitizeAnalysis } from '@/lib/priceUtils'
import { checkAdminAuth } from '@/lib/adminAuth'

export async function POST(req: NextRequest) {
  const { authorized, error } = checkAdminAuth()
  if (!authorized) return error!

  let rawContent: string
  try {
    const body = await req.json()
    rawContent = (body.raw_content ?? '').trim()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (!rawContent) return NextResponse.json({ error: 'Content is required' }, { status: 400 })

  const openai = getOpenAI()

  let extracted: Record<string, unknown>
  try {
    const completion = await openai.chat.completions.create({
      model: 'meta-llama/llama-3.3-70b-instruct',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: ADMIN_INGESTION_PROMPT },
        { role: 'user', content: rawContent },
      ],
      temperature: 0,
    })
    extracted = JSON.parse(completion.choices[0].message.content ?? '{}')
  } catch {
    return NextResponse.json({ error: 'AI extraction failed. Please try again.' }, { status: 502 })
  }

  const { data: record, error: insertError } = await supabase.from('market_data').insert({
    raw_content: rawContent,
    market_data_type: extracted.market_data_type ?? null,
    property_type: extracted.property_type ?? null,
    township: extracted.township ?? null,
    location: extracted.location ?? null,
    price_lakh: extracted.price_lakh ?? null,
    land_size: extracted.land_size ?? null,
    building_size_sqft: extracted.building_size_sqft ?? null,
    bedrooms: extracted.bedrooms ?? null,
    bathrooms: extracted.bathrooms ?? null,
    floors: extracted.floors ?? null,
    listing_date: extracted.listing_date ?? null,
    upload_date: new Date().toISOString().split('T')[0],
    confidence_score: extracted.confidence_score ?? null,
    extraction_notes: extracted.extraction_notes ?? null,
    uploaded_by: 'admin',
  }).select().single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  runAnalysis(record.id, rawContent).catch(() => { })

  return NextResponse.json({ success: true, record, extracted })
}

async function runAnalysis(recordId: string, rawContent: string) {
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

  const completion = await openai.chat.completions.create({
    model: 'meta-llama/llama-3.3-70b-instruct',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserMessage(rawContent, comparables, marketData) },
    ],
    temperature: 0,
  })

  const parsed = JSON.parse(completion.choices[0].message.content ?? '{}') as Record<string, unknown>
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
}




