import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAIProvider } from '@/lib/ai-provider'
import { ADMIN_INGESTION_PROMPT } from '@/lib/adminIngestionPrompt'
import { checkAdminAuth } from '@/lib/adminAuth'
import { incrementKBVersion } from '@/lib/knowledge-retrieval'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const { authorized, error } = checkAdminAuth()
  if (!authorized) return error!

  let rawContent: string
  try {
    const body = await req.json()
    rawContent = (body.raw_content ?? '').trim()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!rawContent) return NextResponse.json({ error: 'Content required' }, { status: 400 })

  // Split on --- separator (with optional whitespace)
  const listings = rawContent
    .split(/\n\s*---+\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 20)

  if (listings.length === 0) return NextResponse.json({ error: 'No listings found' }, { status: 400 })
  if (listings.length > 20) return NextResponse.json({ error: 'Maximum 20 listings per batch' }, { status: 400 })

  const provider = getAIProvider()
  const results: Array<{ success: boolean; listing_preview: string; extracted?: Record<string, unknown>; error?: string }> = []

  // Process all listings in parallel
  await Promise.all(listings.map(async (listing, index) => {
    const preview = listing.slice(0, 80).replace(/\n/g, ' ')
    try {
      const completion = await provider.client.chat.completions.create({
        model: provider.model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: ADMIN_INGESTION_PROMPT },
          { role: 'user', content: listing },
        ],
        temperature: 0,
      })

      const extracted = JSON.parse(completion.choices[0].message.content ?? '{}') as Record<string, unknown>

      const { error: insertError } = await supabase.from('market_data').insert({
        raw_content: listing,
        market_data_type: extracted.market_data_type ?? null,
        property_type: extracted.property_type ?? null,
        township: extracted.township ?? null,
        location: extracted.location ?? null,
        price_lakh: extracted.price_lakh ?? null,
        land_size: extracted.land_size ?? null,
        building_size_sqft: extracted.building_size_sqft ?? null,
        bedrooms: extracted.bedrooms ?? null,
        bathrooms: extracted.bathrooms ?? null,
        floors: extracted.floors ?? null,
        listing_date: extracted.listing_date ?? null,
        upload_date: new Date().toISOString().split('T')[0],
        confidence_score: extracted.confidence_score ?? null,
        extraction_notes: extracted.extraction_notes ?? null,
        uploaded_by: 'admin',
        reliability_tier: 'FacebookListing',
      })

      if (insertError) {
        results[index] = { success: false, listing_preview: preview, error: insertError.message }
      } else {
        results[index] = { success: true, listing_preview: preview, extracted }
      }
    } catch (err) {
      results[index] = {
        success: false,
        listing_preview: preview,
        error: err instanceof Error ? err.message : 'Unknown error',
      }
    }
  }))

  const successCount = results.filter(r => r.success).length

  // Increment KB version once for the whole batch
  if (successCount > 0) {
    await incrementKBVersion(`Bulk ingestion: ${successCount} listings added`)
  }

  return NextResponse.json({ results, successCount, totalCount: listings.length })
}
