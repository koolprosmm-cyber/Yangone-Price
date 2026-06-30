export interface ExtractedData {
  property_type: string
  township: string
  location: string
  price_lakh: number | null
  building_size_sqft: number | null
  land_size: string
  bedrooms: number | null
  bathrooms: number | null
  floors: number | null
  amenities: string[]
  special_features: string[]
  missing_fields_note: string
}

export interface PriceAnalysis {
  user_price_per_sqft_lakh: number | null
  market_average_per_sqft_lakh: number | null
  // Computed server-side:
  position: 'BELOW' | 'AVERAGE' | 'ABOVE' | 'UNKNOWN'
  delta_percent: number | null
}

export interface AnalysisResponse {
  extracted_data: ExtractedData
  price_analysis: PriceAnalysis
  decision: 'BUY' | 'WAIT' | 'AVOID' | 'COMPETITIVE' | 'OVERPRICED' | 'UNDERPRICED'
  mode?: 'buyer' | 'seller'
  investment_potential: 'Strong Potential' | 'Moderate Potential' | 'Limited Potential'
  investment_potential_reasoning: string
  key_findings: string[]
  market_observations: string
  potential_strengths: string[]
  potential_risks: string[]
  missing_information: string[]
  questions_to_verify: string[]
  suggested_next_steps: string[]
  confidence: 'High' | 'Medium' | 'Low'
  confidence_explanation: string
  method_note: string
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
