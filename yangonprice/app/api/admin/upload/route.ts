import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Role check: user must have admin role in Clerk public metadata
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const role = (user.publicMetadata as { role?: string }).role
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: {
    township: string
    property_type: string
    price_total_lakhs: number
    area_sqft: number
    notes?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { township, property_type, price_total_lakhs, area_sqft } = body
  if (!township || !property_type || !price_total_lakhs || !area_sqft) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (area_sqft <= 0) {
    return NextResponse.json({ error: 'area_sqft must be positive' }, { status: 400 })
  }

  const { data, error } = await supabase.from('comparables').insert({
    township,
    property_type,
    price_total_lakhs,
    area_sqft,
    notes: body.notes ?? null,
    uploaded_by: userId,
  }).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, row: data })
}
