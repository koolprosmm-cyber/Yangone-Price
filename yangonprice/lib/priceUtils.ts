import { PricePosition } from './types'

export function computePricePosition(
  userPerSqft: number | null,
  marketPerSqft: number | null,
): Pick<PricePosition, 'position' | 'delta_percent'> {
  if (userPerSqft == null || marketPerSqft == null || marketPerSqft === 0) {
    return { position: 'UNKNOWN', delta_percent: null }
  }
  const delta = ((userPerSqft - marketPerSqft) / marketPerSqft) * 100
  let position: PricePosition['position']
  if (delta <= -5) position = 'BELOW'
  else if (delta >= 5) position = 'ABOVE'
  else position = 'AT_MARKET'
  return { position, delta_percent: Math.round(delta * 10) / 10 }
}
