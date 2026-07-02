import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from('market_data')
    .select('id, township, property_type, location, price_lakh, land_size, building_size_sqft, bedrooms, bathrooms, floors, raw_content, analysis_json, executive_summary_mm, analysis_decision, analysis_generated_at, created_at')
    .eq('id', params.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ property: data })
}
