import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Aggregate comparables by township
  const { data: comps, error } = await supabase
    .from('comparables')
    .select('township, property_type, price_total_lakhs, area_sqft, price_per_sqft_lakhs, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Group by township
  const map: Record<string, {
    township: string
    count: number
    avg_price_per_sqft: number
    min_price_per_sqft: number
    max_price_per_sqft: number
    avg_total_lakhs: number
    property_types: string[]
    latest: string
  }> = {}

  for (const row of (comps ?? [])) {
    const t = row.township ?? 'Unknown'
    if (!map[t]) {
      map[t] = { township: t, count: 0, avg_price_per_sqft: 0, min_price_per_sqft: Infinity, max_price_per_sqft: 0, avg_total_lakhs: 0, property_types: [], latest: row.created_at }
    }
    const m = map[t]
    m.count++
    m.avg_price_per_sqft += row.price_per_sqft_lakhs
    m.avg_total_lakhs += row.price_total_lakhs
    if (row.price_per_sqft_lakhs < m.min_price_per_sqft) m.min_price_per_sqft = row.price_per_sqft_lakhs
    if (row.price_per_sqft_lakhs > m.max_price_per_sqft) m.max_price_per_sqft = row.price_per_sqft_lakhs
    if (!m.property_types.includes(row.property_type)) m.property_types.push(row.property_type)
  }

  const townships = Object.values(map).map(m => ({
    ...m,
    avg_price_per_sqft: Math.round((m.avg_price_per_sqft / m.count) * 100) / 100,
    avg_total_lakhs: Math.round((m.avg_total_lakhs / m.count) * 10) / 10,
    min_price_per_sqft: m.min_price_per_sqft === Infinity ? 0 : Math.round(m.min_price_per_sqft * 100) / 100,
  })).sort((a, b) => b.count - a.count)

  return NextResponse.json({ townships })
}
