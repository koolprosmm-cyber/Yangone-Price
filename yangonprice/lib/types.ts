export interface ExtractedSignal {
  township: string
  property_type: string
  price_lakh: number | null
  size_sqft: number | null
  price_per_sqft_lakh: number | null
}

export interface PricePosition {
  user_price_per_sqft_lakh: number | null
  market_avg_per_sqft_lakh: number | null
  position: 'ABOVE' | 'BELOW' | 'AT_MARKET' | 'UNKNOWN'
  delta_percent: number | null
  gap_narrative: string
}

export interface PigAnalysis {
  policy: string
  institutions: string
  governance: string
}

export interface AnalysisResponse {
  // Core signal extracted from listing
  extracted_signal: ExtractedSignal
  // Also support legacy field name from old analyses
  extracted_data?: {
    township?: string
    property_type?: string
    price_lakh?: number | null
    building_size_sqft?: number | null
  }

  verdict: 'BUY' | 'WAIT' | 'AVOID'
  verdict_reason: string

  market_summary: string
  price_position: PricePosition
  pig_analysis: PigAnalysis

  key_findings: string[]
  red_flags: string[]
  listing_gaps: string

  next_steps: string[]

  investment_potential: 'Strong Potential' | 'Moderate Potential' | 'Limited Potential'
  confidence: 'High' | 'Medium' | 'Low'
  confidence_reason: string

  // Server-added metadata
  mode?: 'buyer' | 'seller'
  trust_metadata?: ReportTrustMetadata

  // Legacy fields — kept so old saved analyses still render
  decision?: string
  suggested_next_steps?: string[]
  potential_risks?: string[]
  market_intelligence?: string
  market_observations?: string
  confidence_explanation?: string
}

export interface ReportTrustMetadata {
  generatedAt: string
  aiModel: string
  knowledgeBaseVersion: number
  dataFreshnessSummary: string
}

export interface MarketDataRow {
  id: string
  township: string | null
  property_type: string | null
  price_lakh: number | null
  building_size_sqft: number | null
  land_size: string | null
  bedrooms: number | null
  bathrooms: number | null
  floors: number | null
  extraction_notes: string | null
  market_data_type: string | null
  reliability_tier?: string | null
  created_at?: string | null
}

export interface ComparableRow {
  id: string
  township: string
  property_type: string
  price_total_lakhs: number
  area_sqft: number
  price_per_sqft_lakhs: number
  notes: string | null
  uploaded_by: string
  created_at: string
}
