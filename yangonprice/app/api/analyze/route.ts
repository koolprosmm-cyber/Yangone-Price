import { NextRequest, NextResponse } from 'next/server'
import { getAIProvider } from '@/lib/ai-provider'
import { buildUserMessage } from '@/lib/openai'
import { supabase } from '@/lib/supabase'
import { SYSTEM_PROMPT } from '@/lib/systemPrompt'
import { SELLER_PROMPT } from '@/lib/sellerPrompt'
import { AnalysisResponse, ComparableRow, MarketDataRow } from '@/lib/types'
import { computePriceAnalysis, sanitizeAnalysis } from '@/lib/priceUtils'
import { getRankedEvidence } from '@/lib/knowledge-retrieval'

export const maxDuration = 30

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

  // Quick township/type extraction from listing text for evidence ranking
  const townshipGuess = guessTownship(listingText)
  const typeGuess = guessPropertyType(listingText)

  // Get ranked evidence from knowledge base
  let evidence: { comparables: ComparableRow[]; marketData: MarketDataRow[]; kbVersion: number; dataFreshnessSummary: string } = { comparables: [], marketData: [], kbVersion: 1, dataFreshnessSummary: 'No data' }
  try {
    evidence = await getRankedEvidence(townshipGuess, typeGuess)
  } catch { }

  const { comparables, marketData, kbVersion, dataFreshnessSummary } = evidence
  const provider = getAIProvider()
  const systemPrompt = mode === 'seller' ? SELLER_PROMPT : SYSTEM_PROMPT

  console.log('[analyze] comparables:', comparables.length, 'marketData:', marketData.length, 'kb:', kbVersion)

  let rawJson: string
  try {
    const completion = await provider.client.chat.completions.create({
      model: provider.model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: buildUserMessage(listingText, comparables, marketData) },
      ],
      temperature: 0,
    })
    rawJson = completion.choices[0].message.content ?? '{}'
  } catch (err) {
    console.error('[analyze] AI error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Unable to generate analysis. Please try again.' }, { status: 502 })
  }

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(rawJson)
  } catch (err) {
    console.error('[analyze] JSON parse error:', err, 'raw:', rawJson?.slice(0, 200))
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

  // Server-side decision override — prevents AI contradicting price math
  if (mode === 'buyer' && typeof userPerSqft === 'number' && typeof marketPerSqft === 'number') {
    if (position === 'ABOVE') parsed.decision = 'OVERPRICED'
    else if (position === 'BELOW') parsed.decision = 'GOOD VALUE'
    else parsed.decision = 'FAIR PRICE'
  }

  // Attach trust metadata
  parsed.trust_metadata = {
    generatedAt: new Date().toISOString(),
    aiModel: provider.providerName,
    knowledgeBaseVersion: kbVersion,
    dataFreshnessSummary,
  }

  const response = sanitizeAnalysis(parsed as unknown as AnalysisResponse)

  // Save to analyses table
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
      kb_version: kbVersion,
      ai_model: provider.providerName,
    })
  } catch { }

  return NextResponse.json(response)
}

// Fast heuristic to guess township from listing text for evidence pre-ranking
function guessTownship(text: string): string {
  const townships = [
    'စမ်းချောင်း', 'ကမာရွတ်', 'မင်္ဂလာတောင်ညွန့်', 'ဗိုလ်တထောင်', 'လသာ',
    'ပုဇွန်တောင်', 'ဒဂုံ', 'ကြည့်မြင်တိုင်', 'သာကေတ', 'သင်္ဃန်းကျွန်း',
    'မရမ်းကုန်း', 'ရန်ကင်း', 'တောင်ဥက္ကလာပ', 'မြောက်ဥက္ကလာပ', 'လှိုင်',
    'လှိုင်သာယာ', 'အင်းစိန်', 'မင်္ဂလာဒုံ', 'ဒဂုံဆိပ်ကမ်း', 'ဒဂုံမြို့သစ်',
  ]
  return townships.find(t => text.includes(t)) ?? ''
}

function guessPropertyType(text: string): string {
  if (text.includes('တိုက်ခန်း') || text.includes('ကွန်ဒို')) return 'တိုက်ခန်း'
  if (text.includes('မြေကွက်') || text.includes('မြေ')) return 'မြေကွက်'
  if (text.includes('လုံးချင်း') || text.includes('RC') || text.includes('အိမ်')) return 'လုံးချင်းအိမ်'
  return ''
}
