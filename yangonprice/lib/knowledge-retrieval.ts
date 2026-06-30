import { supabase } from './supabase'
import { ComparableRow, MarketDataRow } from './types'
import { getAdjacentTownships } from './townships'

export type ReliabilityTier =
  | 'Government'
  | 'LicensedBank'
  | 'MajorDeveloper'
  | 'VerifiedAgency'
  | 'VerifiedAgent'
  | 'FacebookListing'
  | 'UnknownSource'

const RELIABILITY_SCORES: Record<ReliabilityTier, number> = {
  Government: 1.0,
  LicensedBank: 0.95,
  MajorDeveloper: 0.9,
  VerifiedAgency: 0.8,
  VerifiedAgent: 0.6,
  FacebookListing: 0.3,
  UnknownSource: 0.1,
}

function freshnessScore(createdAt: string | null): number {
  if (!createdAt) return 0.1
  const ageMs = Date.now() - new Date(createdAt).getTime()
  const ageDays = ageMs / (1000 * 60 * 60 * 24)
  if (ageDays <= 30) return 1.0
  if (ageDays <= 90) return 0.8
  if (ageDays <= 180) return 0.5
  return 0.2
}

function relevanceScore(recordTownship: string | null, recordType: string | null, targetTownship: string, targetType: string): number {
  const townshipMatch = recordTownship === targetTownship
  const nearbyTownships = getAdjacentTownships(targetTownship)
  const nearbyMatch = recordTownship ? nearbyTownships.includes(recordTownship) : false
  const typeMatch = recordType?.toLowerCase() === targetType?.toLowerCase()

  if (townshipMatch && typeMatch) return 1.0
  if (nearbyMatch && typeMatch) return 0.7
  if (townshipMatch) return 0.6
  if (typeMatch) return 0.4
  if (nearbyMatch) return 0.3
  return 0.2
}

export interface RankedEvidence {
  comparables: ComparableRow[]
  marketData: MarketDataRow[]
  kbVersion: number
  dataFreshnessSummary: string
}

export async function getRankedEvidence(township: string, propertyType: string): Promise<RankedEvidence> {
  const adjacentTownships = getAdjacentTownships(township)
  const allTownships = [township, ...adjacentTownships]

  const [compRes, marketRes, kbRes] = await Promise.all([
    supabase
      .from('comparables')
      .select('*')
      .in('township', allTownships)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('market_data')
      .select('id,township,property_type,price_lakh,building_size_sqft,land_size,bedrooms,bathrooms,floors,extraction_notes,market_data_type,reliability_tier,created_at')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('kb_versions')
      .select('version')
      .order('version', { ascending: false })
      .limit(1),
  ])

  const kbVersion = kbRes.data?.[0]?.version ?? 1

  // Score and rank comparables
  const rankedComparables = (compRes.data ?? [])
    .map((row: ComparableRow & { reliability_tier?: string; created_at?: string }) => ({
      row,
      score: RELIABILITY_SCORES[(row.reliability_tier as ReliabilityTier) ?? 'UnknownSource'] *
        freshnessScore(row.created_at ?? null) *
        relevanceScore(row.township, row.property_type, township, propertyType),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 15)
    .map(r => r.row)

  // Score and rank market data
  const rankedMarketData = (marketRes.data ?? [])
    .map((row: MarketDataRow & { reliability_tier?: string; created_at?: string }) => ({
      row,
      score: RELIABILITY_SCORES[(row.reliability_tier as ReliabilityTier) ?? 'UnknownSource'] *
        freshnessScore(row.created_at ?? null) *
        relevanceScore(row.township, row.property_type, township, propertyType),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map(r => r.row)

  // Data freshness summary
  const allDates = [
    ...(compRes.data ?? []).map((r: { created_at?: string }) => r.created_at),
    ...(marketRes.data ?? []).map((r: { created_at?: string }) => r.created_at),
  ].filter(Boolean) as string[]

  const fresh = allDates.filter(d => {
    const days = (Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24)
    return days <= 30
  }).length
  const pct = allDates.length > 0 ? Math.round((fresh / allDates.length) * 100) : 0
  const dataFreshnessSummary = allDates.length === 0
    ? 'No market data available'
    : `${pct}% of evidence is under 30 days old (${allDates.length} records)`

  return { comparables: rankedComparables, marketData: rankedMarketData, kbVersion, dataFreshnessSummary }
}

export async function incrementKBVersion(label: string): Promise<number> {
  const { data } = await supabase
    .from('kb_versions')
    .select('version')
    .order('version', { ascending: false })
    .limit(1)

  const nextVersion = (data?.[0]?.version ?? 0) + 1
  await supabase.from('kb_versions').insert({ version: nextVersion, label })
  return nextVersion
}
