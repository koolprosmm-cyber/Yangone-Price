import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const [compsRes, analysesRes, marketRes] = await Promise.all([
    supabase.from('comparables').select('township, property_type, price_per_sqft_lakhs, created_at').order('created_at', { ascending: false }),
    supabase.from('analyses').select('decision, confidence, created_at').order('created_at', { ascending: false }).limit(200),
    supabase.from('market_data').select('market_data_type, township, created_at').order('created_at', { ascending: false }).limit(200),
  ])

  const comps = compsRes.data ?? []
  const analyses = analysesRes.data ?? []
  const market = marketRes.data ?? []

  // Price by township (bar chart data)
  const byTownship: Record<string, { total: number; count: number }> = {}
  for (const c of comps) {
    const t = c.township ?? 'Unknown'
    if (!byTownship[t]) byTownship[t] = { total: 0, count: 0 }
    byTownship[t].total += c.price_per_sqft_lakhs
    byTownship[t].count++
  }
  const priceByTownship = Object.entries(byTownship)
    .map(([township, { total, count }]) => ({ township, avg: Math.round((total / count) * 100) / 100, count }))
    .sort((a, b) => b.avg - a.avg)

  // Decision breakdown
  const decisions: Record<string, number> = { BUY: 0, WAIT: 0, AVOID: 0 }
  for (const a of analyses) {
    const d = a.decision as string
    if (d && decisions[d] !== undefined) decisions[d]++
  }

  // Analyses over time (last 30 days, grouped by date)
  const byDate: Record<string, number> = {}
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  for (const a of analyses) {
    const date = a.created_at?.slice(0, 10)
    if (date && new Date(a.created_at) >= thirtyDaysAgo) {
      byDate[date] = (byDate[date] ?? 0) + 1
    }
  }
  const analysesByDate = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }))

  // Market data type breakdown
  const dataTypes: Record<string, number> = {}
  for (const m of market) {
    const t = m.market_data_type ?? 'Unknown'
    dataTypes[t] = (dataTypes[t] ?? 0) + 1
  }

  return NextResponse.json({
    totals: {
      comparables: comps.length,
      analyses: analyses.length,
      market_data: market.length,
    },
    priceByTownship,
    decisions,
    analysesByDate,
    dataTypes,
  })
}
