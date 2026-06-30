import { AnalysisResponse, PriceAnalysis } from './types'

export function computePriceAnalysis(
  userPerSqft: number | null,
  marketPerSqft: number | null,
): Pick<PriceAnalysis, 'position' | 'delta_percent'> {
  if (userPerSqft == null || marketPerSqft == null || marketPerSqft === 0) {
    return { position: 'UNKNOWN', delta_percent: null }
  }
  const delta = ((userPerSqft - marketPerSqft) / marketPerSqft) * 100
  let position: PriceAnalysis['position']
  if (delta <= -5) position = 'BELOW'
  else if (delta >= 5) position = 'ABOVE'
  else position = 'AVERAGE'
  return { position, delta_percent: Math.round(delta * 10) / 10 }
}

// Price-related keywords the AI wrongly flags when price is already known
const PRICE_MISSING_PATTERNS = [
  /ဈေးနှုန်း.*မလုံလောက်/,
  /ဈေးနှုန်း.*မသိ/,
  /ဈေးနှုန်း.*ရရှိရန်/,
  /ဈေးနှုန်း.*စုံစမ်းရန်/,
  /ဈေးနှုန်း.*လိုအပ်/,
  /ဈေးနှုန်း.*ပတ်သက်.*စုံစမ်း/,
  /ဈေးနှုန်း.*ဘယ်လောက်/,
  /price.*missing/i,
  /price.*unavailable/i,
  /price.*unknown/i,
]

function mentionsPrice(s: string): boolean {
  return PRICE_MISSING_PATTERNS.some(p => p.test(s))
}

function filterArr(arr: string[] | undefined, priceKnown: boolean): string[] {
  if (!arr) return []
  if (!priceKnown) return arr
  return arr.filter(s => !mentionsPrice(s))
}

function filterText(s: string | undefined, priceKnown: boolean): string {
  if (!s) return ''
  if (!priceKnown) return s
  // Remove sentences that mention price as missing
  return s
    .split(/(?<=[။။\.\n])/)
    .filter(sentence => !mentionsPrice(sentence))
    .join('')
    .trim()
}

export function sanitizeAnalysis(result: AnalysisResponse): AnalysisResponse {
  const priceKnown = result.extracted_data?.price_lakh != null
  if (!priceKnown) return result
  return {
    ...result,
    potential_risks: filterArr(result.potential_risks, priceKnown),
    missing_information: filterArr(result.missing_information, priceKnown),
    questions_to_verify: filterArr(result.questions_to_verify, priceKnown),
    suggested_next_steps: filterArr(result.suggested_next_steps, priceKnown),
    key_findings: filterArr(result.key_findings, priceKnown),
    investment_potential_reasoning: filterText(result.investment_potential_reasoning, priceKnown),
    market_observations: filterText(result.market_observations, priceKnown),
    confidence_explanation: filterText(result.confidence_explanation, priceKnown),
    method_note: filterText(result.method_note, priceKnown),
  }
}
