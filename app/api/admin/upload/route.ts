import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/adminAuth'

export async function POST(req: NextRequest) {
  const { authorized, error } = checkAdminAuth()
  if (!authorized) return error!

  let body: { township: string; property_type: string; price_total_lakhs: number; area_sqft: number; notes?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { township, property_type, price_total_lakhs, area_sqft } = body
  if (!township || !property_type || !price_total_lakhs || !area_sqft) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (area_sqft <= 0) {
    return NextResponse.json({ error: 'area_sqft must be positive' }, { status: 400 })
  }

  const { data, error: dbError } = await supabase.from('comparables').insert({
    township, property_type, price_total_lakhs, area_sqft,
    notes: body.notes ?? null,
    uploaded_by: 'admin',
  }).select().single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true, row: data })
}
