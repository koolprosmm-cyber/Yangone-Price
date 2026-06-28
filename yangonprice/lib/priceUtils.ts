import { PriceAnalysis } from './types'

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
