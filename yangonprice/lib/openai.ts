import OpenAI from 'openai'
import { ComparableRow, MarketDataRow } from './types'

// Primary model for analysis — set OPENROUTER_MODEL in Vercel env vars to switch
// Examples:
//   meta-llama/llama-3.3-70b-instruct        (default, free tier available)
//   openai/gpt-4o-mini                        (fast, cheap)
//   openai/gpt-4o                             (best quality)
//   google/gemini-flash-1.5                   (fast, multimodal)
//   google/gemini-pro-1.5                     (high quality)
//   anthropic/claude-3-5-haiku                (fast)
//   anthropic/claude-sonnet-4-5               (best quality)
export const MAIN_MODEL = process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini'

// Fast model for clarify questions and chat — lightweight tasks
export const FAST_MODEL = process.env.OPENROUTER_FAST_MODEL ?? 'openai/gpt-4o-mini'

let _client: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (_client) return _client
  const key = process.env.OPENROUTER_API_KEY
  if (!key) throw new Error('Missing OPENROUTER_API_KEY')
  _client = new OpenAI({ apiKey: key, baseURL: 'https://openrouter.ai/api/v1' })
  return _client
}

export const openaiClient = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getOpenAI() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export function buildUserMessage(
  listingText: string,
  comparables: ComparableRow[],
  marketData: MarketDataRow[] = [],
): string {
  const comparablesSection =
    comparables.length === 0
      ? 'COMPARABLE LISTINGS: None available.'
      : `COMPARABLE LISTINGS (admin-uploaded, use for per-sqft benchmarking):
${comparables
  .map(
    (c) =>
      `- Township: ${c.township} | Type: ${c.property_type} | Total: ${c.price_total_lakhs} lakhs | Area: ${c.area_sqft} sqft | Per sqft: ${c.price_per_sqft_lakhs.toFixed(2)} lakhs/sqft`,
  )
  .join('\n')}`

  const marketSection =
    marketData.length === 0
      ? 'MARKET DATA: None available.'
      : `MARKET DATA (admin-ingested):
${marketData
  .map((m) => {
    const parts: string[] = []
    if (m.township) parts.push(m.township)
    if (m.property_type) parts.push(m.property_type)
    if (m.price_lakh) parts.push(`${m.price_lakh}L`)
    if (m.building_size_sqft) parts.push(`${m.building_size_sqft}sqft`)
    if (m.bedrooms) parts.push(`${m.bedrooms}BR`)
    if (m.floors) parts.push(`${m.floors}F`)
    return `- ${parts.join(', ')}`
  })
  .join('\n')}`

  const hasData = comparables.length > 0 || marketData.length > 0
  const noDataNote = hasData ? '' : '\nNo admin-uploaded market data is available. Apply your general knowledge of the Yangon market and clearly note this in method_note.'

  return `PROPERTY LISTING (user pasted):
${listingText}

${comparablesSection}

${marketSection}${noDataNote}`
}
