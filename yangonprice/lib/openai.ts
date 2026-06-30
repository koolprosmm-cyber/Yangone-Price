import OpenAI from 'openai'
import { ComparableRow } from './types'

let _client: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (_client) return _client
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('Missing GROQ_API_KEY')
  _client = new OpenAI({ apiKey: key, baseURL: 'https://api.groq.com/openai/v1' })
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
): string {
  const datasetSection =
    comparables.length === 0
      ? 'MARKET DATASET: No comparable listings are available in the dataset for this analysis. Do not invent or assume market prices — use "UNKNOWN" for position and state comparison is not available per your rules.'
      : `MARKET DATASET (admin-uploaded comparables):
${comparables
  .map(
    (c) =>
      `- Township: ${c.township} | Type: ${c.property_type} | Total: ${c.price_total_lakhs} lakhs | Area: ${c.area_sqft} sqft | Per sqft: ${c.price_per_sqft_lakhs.toFixed(2)} lakhs/sqft`,
  )
  .join('\n')}`

  return `PROPERTY LISTING (user pasted):
${listingText}

${datasetSection}`
}
