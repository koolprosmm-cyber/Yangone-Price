import OpenAI from 'openai'
import { ComparableRow, MarketDataRow } from './types'

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
