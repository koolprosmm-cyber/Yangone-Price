import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const township = searchParams.get('township')?.trim() ?? ''
  const type = searchParams.get('type')?.trim() ?? ''

  let query = supabase
    .from('comparables')
    .select('*')
    .order('created_at', { ascending: false })

  if (township) query = query.ilike('township', `%${township}%`)
  if (type) query = query.ilike('property_type', `%${type}%`)

  const { data, error } = await query.limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ results: data ?? [] })
}
