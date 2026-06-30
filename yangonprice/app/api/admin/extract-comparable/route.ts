import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI } from '@/lib/openai'
import { ADMIN_INGESTION_PROMPT } from '@/lib/adminIngestionPrompt'
import { checkAdminAuth } from '@/lib/adminAuth'

export async function POST(req: NextRequest) {
  const { authorized, error } = checkAdminAuth()
  if (!authorized) return error!

  let rawContent: string
  try {
    const body = await req.json()
    rawContent = (body.raw_content ?? '').trim()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (!rawContent) return NextResponse.json({ error: 'Content is required' }, { status: 400 })

  let extracted: Record<string, unknown>
  try {
    const openai = getOpenAI()
    const completion = await openai.chat.completions.create({
      model: 'meta-llama/llama-3.3-70b-instruct',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: ADMIN_INGESTION_PROMPT },
        { role: 'user', content: rawContent },
      ],
      temperature: 0,
    })
    extracted = JSON.parse(completion.choices[0].message.content ?? '{}')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[extract-comparable] AI error:', msg)
    return NextResponse.json({ error: `AI extraction failed: ${msg}` }, { status: 502 })
  }

  return NextResponse.json({
    township: extracted.township ?? '',
    property_type: extracted.property_type ?? '',
    price_total_lakhs: extracted.price_lakh ?? null,
    area_sqft: extracted.building_size_sqft ?? null,
    notes: extracted.extraction_notes ?? '',
    confidence_score: extracted.confidence_score ?? null,
  })
}



