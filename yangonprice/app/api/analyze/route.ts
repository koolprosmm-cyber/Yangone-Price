import { NextRequest, NextResponse } from 'next/server'
import { getAIProvider } from '@/lib/ai-provider'
import { buildUserMessage } from '@/lib/openai'
import { supabase } from '@/lib/supabase'
import { SYSTEM_PROMPT } from '@/lib/systemPrompt'
import { AnalysisResponse, ComparableRow, MarketDataRow } from '@/lib/types'
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

  const townshipGuess = guessTownship(listingText)
  const typeGuess = guessPropertyType(listingText)

  let evidence: { comparables: ComparableRow[]; marketData: MarketDataRow[]; kbVersion: number; dataFreshnessSummary: string } = {
    comparables: [], marketData: [], kbVersion: 1, dataFreshnessSummary: 'No data'
  }
  try {
    evidence = await getRankedEvidence(townshipGuess, typeGuess)
  } catch { }

  const { comparables, marketData, kbVersion, dataFreshnessSummary } = evidence
  const provider = getAIProvider()

  console.log('[analyze] comparables:', comparables.length, 'marketData:', marketData.length, 'kb:', kbVersion)

  let rawJson: string
  try {
    const completion = await provider.client.chat.completions.create({
      model: provider.model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
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

  // Server-side price position — override whatever AI returned
  const pricePos = parsed.price_position as Record<string, unknown> | undefined
  const userPerSqft = typeof pricePos?.user_price_per_sqft_lakh === 'number' ? pricePos.user_price_per_sqft_lakh : null
  const marketPerSqft = typeof pricePos?.market_avg_per_sqft_lakh === 'number' ? pricePos.market_avg_per_sqft_lakh : null

  let position: 'ABOVE' | 'BELOW' | 'AT_MARKET' | 'UNKNOWN' = 'UNKNOWN'
  let delta_percent: number | null = null

  if (userPerSqft !== null && marketPerSqft !== null && marketPerSqft > 0) {
    delta_percent = Math.round(((userPerSqft - marketPerSqft) / marketPerSqft) * 100)
    if (delta_percent > 5) position = 'ABOVE'
    else if (delta_percent < -5) position = 'BELOW'
    else position = 'AT_MARKET'
  }

  parsed.price_position = {
    ...(pricePos ?? {}),
    user_price_per_sqft_lakh: userPerSqft,
    market_avg_per_sqft_lakh: marketPerSqft,
    position,
    delta_percent,
  }

  // Verdict override when price math is available
  if (mode === 'buyer' && position !== 'UNKNOWN') {
    if (position === 'ABOVE') parsed.verdict = 'WAIT'
    else if (position === 'BELOW') parsed.verdict = 'BUY'
    else parsed.verdict = 'BUY'
  }

  parsed.mode = mode
  parsed.trust_metadata = {
    generatedAt: new Date().toISOString(),
    aiModel: provider.providerName,
    knowledgeBaseVersion: kbVersion,
    dataFreshnessSummary,
  }

  const response = parsed as unknown as AnalysisResponse

  try {
    await supabase.from('analyses').insert({
      raw_input: listingText,
      decision: response.verdict,
      property_summary: response.market_summary,
      considerations: response.investment_potential,
      risk_assessment: JSON.stringify(response.red_flags),
      recommendation: JSON.stringify(response.next_steps),
      confidence: response.confidence,
      extracted_data: response.extracted_signal,
      price_analysis: response.price_position,
      kb_version: kbVersion,
      ai_model: provider.providerName,
    })
  } catch { }

  return NextResponse.json(response)
}

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
